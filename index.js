import { Client, GatewayIntentBits, Collection, AttachmentBuilder, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import db from './utils/database.js';
import { calculateLevel, getXPProgress, getRandomXP, calculateBoostMultiplier, addLevels } from './utils/xpSystem.js';
import { generateRankCard } from './utils/cardGenerator.js';
import { initializeNightBoost, getNightBoostMultiplier } from './utils/timeBoost.js';
import { isStaff } from './utils/helpers.js';
import { connectMongoDB, saveUserToMongo, saveBoostsToMongo, isMongoConnected } from './utils/mongoSync.js';
import express from 'express';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a MongoDB en startup
const mongoConnected = await connectMongoDB();

// Pasar funciones de MongoDB a la base de datos
db.setMongoSync({ saveUserToMongo, saveBoostsToMongo });

// Cargar datos desde MongoDB si está conectado
if (mongoConnected) {
  try {
    const { getAllUsersFromMongo, getAllBoostsFromMongo } = await import('./utils/mongoSync.js');
    const mongoUsers = await getAllUsersFromMongo();
    const mongoBoosts = await getAllBoostsFromMongo();
    
    // Cargar usuarios desde MongoDB
    if (mongoUsers && mongoUsers.length > 0) {
      for (const user of mongoUsers) {
        const key = `${user.guildId}-${user.userId}`;
        db.users[key] = user;
      }
      console.log(`✅ Cargados ${mongoUsers.length} usuarios desde MongoDB`);
    }
    
    // Cargar boosts desde MongoDB
    if (mongoBoosts) {
      db.boosts = mongoBoosts;
      console.log('✅ Boosts cargados desde MongoDB');
    }
  } catch (error) {
    console.error('Error cargando datos desde MongoDB:', error.message);
  }
}

// Cliente de Discord (definido antes de los endpoints para poder usarlo en la API)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();

// Sincronizar datos a MongoDB cada 2 minutos (backup adicional)
setInterval(async () => {
  if (isMongoConnected()) {
    try {
      const allUsers = Object.values(db.users);
      for (const user of allUsers) {
        await saveUserToMongo(user.guildId, user.userId, user);
      }
      await saveBoostsToMongo(db.boosts);
    } catch (error) {
      console.error('Error en sincronización:', error.message);
    }
  }
}, 2 * 60 * 1000);

// Servidor HTTP para Render, Uptime Robot y Dashboard Web
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));

const userCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

function getDiscordUserFromCache(userId) {
  if (client && client.isReady()) {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    const discordUser = client.users.cache.get(userId);
    if (discordUser) {
      const data = {
        username: discordUser.username,
        displayName: discordUser.displayName || discordUser.username,
        avatar: discordUser.displayAvatarURL({ format: 'png', size: 64 })
      };
      userCache.set(userId, { data, timestamp: Date.now() });
      return data;
    }
  }
  return null;
}

async function fetchDiscordUsersBatch(userIds) {
  const results = new Map();
  const toFetch = [];
  
  for (const userId of userIds) {
    const cached = getDiscordUserFromCache(userId);
    if (cached) {
      results.set(userId, cached);
    } else {
      toFetch.push(userId);
    }
  }
  
  if (client && client.isReady() && toFetch.length > 0) {
    const batchSize = 10;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const fetchPromises = batch.map(userId => 
        client.users.fetch(userId)
          .then(user => ({ userId, user }))
          .catch(() => ({ userId, user: null }))
      );
      
      const batchResults = await Promise.race([
        Promise.all(fetchPromises),
        new Promise(resolve => setTimeout(() => resolve([]), 5000))
      ]);
      
      for (const result of batchResults) {
        if (result && result.user) {
          const data = {
            username: result.user.username,
            displayName: result.user.displayName || result.user.username,
            avatar: result.user.displayAvatarURL({ format: 'png', size: 64 })
          };
          userCache.set(result.userId, { data, timestamp: Date.now() });
          results.set(result.userId, data);
        }
      }
    }
  }
  
  return results;
}

