import { Client, GatewayIntentBits, Collection, AttachmentBuilder, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import db from './utils/database.js';
import { calculateLevel, getXPProgress, getRandomXP, calculateBoostMultiplier, addLevels } from './utils/xpSystem.js';
import { generateRankCard } from './utils/cardGenerator.js';
import { initializeNightBoost, getNightBoostMultiplier } from './utils/timeBoost.js';
import { isStaff } from './utils/helpers.js';
import { connectMongoDB, saveUserToMongo, saveBoostsToMongo, isMongoConnected, saveQuestionToMongo, getQuestionsFromMongo, answerQuestionInMongo, getStreakBetween, saveStreakToMongo, updateStreakDate, getAllStreaksFromMongo, getUserMissions, updateMissionProgress } from './utils/mongoSync.js';
import express from 'express';
import cron from 'node-cron';

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
    const mongoStreaks = await getAllStreaksFromMongo();
    
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
    
    // Cargar rachas desde MongoDB
    if (mongoStreaks && mongoStreaks.length > 0) {
      console.log(`✅ Cargadas ${mongoStreaks.length} rachas desde MongoDB`);
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
const leaderboardCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora
const LEADERBOARD_CACHE_KEY = 'leaderboard-full';
const LEADERBOARD_CACHE_TIME = 5 * 60 * 1000; // 5 minutos
let leaderboardProcessing = false;

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
    // Verificar caché del leaderboard completo
    const cached = leaderboardCache.get(LEADERBOARD_CACHE_KEY);
    if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_TIME) {
      return res.json(cached.data);
    }
    
    // Si ya hay una solicitud procesándose, esperar a que termine
    if (leaderboardProcessing) {
      return res.status(503).json({ error: 'Leaderboard cargándose, intenta de nuevo en unos segundos' });
    }
    
    leaderboardProcessing = true;
    
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
      
      const response = {
        total: allUsers.length,
        users: usersWithDiscordInfo
      };
      
      // Cachear resultado
      leaderboardCache.set(LEADERBOARD_CACHE_KEY, { data: response, timestamp: Date.now() });
      
      res.json(response);
    } finally {
      leaderboardProcessing = false;
    }
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    leaderboardProcessing = false;
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

// API para Preguntas y Respuestas
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await getQuestionsFromMongo();
    res.json(questions || []);
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

app.post('/api/questions', express.json(), async (req, res) => {
  try {
    const { question, askerName } = req.body;
    
    if (!question || !askerName) {
      return res.status(400).json({ error: 'Pregunta y nombre requeridos' });
    }
    
    if (question.length > 500) {
      return res.status(400).json({ error: 'La pregunta es muy larga (máx 500 caracteres)' });
    }
    
    const savedQuestion = await saveQuestionToMongo({
      question,
      askerName,
      answered: false
    });
    
    res.json(savedQuestion);
  } catch (error) {
    console.error('Error saving question:', error);
    res.status(500).json({ error: 'Error al guardar pregunta' });
  }
});