app.get('/api/leaderboard', async (req, res) => {
  try {
    const allUsers = Object.values(db.users);
    
    const sortedUsers = allUsers
      .filter(user => user.totalXp > 0)
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 500);
    
    const userIds = sortedUsers.map(u => u.userId);
    const discordInfoMap = await fetchDiscordUsersBatch(userIds);
    
    const usersWithDiscordInfo = sortedUsers.map(user => {
      const discordInfo = discordInfoMap.get(user.userId) || { username: null, displayName: null, avatar: null };
      return { ...user, ...discordInfo };
    });
    
    res.json({
      total: allUsers.length,
      users: usersWithDiscordInfo
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Error al obtener el leaderboard' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const allUsers = Object.values(db.users);
    const totalXp = allUsers.reduce((sum, user) => sum + (user.totalXp || 0), 0);
    const maxLevel = Math.max(...allUsers.map(u => u.level || 0), 0);
    
    res.json({
      totalUsers: allUsers.length,
      totalXp: totalXp,
      highestLevel: maxLevel
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor web escuchando en puerto ${PORT}`);
  console.log(`📍 URLs disponibles:`);
  console.log(`   - http://localhost:${PORT}/         (Dashboard)`);
  console.log(`   - http://localhost:${PORT}/health   (Uptime Robot)`);
  console.log(`   - http://localhost:${PORT}/api/leaderboard  (API)`);
});

const commandFolders = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFolders) {
  const command = await import(`./commands/${file}`);
  if (command.default && command.default.data && command.default.execute) {
    client.commands.set(command.default.data.name, command.default);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  initializeNightBoost();
  
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  
  try {
    console.log('📝 Registering slash commands...');
    
    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commands }
      );
    }
    
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  if (CONFIG.NO_XP_CHANNELS.includes(message.channel.id)) return;
  
  if (db.isChannelBanned(message.channel.id)) return;
  
  if (db.isUserBanned(message.author.id)) return;
  
  const cooldown = db.checkCooldown('xp', message.author.id);
  if (cooldown) return;
  
  const member = message.member;
  const userData = db.getUser(message.guild.id, message.author.id);
  
  let xpGain = getRandomXP();
  
  const boosts = db.getActiveBoosts(message.author.id, message.channel.id);
  
  let baseMultiplier = 1.0;
  if (member.roles.cache.has(CONFIG.BOOSTER_ROLE_ID) || member.roles.cache.has(CONFIG.VIP_ROLE_ID)) {
    baseMultiplier += CONFIG.BOOSTER_VIP_MULTIPLIER;
  }
  
  const nightBoost = getNightBoostMultiplier();
  const boostMultiplier = calculateBoostMultiplier(boosts);
  const totalMultiplier = baseMultiplier + nightBoost + (boostMultiplier - 1.0);
  
  xpGain = Math.floor(xpGain * totalMultiplier);
  
  const oldLevel = userData.level;
  userData.totalXp += xpGain;
  userData.level = calculateLevel(userData.totalXp);
  
  db.saveUser(message.guild.id, message.author.id, userData);
  db.setCooldown('xp', message.author.id, CONFIG.XP_COOLDOWN);
  
  if (userData.level > oldLevel) {
    await handleLevelUp(message, member, userData, oldLevel);
  }
});

async function handleLevelUp(message, member, userData, oldLevel) {
  const levelUpChannel = message.guild.channels.cache.get(CONFIG.LEVEL_UP_CHANNEL_ID);
  if (!levelUpChannel) return;
  
  for (let level = oldLevel + 1; level <= userData.level; level++) {
    if (CONFIG.LEVEL_ROLES[level]) {
      const roleId = CONFIG.LEVEL_ROLES[level];
      try {
        const role = await message.guild.roles.fetch(roleId).catch(() => null);
        if (role && !member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
          console.log(`✅ Rol agregado al nivel ${level} para ${member.user.tag}`);
        }
      } catch (error) {
        console.error(`Error adding role for level ${level}:`, error);
      }
    }
  }
  
  try {
    const progress = getXPProgress(userData.totalXp, userData.level);
    const cardBuffer = await generateRankCard(member, userData, progress);
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup.png' });
    
    await levelUpChannel.send({
      content: `🎉 ¡Felicidades <@${member.user.id}>! Has alcanzado el **Nivel ${userData.level}**! 🎉`,
      files: [attachment]
    });
  } catch (error) {
    console.error('Error sending level up message:', error);
    await levelUpChannel.send(`🎉 ¡Felicidades <@${member.user.id}>! Has alcanzado el **Nivel ${userData.level}**! 🎉`);
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }
  
  const message = reaction.message;
  if (!message.guild) return;
  
  if (CONFIG.NO_XP_CHANNELS.includes(message.channel.id)) return;
  if (db.isChannelBanned(message.channel.id)) return;
  if (db.isUserBanned(user.id)) return;
  
  const cooldown = db.checkCooldown('xp', user.id);
  if (cooldown) return;
  
  const member = await message.guild.members.fetch(user.id);
  const userData = db.getUser(message.guild.id, user.id);
  
  let xpGain = getRandomXP();
  
  const boosts = db.getActiveBoosts(user.id, message.channel.id);
  
  let baseMultiplier = 1.0;
  if (member.roles.cache.has(CONFIG.BOOSTER_ROLE_ID) || member.roles.cache.has(CONFIG.VIP_ROLE_ID)) {
    baseMultiplier += CONFIG.BOOSTER_VIP_MULTIPLIER;
  }
  
  const nightBoost = getNightBoostMultiplier();
  const boostMultiplier = calculateBoostMultiplier(boosts);
  const totalMultiplier = baseMultiplier + nightBoost + (boostMultiplier - 1.0);
  
  xpGain = Math.floor(xpGain * totalMultiplier);
  
  const oldLevel = userData.level;
  userData.totalXp += xpGain;
  userData.level = calculateLevel(userData.totalXp);
  
  db.saveUser(message.guild.id, user.id, userData);
  db.setCooldown('xp', user.id, CONFIG.XP_COOLDOWN);
  
  if (userData.level > oldLevel) {
    await handleLevelUp(message, member, userData, oldLevel);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const reply = { content: '❌ Hubo un error al ejecutar este comando.', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables!');
  console.log('Please set your Discord bot token:');
  console.log('1. Go to https://discord.com/developers/applications');
  console.log('2. Create or select your application');
  console.log('3. Go to the "Bot" section');
  console.log('4. Copy your bot token');
  console.log('5. Add it as DISCORD_BOT_TOKEN in the Secrets (Environment Variables)');
  process.exit(1);
}

client.login(token);