app.post('/api/questions/:id/answer', express.json(), async (req, res) => {
  try {
    const { answer, password } = req.body;
    const { id } = req.params;
    
    // Validar contraseña (usa env var o una clave simple)
    const adminPassword = process.env.ADMIN_PASSWORD || 'cambiar-esto';
    if (password !== adminPassword) {
      return res.status(403).json({ error: 'Contraseña incorrecta' });
    }
    
    if (!answer || answer.length > 1000) {
      return res.status(400).json({ error: 'Respuesta inválida' });
    }
    
    const updatedQuestion = await answerQuestionInMongo(id, answer);
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: 'Error al responder pregunta' });
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
  
  // Sistema de Rachas
  if (isMongoConnected()) {
    try {
      const mentions = message.mentions.users.filter(u => !u.bot);
      for (const mentionedUser of mentions.values()) {
        const streak = await updateStreakDate(message.guild.id, message.author.id, mentionedUser.id);
        if (streak) {
          if (streak.updated) {
            const streakChannel = message.guild.channels.cache.get(CONFIG.LEVEL_UP_CHANNEL_ID);
            if (streakChannel) {
              streakChannel.send({
                content: `🔥 ${streak.message}\n<@${message.author.id}> y <@${mentionedUser.id}>`
              }).catch(err => console.error('Error sending streak update:', err));
            }
          } else if (streak.broken) {
            const streakChannel = message.guild.channels.cache.get(CONFIG.LEVEL_UP_CHANNEL_ID);
            if (streakChannel) {
              streakChannel.send({
                content: `😢 ${streak.message}\n<@${message.author.id}> y <@${mentionedUser.id}>`
              }).catch(err => console.error('Error sending streak broken:', err));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error procesando rachas:', error);
    }
  }
  
  // Sistema de Misiones Semanales
  if (isMongoConnected()) {
    try {
      const weekNumber = Math.ceil((new Date().getDate()) / 7);
      const year = new Date().getFullYear();
      const missions = await getUserMissions(message.guild.id, message.author.id, weekNumber, year);
      
      if (!missions) return;
      
      const msgLower = message.content.toLowerCase();
      const mentions = message.mentions.users.filter(u => !u.bot).size;
      
      const missionChannel = message.guild.channels.cache.get(CONFIG.MISSION_COMPLETE_CHANNEL_ID);
      
      // Helper function to send mission completion notification
      const sendMissionNotification = (result) => {
        if (result && result.completed && missionChannel) {
          const xpReward = result.reward?.xp || 0;
          const multiplier = result.reward?.multiplier || 0;
          const levelsReward = result.reward?.levels || 0;
          
          let rewardText = '';
          if (xpReward > 0) rewardText += `+${xpReward} XP`;
          if (multiplier > 0) rewardText += (rewardText ? ', ' : '') + `+${Math.round(multiplier * 100)}% boost`;
          if (levelsReward > 0) rewardText += (rewardText ? ', ' : '') + `+${levelsReward} nivel${levelsReward > 1 ? 'es' : ''}`;
          
          missionChannel.send({
            content: `🏆 ¡Misión Completada!\n<@${message.author.id}> completó **${result.title}** y ganó ${rewardText}`
          }).catch(err => console.error('Error sending mission complete:', err));
        }
      };
      
      // Saludador - di hola
      if ((msgLower.includes('hola') || msgLower.includes('hello') || msgLower.includes('hi')) && mentions > 0) {
        const result = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 1);
        sendMissionNotification(result);
      }
      
      // Preguntón - pregunta cómo están
      if ((msgLower.includes('¿cómo estás') || msgLower.includes('como estas') || msgLower.includes('how are you')) && mentions > 0) {
        const result = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 2);
        sendMissionNotification(result);
      }
      
      // Socializador - participa
      if (msgLower.length > 10) {
        const result = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 3);
        sendMissionNotification(result);
      }
      
      // Ayudante - ofrece ayuda
      if ((msgLower.includes('ayuda') || msgLower.includes('help') || msgLower.includes('puedo')) && mentions > 0) {
        const result = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 4);
        sendMissionNotification(result);
      }
      
      // Visitante - envía en canales
      const result5 = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 5, 0.1);
      sendMissionNotification(result5);
      
      // Comunicador - envía mensajes
      const result7 = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 7);
      sendMissionNotification(result7);
      
      // Comentarista - responde preguntas
      if ((msgLower.includes('?') && msgLower.length > 5) || msgLower.includes('respuesta')) {
        const result = await updateMissionProgress(message.guild.id, message.author.id, weekNumber, year, 9, 0.2);
        sendMissionNotification(result);
      }
    } catch (error) {
      console.error('Error procesando misiones:', error);
    }
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


// Manejador de botones
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  try {
    if (interaction.customId === 'earn_rewards') {
      const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = await import('discord.js');
      
      const select = new StringSelectMenuBuilder()
        .setCustomId('minigame_select')
        .setPlaceholder('Elige un minijuego')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('🧠 Trivia')
            .setDescription('Responde 5 preguntas')
            .setValue('trivia'),
          new StringSelectMenuOptionBuilder()
            .setLabel('✋ Piedra, Papel o Tijeras')
            .setDescription('Juega contra otro usuario')
            .setValue('rps'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🔫 Ruleta Rusa')
            .setDescription('¡Riesgoso! Juega contra otro usuario')
            .setValue('roulette'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🎮 Ahorcado Solo')
            .setDescription('3 rondas de ahorcado')
            .setValue('ahorcado_solo'),
          new StringSelectMenuOptionBuilder()
            .setLabel('👥 Ahorcado Multijugador')
            .setDescription('Host vs Adivinador')
            .setValue('ahorcado_multi')
        );
      
      const row = new (await import('discord.js')).ActionRowBuilder().addComponents(select);
      
      return interaction.reply({ content: '🎮 Elige un minijuego para jugar:', components: [row], flags: 64 });
    }
    
    if (interaction.customId.startsWith('accept_streak_')) {
      const [, proposerId, targetUserId] = interaction.customId.split('_');
      
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: '❌ Solo el usuario etiquetado puede aceptar esta racha', flags: 64 });
      }
      
      if (isMongoConnected()) {
        const { EmbedBuilder } = await import('discord.js');
        
        await saveStreakToMongo({
          guildId: interaction.guildId,
          user1Id: proposerId,
          user2Id: interaction.user.id,
          streakCount: 1,
          status: 'active'
        });
        
        const embed = new EmbedBuilder()
          .setColor('#39FF14')
          .setTitle('🔥 ¡Racha iniciada!')
          .setDescription(`¡Felicidades! <@${proposerId}> y <@${interaction.user.id}> comenzaron una racha de 1 día`)
          .addFields({ name: 'Regla', value: 'Mensajeen con menciones todos los días para mantenerla' });
        
        await interaction.reply({ embeds: [embed] });
        console.log(`✅ Racha creada entre ${proposerId} y ${interaction.user.id}`);
      }
    }
    
    if (interaction.customId.startsWith('reject_streak_')) {
      const [, proposerId, targetUserId] = interaction.customId.split('_');
      
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: '❌ Solo el usuario etiquetado puede rechazar esta racha', flags: 64 });
      }
      
      await interaction.reply({ content: '❌ Se rechazó la propuesta de racha', flags: 64 });
      console.log(`❌ Racha rechazada por ${interaction.user.id}`);
    }
  } catch (error) {
    console.error('Error manejando botón:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Error al procesar tu acción', flags: 64 });
    }
  }
});

// Manejador de select menus para minijuegos y tarjetas
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  
  if (interaction.customId === 'minigame_select') {
    const selected = interaction.values[0];
    
    if (selected === 'trivia') {
      return interaction.reply({ content: 'Usa `/minigame trivia` para jugar trivia', flags: 64 });
    } else if (selected === 'rps') {
      return interaction.reply({ content: 'Usa `/minigame rps @usuario` para jugar Piedra, Papel o Tijeras', flags: 64 });
    } else if (selected === 'roulette') {
      return interaction.reply({ content: 'Usa `/minigame roulette @usuario` para jugar Ruleta Rusa', flags: 64 });
    } else if (selected === 'ahorcado_solo') {
      return interaction.reply({ content: 'Usa `/ahorcado solo` para jugar Ahorcado', flags: 64 });
    } else if (selected === 'ahorcado_multi') {
      return interaction.reply({ content: 'Usa `/ahorcado multi` para jugar Ahorcado Multijugador', flags: 64 });
    }
  }
  
  if (interaction.customId === 'rankcard_theme_select') {
    try {
      const selected = interaction.values[0];
      const userData = db.getUser(interaction.guildId, interaction.user.id);
      
      db.saveUser(interaction.guildId, interaction.user.id, {
        selectedCardTheme: selected
      });
      
      return interaction.reply({ content: `✅ Tema actualizado a **${selected}**. Usa `/level` para ver tu nueva tarjeta`, flags: 64 });
    } catch (error) {
      console.error('Error seleccionando tema de tarjeta:', error);
      return interaction.reply({ content: '❌ Error al actualizar tema', flags: 64 });
    }
  }
});

// Manejador de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Hubo un error al ejecutar este comando.', flags: 64 });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: '❌ Hubo un error al ejecutar este comando.' });
    }
  }
});

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
