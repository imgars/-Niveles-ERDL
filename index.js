import { Client, GatewayIntentBits, Collection, AttachmentBuilder, REST, Routes, EmbedBuilder } from 'discord.js';
import { CONFIG } from './config.js';
import db from './utils/database.js';
import { calculateLevel, getXPProgress, getRandomXP, calculateBoostMultiplier, addLevels } from './utils/xpSystem.js';
import { generateRankCard } from './utils/cardGenerator.js';
import { initializeNightBoost, getNightBoostMultiplier } from './utils/timeBoost.js';
import { isStaff } from './utils/helpers.js';
import { connectMongoDB, saveUserToMongo, saveBoostsToMongo, isMongoConnected, saveQuestionToMongo, getQuestionsFromMongo, answerQuestionInMongo, getAllStreaksFromMongo, getUserMissions, updateMissionProgress, getEconomy, addLagcoins } from './utils/mongoSync.js';
import { logActivity, getLogs, getUserLogs, getLogStats, LOG_TYPES } from './utils/activityLogger.js';
import { checkAndBreakExpiredStreaks, acceptStreakRequest, rejectStreakRequest, recordMessage, deleteStreak, getStreakBetween, getAllActiveStreaks, STREAK_BREAK_CHANNEL_ID } from './utils/streakService.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// 1. Endpoints de salud (PRIMERO DE TODO, antes de cualquier middleware)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 2. Middlewares de procesamiento
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 3. Middleware de mantenimiento
app.use((req, res, next) => {
  // Ruta para desbloquear (bypass)
  if (req.path === '/unlock-maintenance' && req.method === 'POST') {
    const { password } = req.body;
    if (password === '14425140512.SirgioTeam') {
      res.cookie('maintenance_bypass', 'true', { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      return res.redirect('/');
    }
    return res.status(403).send('Clave incorrecta');
  }

  // Verificar si tiene la cookie de bypass
  if (req.cookies.maintenance_bypass === 'true') {
    return next();
  }

  if (db.settings && db.settings.maintenanceMode) {
    // Si es una petición API, devolver JSON (excepto health/ping que ya se manejaron)
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({ error: 'Sitio en mantenimiento' });
    }

    // De lo contrario, mostrar página de mantenimiento
    return res.status(503).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mantenimiento - Discord Bot</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2c2f33; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { background: #23272a; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); max-width: 400px; width: 90%; }
              h1 { color: #7289da; margin-bottom: 1rem; }
              p { font-size: 1.1rem; margin-bottom: 2rem; }
              .admin-login { margin-top: 2rem; border-top: 1px solid #4f545c; padding-top: 1rem; }
              input { background: #40444b; border: 1px solid #202225; color: white; padding: 10px; border-radius: 4px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
              button { background: #5865f2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
              button:hover { background: #4752c4; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🛠️ Página en Mantenimiento</h1>
              <p>Estamos realizando mejoras. Por favor, vuelve más tarde.</p>
              
              <div class="admin-login">
                  <form action="/unlock-maintenance" method="POST">
                      <input type="password" name="password" placeholder="Clave de Admin" required>
                      <button type="submit">Desbloquear Acceso</button>
                  </form>
              </div>
          </div>
      </body>
      </html>
    `);
  }
  next();
});

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

app.get('/api/boosts', (req, res) => {
  try {
    const now = Date.now();
    
    const allActiveBoosts = db.getActiveBoosts(null, null);
    
    const globalBoosts = allActiveBoosts
      .filter(b => !b.userId && !b.channelId)
      .map(boost => ({
        type: 'global',
        multiplier: boost.multiplier,
        expiresAt: boost.expiresAt,
        timeLeft: boost.expiresAt ? Math.max(0, boost.expiresAt - now) : null,
        addedBy: boost.addedBy || 'Sistema'
      }));
    
    let userBoostCount = 0;
    let channelBoostCount = 0;
    
    if (db.boosts && db.boosts.users) {
      for (const userId in db.boosts.users) {
        const userBoosts = db.boosts.users[userId].filter(b => !b.expiresAt || b.expiresAt > now);
        userBoostCount += userBoosts.length;
      }
    }
    
    if (db.boosts && db.boosts.channels) {
      for (const channelId in db.boosts.channels) {
        const channelBoosts = db.boosts.channels[channelId].filter(b => !b.expiresAt || b.expiresAt > now);
        channelBoostCount += channelBoosts.length;
      }
    }
    
    res.json({
      globalBoosts,
      userBoostCount,
      channelBoostCount,
      totalActive: globalBoosts.length + userBoostCount + channelBoostCount
    });
  } catch (error) {
    console.error('Error getting boosts:', error);
    res.status(500).json({ error: 'Error al obtener boosts' });
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

// API para obtener estadísticas de usuario
app.get('/api/user-stats', async (req, res) => {
  try {
    const { username, userId } = req.query;
    
    if (!username && !userId) {
      return res.status(400).json({ error: 'Se requiere username o userId' });
    }
    
    // Buscar usuario en Discord
    let discordUser = null;
    if (userId) {
      try {
        discordUser = await client.users.fetch(userId);
      } catch (e) {
        // Usuario no encontrado por ID, intentar buscar por username
      }
    }
    
    if (!discordUser && username) {
      // Buscar en el leaderboard cache primero (más rápido)
      const cached = leaderboardCache.get(LEADERBOARD_CACHE_KEY);
      if (cached && cached.data && cached.data.users) {
        const foundInCache = cached.data.users.find(u => {
          const searchLower = username.toLowerCase();
          return (u.username && u.username.toLowerCase().includes(searchLower)) ||
                 (u.displayName && u.displayName.toLowerCase().includes(searchLower));
        });
        
        if (foundInCache) {
          try {
            discordUser = await client.users.fetch(foundInCache.userId);
          } catch (e) {
            // Continuar con búsqueda alternativa
          }
        }
      }
      
      // Si no se encontró en cache, buscar en usuarios del bot
      if (!discordUser) {
        const allUsers = Object.values(db.users);
        const searchLower = username.toLowerCase();
        
        // Limitar búsqueda a primeros 100 usuarios para evitar timeout
        const limitedUsers = allUsers.slice(0, 100);
        
        for (const userData of limitedUsers) {
          try {
            const user = await client.users.fetch(userData.userId).catch(() => null);
            if (user && (user.username.toLowerCase().includes(searchLower) || 
                (user.globalName && user.globalName.toLowerCase().includes(searchLower)))) {
              discordUser = user;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    if (!discordUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const targetUserId = discordUser.id;
    const guildId = client.guilds.cache.first()?.id; // Obtener el primer guild disponible
    
    if (!guildId) {
      return res.status(500).json({ error: 'No hay servidores disponibles' });
    }
    
    // Obtener datos del usuario
    const userData = db.getUser(guildId, targetUserId);
    const member = await client.guilds.cache.get(guildId)?.members.fetch(targetUserId).catch(() => null);
    
    // Obtener datos de economía
    const { getUserEconomy, getUserProfile, getUserNationality, getUserActivePowerups } = await import('./utils/economyDB.js');
    const economy = await getUserEconomy(guildId, targetUserId);
    
    // Importar funciones de XP
    const { getXPProgress, getBoostTextForCard } = await import('./utils/xpSystem.js');
    
    // Obtener posición en leaderboard
    const allUsers = Object.values(db.users);
    const sortedUsers = allUsers
      .filter(u => u.totalXp > 0)
      .sort((a, b) => b.totalXp - a.totalXp);
    const leaderboardPosition = sortedUsers.findIndex(u => u.userId === targetUserId) + 1;
    
    // Obtener boosts activos
    const activeBoosts = db.getActiveBoosts(targetUserId, null);
    const boostList = activeBoosts.map(b => ({
      type: b.type || 'user',
      multiplier: b.multiplier,
      expiresAt: b.expiresAt,
      description: b.description || 'Boost activo'
    }));
    
    // Obtener power-ups activos
    const powerups = getUserActivePowerups(guildId, targetUserId);
    const powerupList = powerups.map(p => ({
      type: p.type,
      value: p.value,
      expiresAt: p.expiresAt
    }));
    
    // Obtener rachas
    const { getUserStreaks, getStreakStats } = await import('./utils/streakService.js');
    const streakStats = await getStreakStats(guildId, targetUserId);
    const activeStreaks = await getUserStreaks(guildId, targetUserId);
    
    // Obtener misiones
    const weekNumber = Math.ceil((new Date().getDate()) / 7);
    const year = new Date().getFullYear();
    const { getUserMissions, getMissionsStats } = await import('./utils/mongoSync.js');
    const missions = await getUserMissions(guildId, targetUserId, weekNumber, year);
    const missionsStats = await getMissionsStats(guildId, targetUserId, weekNumber, year);
    
    // Calcular misiones completadas
    let completedMissions = 0;
    if (missionsStats && missionsStats.missions) {
      completedMissions = missionsStats.missions.filter(m => m.completed).length;
    }
    
    // Obtener nacionalidad
    const nationality = getUserNationality(guildId, targetUserId);
    
    // Calcular estadísticas de robos (desde transacciones)
    const transactions = economy.transactions || [];
    // Robos exitosos: transacciones donde el usuario ganó dinero por robar
    const successfulRobberies = transactions.filter(t => 
      (t.type === 'rob' && t.amount > 0) || 
      (t.type === 'bank_heist' && t.amount > 0)
    ).length;
    // Veces que le robaron: transacciones donde perdió dinero por ser robado
    const timesRobbed = transactions.filter(t => 
      (t.type === 'rob' && t.amount < 0) ||
      (t.type === 'rob_victim' && t.amount < 0)
    ).length;
    
    // Calcular win rate de casino
    const casinoStats = economy.casinoStats || { plays: 0, wins: 0 };
    const casinoWinRate = casinoStats.plays > 0 ? ((casinoStats.wins / casinoStats.plays) * 100).toFixed(1) : 0;
    
    // Calcular win rate de minijuegos
    const minigamesWon = economy.minigamesWon || 0;
    // No hay tracking de minijuegos jugados, así que usaremos una estimación basada en wins
    const minigameWinRate = minigamesWon > 0 ? 'N/A' : '0%';
    
    // Obtener trabajos disponibles (basado en items)
    const items = economy.items || [];
    const economyDB = await import('./utils/economyDB.js');
    const { JOBS, COUNTRIES } = economyDB;
    const availableJobs = Object.keys(JOBS).filter(jobId => {
      const job = JOBS[jobId];
      if (!job.itemsNeeded || job.itemsNeeded.length === 0) return true;
      return job.itemsNeeded.every(itemId => items.includes(itemId));
    });
    
    // Obtener tema de rankcard actual
    const selectedTheme = userData.selectedCardTheme || 'discord';
    const purchasedCards = userData.purchasedCards || [];
    
    // Generar rankcard
    let rankcardImage = null;
    try {
      const { generateRankCard } = await import('./utils/cardGenerator.js');
      const progress = getXPProgress(userData.totalXp || 0, userData.level || 0);
      const boosts = db.getActiveBoosts(targetUserId, null);
      const boostCardText = getBoostTextForCard(boosts);
      
      if (member) {
        const cardBuffer = await generateRankCard(member, userData, progress, boostCardText);
        rankcardImage = `data:image/png;base64,${cardBuffer.toString('base64')}`;
      }
    } catch (error) {
      console.error('Error generando rankcard:', error);
    }
    
    // Obtener avatar
    const avatar = discordUser.displayAvatarURL({ format: 'png', size: 256 });
    
    // Calcular veces trabajado
    const timesWorked = economy.jobStats?.totalJobs || 0;
    
    // Obtener items del inventario
    const inventoryItems = economy.inventory || [];
    const itemsList = items.map(itemId => {
      return economyDB.ITEMS[itemId] || { name: itemId, emoji: '❓' };
    });
    
    const stats = {
      // Información básica
      userId: targetUserId,
      username: discordUser.username,
      displayName: discordUser.globalName || discordUser.username,
      avatar: avatar,
      rankcardImage: rankcardImage,
      
      // Niveles y XP
      level: userData.level || 0,
      totalXp: userData.totalXp || 0,
      xpProgress: getXPProgress(userData.totalXp || 0, userData.level || 0),
      
      // Leaderboard
      leaderboardPosition: leaderboardPosition || null,
      
      // Economía
      lagcoins: economy.lagcoins || 0,
      bankBalance: economy.bankBalance || 0,
      marriedTo: economy.marriedTo || null,
      isMarried: !!economy.marriedTo,
      
      // Robos
      successfulRobberies: successfulRobberies,
      timesRobbed: timesRobbed,
      
      // Boosts y Power-ups
      activeBoosts: boostList,
      activePowerups: powerupList,
      
      // Rankcard
      selectedCardTheme: selectedTheme,
      purchasedCards: purchasedCards,
      
      // Misiones
      completedMissions: completedMissions,
      totalMissions: missionsStats?.missions?.length || 0,
      
      // Rachas
      activeStreaks: activeStreaks.length,
      brokenStreaks: streakStats?.brokenCount || 0,
      longestStreak: streakStats?.longestStreak || 0,
      totalStreakDays: streakStats?.totalDays || 0,
      streakDetails: activeStreaks.map(s => ({
        partnerId: s.partnerId,
        days: s.streakCount,
        status: s.status
      })),
      
      // Minijuegos
      minigamesWon: minigamesWon,
      minigameWinRate: minigameWinRate,
      
      // Casino
      casinoPlays: casinoStats.plays || 0,
      casinoWins: casinoStats.wins || 0,
      casinoWinRate: `${casinoWinRate}%`,
      casinoTotalWon: casinoStats.totalWon || 0,
      casinoTotalLost: casinoStats.totalLost || 0,
      
      // Trabajos
      timesWorked: timesWorked,
      availableJobs: availableJobs.length,
      totalJobsAvailable: Object.keys(economyDB.JOBS).length,
      favoriteJob: economy.jobStats?.favoriteJob || null,
      
      // Nacionalidad
      nationality: nationality ? {
        country: nationality.country,
        currentCountry: nationality.currentCountry || nationality.country,
        emoji: nationality.country ? COUNTRIES[nationality.country]?.emoji : null,
        name: nationality.country ? COUNTRIES[nationality.country]?.name : null
      } : null,
      
      // Items
      items: itemsList,
      inventoryCount: inventoryItems.length,
      
      // Comandos usados (no hay tracking, devolver 0)
      commandsUsed: 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuario:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/api/diff', async (req, res) => {
  res.json({
    message: "Comparación realizada con el repositorio de GitHub",
    differences: [
      "Nuevos endpoints de API para estadísticas de usuario (/api/user-stats)",
      "Panel de administración web completo (public/admin)",
      "Configuración de despliegue para Replit/Render",
      "Mejoras en el sistema de cache del leaderboard"
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor web escuchando en puerto ${PORT}`);
  console.log(`📍 URLs disponibles:`);
  console.log(`   - http://localhost:${PORT}/         (Dashboard)`);
  console.log(`   - http://localhost:${PORT}/health   (Uptime Robot)`);
  console.log(`   - http://localhost:${PORT}/api/leaderboard  (API)`);
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(`📂 Encontrados ${commandFiles.length} archivos de comandos`);

let loadedCount = 0;
let failedCount = 0;

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (command.default && command.default.data && command.default.execute) {
      client.commands.set(command.default.data.name, command.default);
      loadedCount++;
    } else {
      console.warn(`⚠️ Comando ${file} no tiene la estructura correcta (data/execute)`);
      failedCount++;
    }
  } catch (error) {
    console.error(`❌ Error cargando comando ${file}:`, error.message);
    failedCount++;
  }
}

console.log(`✅ Comandos cargados: ${loadedCount}/${commandFiles.length}`);
if (failedCount > 0) {
  console.log(`⚠️ Comandos fallidos: ${failedCount}`);
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  client.user.setActivity('/info para ver mas información sobre el bot', { type: 0 });
  
  initializeNightBoost();
  
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  
  try {
    console.log(`📝 Registrando ${commands.length} comandos slash...`);
    
    for (const guild of client.guilds.cache.values()) {
      console.log(`   📍 Registrando en servidor: ${guild.name} (${guild.id})`);
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commands }
      );
    }
    
    console.log(`✅ ${commands.length} comandos registrados exitosamente!`);
    console.log(`📋 Comandos: ${commands.map(c => c.name).join(', ')}`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
  
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Verificando rachas expiradas...');
    try {
      const brokenStreaks = await checkAndBreakExpiredStreaks(client);
      if (brokenStreaks.length > 0) {
        console.log(`💔 Se rompieron ${brokenStreaks.length} rachas`);
      } else {
        console.log('✅ No hay rachas expiradas');
      }
    } catch (error) {
      console.error('Error verificando rachas:', error);
    }
  }, {
    timezone: 'America/Caracas'
  });
  
  cron.schedule('0 20 * * *', async () => {
    console.log('🔔 Enviando recordatorios de racha...');
    try {
      const allActiveStreaks = await getAllActiveStreaks();
      const today = new Date().toISOString().split('T')[0];

      for (const streak of allActiveStreaks) {
        const guild = client.guilds.cache.get(streak.guildId);
        if (!guild) continue;

        const usersToNotify = [];
        if (streak.user1LastMessage && streak.user1LastMessage.toISOString().split('T')[0] !== today) {
          usersToNotify.push(streak.user1Id);
        }
        if (streak.user2LastMessage && streak.user2LastMessage.toISOString().split('T')[0] !== today) {
          usersToNotify.push(streak.user2Id);
        }

        if (usersToNotify.length > 0) {
          const channel = guild.channels.cache.get(STREAK_BREAK_CHANNEL_ID);
          if (channel) {
            const mentions = usersToNotify.map(id => `<@${id}>`).join(' y ');
            const partnerId = usersToNotify.length === 1 ? (usersToNotify[0] === streak.user1Id ? streak.user2Id : streak.user1Id) : null;
            
            const reminderEmbed = new EmbedBuilder()
              .setColor(0xFFA500)
              .setTitle('🔥 ¡No pierdas tu racha!')
              .setDescription(`${mentions}, aún no han interactuado hoy para mantener su racha de **${streak.streakCount} días**.`)
              .setFooter({ text: 'Tienen hasta medianoche para enviar un mensaje mencionándose.' })
              .setTimestamp();

            await channel.send({ content: mentions, embeds: [reminderEmbed] });
          }
        }
      }
    } catch (error) {
      console.error('Error enviando recordatorios de racha:', error);
    }
  }, {
    timezone: 'America/Caracas'
  });

  console.log('⏰ Cron job para verificar rachas configurado (diario a medianoche)');

  // Cron job para verificar inactividad (cada 6 horas)
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔍 Verificando usuarios inactivos...');
    const inactiveRoleId = '1455315291532693789';
    const notificationChannelId = '1441276918916710501';
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const guild of client.guilds.cache.values()) {
      const allUsers = db.getAllUsers(guild.id);
      const channel = guild.channels.cache.get(notificationChannelId);

      for (const userData of allUsers) {
        if (userData.isInactive) continue;

        const lastActivity = userData.lastActivity || 0;
        // Solo procesar si el usuario tiene alguna actividad registrada
        if (lastActivity === 0) continue;

        if (now - lastActivity > SEVEN_DAYS_MS) {
          try {
            const member = await guild.members.fetch(userData.userId).catch(() => null);
            if (!member) continue;

            userData.isInactive = true;
            userData.inactivityMessages = 0;
            db.saveUser(guild.id, userData.userId, userData);

            await sendAuditLog(client, { guild, user: member.user, channelId: notificationChannelId }, 'Usuario Inactivo', `El usuario ha sido marcado como inactivo por pasar más de 7 días sin mensajes.`);

            if (!member.roles.cache.has(inactiveRoleId)) {
              await member.roles.add(inactiveRoleId).catch(console.error);
            }

            if (channel) {
              const inactiveEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ Estado de Inactividad')
                .setDescription(`El usuario <@${userData.userId}> ha entrado en estado de inactividad por pasar más de 7 días sin enviar mensajes.`)
                .addFields({ name: 'Requisito para salir', value: 'Debe enviar 50 mensajes para recuperar su estado normal.' })
                .setTimestamp();
              
              await channel.send({ content: `<@${userData.userId}>`, embeds: [inactiveEmbed] });
            }

            // Añadir [Inactivo] al nombre
            if (member.manageable) {
              const oldNickname = member.nickname || member.user.username;
              if (!oldNickname.startsWith('[Inactivo] ')) {
                await member.setNickname(`[Inactivo] ${oldNickname}`).catch(console.error);
              }
            }
          } catch (error) {
            console.error(`Error procesando inactividad para ${userData.userId}:`, error);
          }
        }
      }
    }
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // Manejar comando prefix !afk
  if (message.content.toLowerCase().startsWith('!afk')) {
    const args = message.content.split(' ');
    const reason = args.slice(1).join(' ') || 'No especificado';
    const userData = db.getUser(message.guild.id, message.author.id);
    
    userData.afk = {
      status: true,
      reason: reason,
      timestamp: Date.now()
    };
    
    db.saveUser(message.guild.id, message.author.id, userData);

    await sendAuditLog(client, message, 'AFK Activado', `**Motivo:** ${reason}`);

    // Cambiar nombre a [AFK]
    if (message.member && message.member.manageable) {
      const oldNickname = message.member.nickname || message.author.username;
      if (!oldNickname.startsWith('[AFK] ')) {
        message.member.setNickname(`[AFK] ${oldNickname}`).catch(console.error);
      }
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00) // Amarillo
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTitle('Estado ausente establecido.')
      .setDescription(`**Motivo:** ${reason}\n\n-# Avisaré a quienes te mencionan ⭐`)
      .setThumbnail(message.author.displayAvatarURL());
      
    return message.reply({ embeds: [embed] });
  }
  
  // Manejar comando prefix !level
  if (message.content.toLowerCase().startsWith('!level')) {
    try {
      const command = client.commands.get('level');
      if (!command) return;
      
      const args = message.content.split(' ');
      const targetUser = message.mentions.users.first() || message.author;
      
      const interactionAdapter = {
        user: message.author,
        guild: message.guild,
        channelId: message.channelId,
        options: {
          getUser: () => targetUser
        },
        reply: (options) => message.reply(options)
      };
      
      await command.execute(interactionAdapter);
      return;
    } catch (error) {
      console.error('Error in !level command:', error);
    }
  }
  
  // Manejar comando prefix !lb
  if (message.content.toLowerCase().startsWith('!lb')) {
    try {
      const command = client.commands.get('lb');
      if (!command) return;
      
      const interactionAdapter = {
        user: message.author,
        guild: message.guild,
        deferReply: () => Promise.resolve(),
        editReply: (options) => message.reply(options)
      };
      
      await command.execute(interactionAdapter);
      return;
    } catch (error) {
      console.error('Error in !lb command:', error);
    }
  }
  
  // Manejar comando prefix !leaderboard
  if (message.content.toLowerCase().startsWith('!leaderboard')) {
    try {
      const command = client.commands.get('leaderboard');
      if (!command) return;
      
      const interactionAdapter = {
        user: message.author,
        guild: message.guild,
        deferReply: () => Promise.resolve(),
        editReply: (options) => message.reply(options)
      };
      
      await command.execute(interactionAdapter);
      return;
    } catch (error) {
      console.error('Error in !leaderboard command:', error);
    }
  }
  
  // Manejar AFK - Quitar si el usuario envía un mensaje
  const authorData = db.getUser(message.guild.id, message.author.id);
  if (authorData.afk && authorData.afk.status) {
    authorData.afk.status = false;
    authorData.afk.reason = null;
    authorData.afk.timestamp = null;
    db.saveUser(message.guild.id, message.author.id, authorData);

    // Quitar [AFK] del nombre
    if (message.member && message.member.manageable) {
      const currentNickname = message.member.nickname || '';
      if (currentNickname.startsWith('[AFK] ')) {
        message.member.setNickname(currentNickname.replace('[AFK] ', '')).catch(console.error);
      }
    }
    
    // Evitar respuestas dobles si el usuario también activó un comando
    try {
      await sendAuditLog(client, message, 'AFK Quitado', `El usuario volvió a estar activo.`);
      await message.reply({ content: `👋 ¡Bienvenido de nuevo <@${message.author.id}>! He quitado tu estado AFK.`, ephemeral: false }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      });
    } catch (e) {
      console.log('No se pudo responder al quitar AFK (posible comando simultáneo)');
    }
    return; // Detener procesamiento para este mensaje si acabamos de quitar AFK
  }

  // Manejar AFK - Avisar si mencionan a alguien AFK
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(user => {
      const mentionedData = db.getUser(message.guild.id, user.id);
      if (mentionedData.afk && mentionedData.afk.status) {
        const timeAgo = Math.floor((Date.now() - mentionedData.afk.timestamp) / 1000 / 60);
        
        const afkEmbed = new EmbedBuilder()
          .setColor(0xFFFF00) // Amarillo
          .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
          .setDescription(`💤 **${user.username}** está AFK: ${mentionedData.afk.reason} (${timeAgo} minutos)`)
          .setThumbnail(user.displayAvatarURL());

        message.reply({ 
          embeds: [afkEmbed],
          allowedMentions: { repliedUser: false }
        }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        });
      }
    });
  }
  
  // Manejar Easter Eggs
  try {
    const { handleEasterEgg } = await import('./utils/easterEggs.js');
    const eggResult = await handleEasterEgg(message, client);
    if (eggResult) return; // Si fue un Easter Egg, no procesar XP
  } catch (error) {
    // Easter eggs no disponibles, continuar
  }
  
  if (CONFIG.NO_XP_CHANNELS.includes(message.channel.id)) return;
  
  if (db.isChannelBanned(message.channel.id)) return;
  
  if (db.isUserBanned(message.author.id)) return;
  
  const cooldown = db.checkCooldown('xp', message.author.id);
  if (cooldown) return;
  
  const member = message.member;
  const memberInfo = {
    username: message.author.username,
    displayName: member?.displayName || message.author.globalName || message.author.username,
    avatar: message.author.displayAvatarURL({ size: 64 })
  };
  const userData = db.getUser(message.guild.id, message.author.id, memberInfo);
  
  // Actualizar última actividad
  userData.lastActivity = Date.now();
  userData.username = memberInfo.username;
  userData.displayName = memberInfo.displayName;
  userData.avatar = memberInfo.avatar;
  
  // Lógica de recuperación de inactividad
  if (userData.isInactive) {
    userData.inactivityMessages = (userData.inactivityMessages || 0) + 1;
    
    if (userData.inactivityMessages === 1) {
       message.channel.send(`👋 <@${message.author.id}>, has vuelto! Actualmente tienes el rol de inactividad. Para quitártelo, debes enviar **50 mensajes** (Llevas ${userData.inactivityMessages}/50).`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
    }

    if (userData.inactivityMessages >= 50) {
      userData.isInactive = false;
      userData.inactivityMessages = 0;
      
      const inactiveRoleId = '1455315291532693789';
      if (member.roles.cache.has(inactiveRoleId)) {
        member.roles.remove(inactiveRoleId).catch(console.error);
      }
      
      // Recompensa: Boost de niveles temporal (ej. 50% por 24h)
      db.addBoost('user', message.author.id, 150, 24 * 60 * 60 * 1000, 'Recompensa por recuperar actividad');
      
      const recoveryChannel = message.guild.channels.cache.get('1441276918916710501');
      if (recoveryChannel) {
        recoveryChannel.send(`🎉 ¡Felicidades <@${message.author.id}>! Has completado los 50 mensajes. Se te ha quitado el rol de inactividad y has ganado un **Boost de XP del 50% por 24 horas**.`);
      }
    }
    db.saveUser(message.guild.id, message.author.id, userData);
  } else {
    db.saveUser(message.guild.id, message.author.id, userData);
  }

  // Restricción de canal #1400931230266032149
  if (userData.isInactive && message.channel.id === '1400931230266032149') {
    message.delete().catch(() => {});
    return message.author.send("No puedes enviar mensajes en ese canal mientras estés inactivo.").catch(() => {});
  }

  let xpGain = getRandomXP();
  
  const boosts = db.getActiveBoosts(message.author.id, message.channel.id);
  
  let baseMultiplier = 1.0;
  if (member.roles.cache.has(CONFIG.BOOSTER_ROLE_ID) || member.roles.cache.has(CONFIG.VIP_ROLE_ID)) {
    baseMultiplier += CONFIG.BOOSTER_VIP_MULTIPLIER;
  }
  
  const nightBoost = getNightBoostMultiplier();
  // Aplicar penalización de inactividad al multiplicador
  const boostMultiplier = calculateBoostMultiplier(boosts, userData.isInactive);
  const totalMultiplier = baseMultiplier + nightBoost + (boostMultiplier - 1.0);
  
  xpGain = Math.floor(xpGain * totalMultiplier);
  
  const oldLevel = userData.level;
  userData.totalXp += xpGain;
  userData.level = calculateLevel(userData.totalXp);
  
  db.saveUser(message.guild.id, message.author.id, userData);
  
  // Cooldown de XP: 30s si es inactivo, 10s normal (CONFIG.XP_COOLDOWN)
  const xpCooldown = userData.isInactive ? 30000 : CONFIG.XP_COOLDOWN;
  db.setCooldown('xp', message.author.id, xpCooldown);
  
  if (userData.level > oldLevel) {
    await handleLevelUp(message, member, userData, oldLevel);
  }
  
  // Sistema de Rachas (usando nuevo streakService)
  if (isMongoConnected()) {
    try {
      const mentions = message.mentions.users.filter(u => !u.bot);
      for (const mentionedUser of mentions.values()) {
        const result = await recordMessage(message.guild.id, message.author.id, mentionedUser.id);
        if (result && result.extended) {
          const missionChannel = message.guild.channels.cache.get(CONFIG.MISSION_COMPLETE_CHANNEL_ID);
          if (missionChannel) {
            missionChannel.send({
              content: `🔥 **Racha Extendida!**\n<@${message.author.id}> y <@${mentionedUser.id}> - ${result.message}`
            }).catch(err => console.error('Error sending streak update:', err));
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
      content: `Felicidades <@${member.user.id}> Hablaste Tantas webadas que subiste a Nivel ${userData.level} ¡**GG**!`,
      files: [attachment]
    });
  } catch (error) {
    console.error('Error sending level up message:', error);
    await levelUpChannel.send(`Felicidades <@${member.user.id}> Hablaste Tantas webadas que subiste a Nivel ${userData.level} ¡**GG**!`);
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
    
    if (interaction.customId.startsWith('streak_accept_')) {
      const parts = interaction.customId.split('_');
      const proposerId = parts[2];
      const targetUserId = parts[3];
      
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: '❌ Solo el usuario etiquetado puede aceptar esta racha', flags: 64 });
      }
      
      const { EmbedBuilder } = await import('discord.js');
      const result = await acceptStreakRequest(interaction.guildId, proposerId, interaction.user.id);
      
      if (result.error) {
        const errorMessages = {
          'database_unavailable': '❌ Base de datos no disponible',
          'no_pending_request': '❌ No hay solicitud pendiente',
          'system_error': '❌ Error del sistema'
        };
        return interaction.reply({ content: errorMessages[result.error] || '❌ Error', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#39FF14')
        .setTitle('🔥 Racha Iniciada!')
        .setDescription(`Felicidades! <@${proposerId}> y <@${interaction.user.id}> comenzaron una racha!`)
        .addFields({ 
          name: '📋 Reglas', 
          value: 'Ambos deben enviarse al menos un mensaje cada dia para mantener la racha. Si pasa un dia sin que ambos hablen, la racha se rompe.' 
        })
        .setFooter({ text: 'Racha actual: 1 dia' })
        .setTimestamp();
      
      await interaction.update({ embeds: [embed], components: [] });
      console.log(`✅ Racha creada entre ${proposerId} y ${interaction.user.id}`);
    }
    
    if (interaction.customId.startsWith('streak_reject_')) {
      const parts = interaction.customId.split('_');
      const proposerId = parts[2];
      const targetUserId = parts[3];
      
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: '❌ Solo el usuario etiquetado puede rechazar esta racha', flags: 64 });
      }
      
      const result = await rejectStreakRequest(interaction.guildId, proposerId, interaction.user.id);
      
      const { EmbedBuilder } = await import('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('❌ Propuesta Rechazada')
        .setDescription(`<@${interaction.user.id}> ha rechazado la propuesta de racha.`);
      
      await interaction.update({ embeds: [embed], components: [] });
      console.log(`❌ Racha rechazada por ${interaction.user.id}`);
    }
    
    if (interaction.customId.startsWith('streak_end_confirm_')) {
      const parts = interaction.customId.split('_');
      const userId = parts[3];
      const targetUserId = parts[4];
      
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: '❌ Solo quien ejecuto el comando puede confirmar', flags: 64 });
      }
      
      const result = await deleteStreak(interaction.guildId, userId, targetUserId);
      
      if (result.error) {
        return interaction.reply({ content: '❌ Error al terminar la racha', flags: 64 });
      }
      
      const { EmbedBuilder } = await import('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('💔 Racha Terminada')
        .setDescription(`La racha entre <@${userId}> y <@${targetUserId}> ha sido terminada.`);
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId === 'streak_end_cancel') {
      const { EmbedBuilder } = await import('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('✅ Cancelado')
        .setDescription('No se termino la racha.');
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('marry_accept_')) {
      const { getUserEconomy, saveUserEconomy } = await import('./utils/economyDB.js');
      const { pendingProposals } = await import('./commands/marry.js');
      const proposalKey = interaction.customId.replace('marry_accept_', '');
      const proposal = pendingProposals.get(proposalKey);
      
      if (!proposal) {
        return interaction.reply({ content: '❌ La propuesta ha expirado', flags: 64 });
      }
      
      if (interaction.user.id !== proposal.target) {
        return interaction.reply({ content: '❌ Solo la persona a quien se le propuso puede aceptar', flags: 64 });
      }
      
      const proposerEconomy = await getUserEconomy(proposal.guildId, proposal.proposer);
      const targetEconomy = await getUserEconomy(proposal.guildId, proposal.target);
      
      const totalCoins = (proposerEconomy.lagcoins || 0) + (targetEconomy.lagcoins || 0);
      
      proposerEconomy.marriedTo = proposal.target;
      proposerEconomy.lagcoins = totalCoins;
      targetEconomy.marriedTo = proposal.proposer;
      targetEconomy.lagcoins = totalCoins;
      
      await saveUserEconomy(proposal.guildId, proposal.proposer, proposerEconomy);
      await saveUserEconomy(proposal.guildId, proposal.target, targetEconomy);
      
      pendingProposals.delete(proposalKey);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('💕 ¡Felicidades!')
        .setDescription(`<@${proposal.proposer}> y <@${proposal.target}> ahora están casados!`)
        .addFields({ name: '💰 Cartera Compartida', value: `${totalCoins} Lagcoins` })
        .setImage('https://media.tenor.com/KoR0nSZcHQYAAAAC/anime-wedding.gif');
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('marry_reject_')) {
      const { pendingProposals } = await import('./commands/marry.js');
      const proposalKey = interaction.customId.replace('marry_reject_', '');
      const proposal = pendingProposals.get(proposalKey);
      
      if (!proposal) {
        return interaction.reply({ content: '❌ La propuesta ha expirado', flags: 64 });
      }
      
      if (interaction.user.id !== proposal.target) {
        return interaction.reply({ content: '❌ Solo la persona a quien se le propuso puede rechazar', flags: 64 });
      }
      
      pendingProposals.delete(proposalKey);
      
      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('💔 Propuesta Rechazada')
        .setDescription(`<@${proposal.target}> ha rechazado la propuesta de <@${proposal.proposer}>`)
        .setImage('https://media.tenor.com/MbdLmMq8r8wAAAAC/anime-sad.gif');
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('divorce_confirm_')) {
      const { getUserEconomy, saveUserEconomy } = await import('./utils/economyDB.js');
      const userId = interaction.customId.replace('divorce_confirm_', '');
      
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: '❌ Solo quien ejecuto el comando puede confirmar', flags: 64 });
      }
      
      const userEconomy = await getUserEconomy(interaction.guildId, userId);
      if (!userEconomy.marriedTo) {
        return interaction.reply({ content: '❌ Ya no estas casado/a', flags: 64 });
      }
      
      const partnerId = userEconomy.marriedTo;
      const partnerEconomy = await getUserEconomy(interaction.guildId, partnerId);
      
      const totalCoins = (userEconomy.lagcoins || 0) + (partnerEconomy.lagcoins || 0);
      const splitAmount = Math.floor(totalCoins / 2);
      
      userEconomy.marriedTo = null;
      userEconomy.lagcoins = splitAmount;
      partnerEconomy.marriedTo = null;
      partnerEconomy.lagcoins = splitAmount;
      
      await saveUserEconomy(interaction.guildId, userId, userEconomy);
      await saveUserEconomy(interaction.guildId, partnerId, partnerEconomy);
      
      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('💔 Divorcio Completado')
        .setDescription(`<@${userId}> y <@${partnerId}> se han divorciado`)
        .addFields({ name: '💰 División de Bienes', value: `Cada uno recibió ${splitAmount} Lagcoins` });
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('divorce_cancel_')) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Cancelado')
        .setDescription('El divorcio ha sido cancelado. ¡Su matrimonio sigue en pie!');
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('deleterankcards_confirm_')) {
      const { isStaff } = await import('./utils/helpers.js');
      const userId = interaction.customId.replace('deleterankcards_confirm_', '');
      
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: '❌ Solo quien ejecuto el comando puede confirmar', flags: 64 });
      }
      
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ No tienes permisos', flags: 64 });
      }
      
      const allUsers = db.getAllUsers(interaction.guildId);
      let deletedCount = 0;
      
      for (const user of allUsers) {
        if (user.purchasedCards && user.purchasedCards.length > 0) {
          user.purchasedCards = [];
          user.selectedCardTheme = null;
          db.saveUser(interaction.guildId, user.userId, user);
          deletedCount++;
        }
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Tarjetas Eliminadas')
        .setDescription(`Se eliminaron las tarjetas de **${deletedCount}** usuarios`)
        .addFields({ name: '📋 Nota', value: 'Los usuarios conservan sus roles. Deben volver a alcanzar el nivel para recuperar las tarjetas.' });
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('deleterankcards_cancel_')) {
      const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle('✅ Cancelado')
        .setDescription('No se eliminaron las tarjetas.');
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('tradecard_accept_')) {
      const { pendingTrades } = await import('./commands/tradecard.js');
      const tradeKey = interaction.customId.replace('tradecard_accept_', '');
      const trade = pendingTrades.get(tradeKey);
      
      if (!trade) {
        return interaction.reply({ content: '❌ El regalo ha expirado', flags: 64 });
      }
      
      if (interaction.user.id !== trade.receiver) {
        return interaction.reply({ content: '❌ Solo el receptor puede aceptar', flags: 64 });
      }
      
      const senderData = db.getUser(trade.guildId, trade.sender);
      const receiverData = db.getUser(trade.guildId, trade.receiver);
      
      if (!senderData.purchasedCards || !senderData.purchasedCards.includes(trade.cardType)) {
        pendingTrades.delete(tradeKey);
        return interaction.reply({ content: '❌ El remitente ya no tiene esa tarjeta', flags: 64 });
      }
      
      senderData.purchasedCards = senderData.purchasedCards.filter(c => c !== trade.cardType);
      if (senderData.selectedCardTheme === trade.cardType) {
        senderData.selectedCardTheme = senderData.purchasedCards[0] || null;
      }
      
      if (!receiverData.purchasedCards) receiverData.purchasedCards = [];
      receiverData.purchasedCards.push(trade.cardType);
      receiverData.selectedCardTheme = trade.cardType;
      
      db.saveUser(trade.guildId, trade.sender, senderData);
      db.saveUser(trade.guildId, trade.receiver, receiverData);
      
      pendingTrades.delete(tradeKey);
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎁 ¡Regalo Aceptado!')
        .setDescription(`<@${trade.receiver}> recibió la tarjeta **${trade.cardName}** de <@${trade.sender}>!`);
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    
    if (interaction.customId.startsWith('tradecard_reject_')) {
      const { pendingTrades } = await import('./commands/tradecard.js');
      const tradeKey = interaction.customId.replace('tradecard_reject_', '');
      
      pendingTrades.delete(tradeKey);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setTitle('❌ Regalo Rechazado')
        .setDescription('El regalo ha sido rechazado.');
      
      await interaction.update({ embeds: [embed], components: [] });
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
      const { startTriviaFromMenu } = await import('./commands/minigame.js');
      return startTriviaFromMenu(interaction);
    } else if (selected === 'rps') {
      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('✋ Piedra, Papel o Tijeras')
        .setDescription('Reta a otro usuario a una partida al mejor de 5!')
        .addFields(
          { name: '🎁 Recompensa', value: '30% boost x2h', inline: true },
          { name: '⏱️ Cooldown', value: '2 horas', inline: true },
          { name: '📝 Como jugar', value: '`/minigame rps @usuario`', inline: false }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (selected === 'roulette') {
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🔫 Ruleta Rusa')
        .setDescription('⚠️ **Alto riesgo!** El perdedor pierde niveles!')
        .addFields(
          { name: '✅ Ganador', value: '+2.5 niveles', inline: true },
          { name: '❌ Perdedor', value: '-3 niveles', inline: true },
          { name: '📝 Como jugar', value: '`/minigame roulette @usuario`', inline: false }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (selected === 'ahorcado_solo') {
      const { startHangmanFromMenu } = await import('./commands/minigame.js');
      return startHangmanFromMenu(interaction);
    } else if (selected === 'ahorcado_multi') {
      const embed = new EmbedBuilder()
        .setColor(0xF39C12)
        .setTitle('👥 Ahorcado Multijugador')
        .setDescription('Juega contra otro usuario! Cada uno crea palabras para el otro.')
        .addFields(
          { name: '🎁 Recompensa', value: '+0.5 niveles', inline: true },
          { name: '⏱️ Cooldown', value: '30 minutos', inline: true },
          { name: '📝 Como jugar', value: '`/minigame ahorcados @usuario`', inline: false }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
  
  if (interaction.customId === 'help_category_select') {
    const helpCommand = client.commands.get('help');
    if (helpCommand) {
      interaction.options = {
        getString: (name) => name === 'categoria' ? interaction.values[0] : null
      };
      return helpCommand.execute(interaction);
    }
  }
  
  if (interaction.customId === 'rankcard_theme_select') {
    try {
      const selected = interaction.values[0];
      const userData = db.getUser(interaction.guildId, interaction.user.id);
      
      const THEME_NAMES = {
        pixel: '🎮 Pixel Art',
        ocean: '🌊 Océano',
        zelda: '⚔️ Zelda',
        pokemon: '🔴 Pokémon',
        geometrydash: '⚡ Geometry Dash',
        night: '🌙 Noche Estrellada',
        roblox: '🟥 Roblox',
        minecraft: '⛏️ Minecraft',
        fnaf: '🐻 FNAF'
      };
      
      userData.selectedCardTheme = selected;
      db.saveUser(interaction.guildId, interaction.user.id, userData);
      
      const themeName = THEME_NAMES[selected] || selected;
      return interaction.reply({ content: `✅ Tema actualizado a **${themeName}**. Usa \`/level\` para ver tu nueva tarjeta`, flags: 64 });
    } catch (error) {
      console.error('Error seleccionando tema de tarjeta:', error);
      return interaction.reply({ content: '❌ Error al actualizar tema', flags: 64 });
    }
  }
  
  // Manejador para compras de tienda
  if (interaction.customId.startsWith('tienda_buy_')) {
    try {
      const { buyItem, getUserEconomy, ITEMS } = await import('./utils/economyDB.js');
      const { EmbedBuilder } = await import('discord.js');
      
      const itemId = interaction.values[0];
      const item = ITEMS[itemId];
      
      if (!item) {
        return interaction.reply({ content: '❌ Item no encontrado', flags: 64 });
      }
      
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      
      if ((economy.lagcoins || 0) < item.price) {
        return interaction.reply({ 
          content: `❌ No tienes suficientes Lagcoins. Necesitas **${item.price}** pero tienes **${economy.lagcoins || 0}**`, 
          flags: 64 
        });
      }

      // Para items no consumibles/powerups/seguros, verificar si ya lo tiene
      if (!['consumible', 'powerup', 'seguro'].includes(item.category)) {
        if (economy.items && economy.items.includes(itemId)) {
          return interaction.reply({ content: '❌ Ya tienes este item', flags: 64 });
        }
      }

      const result = await buyItem(interaction.guildId, interaction.user.id, itemId);

      if (result.error) {
        const errorMessages = {
          'item_not_found': '❌ Item no encontrado',
          'insufficient_funds': `❌ No tienes suficientes Lagcoins`,
          'already_owned': '❌ Ya tienes este item',
          'system_error': '❌ Error del sistema'
        };
        return interaction.reply({ content: errorMessages[result.error] || `❌ Error: ${result.error}`, flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ ¡Compra Realizada!')
        .setDescription(`Compraste: **${item.emoji} ${item.name}**`)
        .addFields(
          { name: 'Descripción', value: item.description },
          { name: 'Precio', value: `${item.price} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `${result.economy.lagcoins} Lagcoins`, inline: true }
        );

      if (item.unlocks) {
        embed.addFields({ name: '🔓 Desbloquea', value: `Trabajo: ${item.unlocks}` });
      }
      
      if (item.effect) {
        const durationMin = Math.round((item.effect.duration || 0) / 60000);
        embed.addFields({ name: '⚡ Efecto Activado', value: `${item.description}\nDuración: ${durationMin} minutos` });
      }

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error comprando item:', error);
      return interaction.reply({ content: '❌ Error al procesar la compra', flags: 64 });
    }
  }
});

// Auditoría
const AUDIT_CHANNEL_ID = '1438720716378996757';

async function sendEconomyLog(client, interaction, type, amount, details = '') {
  try {
    const guild = interaction.guild;
    if (!guild) return;
    
    const channel = guild.channels.cache.get(AUDIT_CHANNEL_ID);
    if (!channel) return;

    const user = interaction.user || interaction.author;
    const isGain = amount >= 0;
    const color = isGain ? 0x00FF00 : 0xFF0000;
    const emoji = isGain ? '📈' : '📉';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} TRANSACCIÓN: ${type}`)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .addFields(
        { name: 'Usuario', value: `<@${user.id}>`, inline: true },
        { name: 'Cantidad', value: `**${amount.toLocaleString()} Lagcoins**`, inline: true },
        { name: 'Canal', value: `<#${interaction.channelId || interaction.channel.id}>`, inline: true }
      )
      .setTimestamp();

    if (details) {
      embed.addFields({ name: 'Descripción', value: details });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error enviando log de economía:', error);
  }
}

async function sendAuditLog(client, interaction, actionType, details = '') {
  try {
    const guild = interaction.guild;
    if (!guild) return;
    
    const channel = guild.channels.cache.get(AUDIT_CHANNEL_ID);
    if (!channel) return;

    const user = interaction.user || interaction.author;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`LOG: ${actionType}`)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .addFields(
        { name: 'Usuario', value: `<@${user.id}> (${user.id})`, inline: true },
        { name: 'Canal', value: `<#${interaction.channelId || interaction.channel.id}>`, inline: true }
      )
      .setTimestamp();

    if (details) {
      embed.addFields({ name: 'Detalles', value: details });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error enviando log de auditoría:', error);
  }
}

export { sendAuditLog, sendEconomyLog };

// Manejador de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Log de auditoría para comandos slash (en segundo plano para no bloquear el comando)
  const options = interaction.options.data.map(opt => `${opt.name}: ${opt.value}`).join(', ') || 'Sin opciones';
  sendAuditLog(client, interaction, 'Comando Slash Usado', `**Comando:** /${interaction.commandName}\n**Opciones:** ${options}`).catch(console.error);
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error ejecutando ${interaction.commandName}:`, error);
    
    const errorMessage = { content: '❌ Hubo un error al ejecutar este comando.', flags: 64 };
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(errorMessage).catch(() => {});
      } else {
        await interaction.followUp(errorMessage).catch(() => {});
      }
    } catch (e) {
      console.error('Error enviando mensaje de error:', e);
    }
  }
});

// Manejo de errores globales para evitar cierres inesperados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
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

client.on("messageCreate", async (message) => {
  // Ignorar mensajes de bots
  if (message.author.bot) return;

  // Actualizar última actividad
  const userData = db.getUser(message.guild.id, message.author.id);
  userData.lastActivity = Date.now();

  // Si el usuario estaba inactivo, contar mensajes para salir del estado
  if (userData.isInactive) {
    userData.inactivityMessages = (userData.inactivityMessages || 0) + 1;
    if (userData.inactivityMessages >= 50) {
      userData.isInactive = false;
      userData.inactivityMessages = 0;
      
      const inactiveRoleId = '1455315291532693789';
      const member = message.member;
      if (member) {
        if (member.roles.cache.has(inactiveRoleId)) {
          await member.roles.remove(inactiveRoleId).catch(console.error);
        }
        if (member.manageable) {
          const currentNickname = member.nickname || '';
          if (currentNickname.startsWith('[Inactivo] ')) {
            await member.setNickname(currentNickname.replace('[Inactivo] ', '')).catch(console.error);
          }
        }
      }
      
      const channelId = '1441276918916710501';
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        const welcomeBackEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ ¡Bienvenido de vuelta!')
          .setDescription(`El usuario <@${message.author.id}> ha salido del estado de inactividad tras enviar 50 mensajes.`)
          .setTimestamp();
        await channel.send({ content: `<@${message.author.id}>`, embeds: [welcomeBackEmbed] });
      }
    }
  }
  db.saveUser(message.guild.id, message.author.id, userData);

  const prefix = "!";

  // Verificar que el mensaje tenga el prefijo
  if (!message.content.startsWith(prefix)) return;

  // Separar comando y argumentos
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ===========================
  //   COMANDO: !expulsarbot
  // ===========================
  if (command === "expulsarbot") {

    const OWNER_ID = "1032482231677108224";

    // Verificar que solo tú puedas usarlo
    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    await message.reply("🔄 **Ejecutando proceso...**\nEl bot saldrá de todos los servidores excepto este.");

    const currentGuildID = message.guild.id;
    const bot = message.client;

    let total = 0;

    // Recorrer todos los servidores donde está el bot
    for (const guild of bot.guilds.cache.values()) {

      // No salirse del servidor donde se ejecutó el comando
      if (guild.id === currentGuildID) continue;

      try {
        // Buscar algún canal donde enviar un mensaje de despedida
        const channel =
          guild.systemChannel ||
          guild.channels.cache.find(
            ch =>
              ch.isTextBased() &&
              ch.permissionsFor(guild.members.me)?.has("SendMessages")
          );

        if (channel) {
          await channel.send("👋 El bot fue expulsado automáticamente por decisión del propietario, Jose me das asco.");
        }

        // Salir del servidor
        await guild.leave();
        total++;

        console.log(`✔️ Salió de: ${guild.name} (${guild.id})`);
      } catch (error) {
        console.error(`❌ Error al salir de ${guild.name}:`, error);
      }
    }

    await message.reply(`✅ **Proceso completado.**\nEl bot salió de **${total} servidores**.`);
  }
});

// ===== ADMIN PANEL API =====
const ADMIN_ACCOUNTS = {
  'Gars': 'garcia14052012',
  'Mazin': 'Mzin531'
};
const sessionTokens = new Map();

// Middleware para verificar token
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  const session = sessionTokens.get(token);
  if (Date.now() > session.expiry) {
    sessionTokens.delete(token);
    return res.status(401).json({ message: 'Sesión expirada' });
  }
  
  next();
}

// Autenticación
app.post('/api/admin/auth', express.json(), (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }
  
  const storedPassword = ADMIN_ACCOUNTS[username];
  if (!storedPassword || password !== storedPassword) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }
  
  // Generar token
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 horas
  
  sessionTokens.set(token, { expiry, username });
  
  res.json({
    token,
    expiry,
    username,
    message: 'Autenticado correctamente'
  });
});

// Dashboard API
app.get('/api/admin/dashboard', verifyAdminToken, (req, res) => {
  try {
    const guildCount = client.guilds.cache.size;
    const userCount = Object.keys(db.users).length;
    const botVersion = '1.0.0';
    const mongoStatus = isMongoConnected() ? 'Conectado' : 'Desconectado';
    const nodeVersion = process.version;
    
    const today = new Date().toDateString();
    let xpToday = 0;
    let levelsToday = 0;
    let missionsToday = 0;
    
    for (const user of Object.values(db.users)) {
      if (user.lastUpdate && new Date(user.lastUpdate).toDateString() === today) {
        xpToday += user.lastDayXp || 0;
        if (user.lastLevelUp && new Date(user.lastLevelUp).toDateString() === today) {
          levelsToday++;
        }
      }
    }
    
    const uptime = process.uptime() * 1000;
    const botStatus = client.isReady() ? 'Online' : 'Offline';
    
    const memUsage = process.memoryUsage();
    const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    const startupTime = Date.now() - uptime;
    
    res.json({
      botStatus,
      uptime,
      guildCount,
      userCount,
      xpToday,
      levelsToday,
      missionsToday,
      errorsToday: 0,
      botVersion,
      lastSync: Date.now(),
      mongoStatus,
      nodeVersion,
      memoryUsage: memPercent,
      startupTime
    });
  } catch (error) {
    console.error('Error en dashboard API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API XP System
app.get('/api/admin/xp', verifyAdminToken, (req, res) => {
  try {
    const allUsers = Object.values(db.users);
    const totalXp = allUsers.reduce((sum, u) => sum + (u.totalXp || 0), 0);
    const avgXp = allUsers.length > 0 ? Math.round(totalXp / allUsers.length) : 0;
    const maxXp = Math.max(...allUsers.map(u => u.totalXp || 0), 0);
    
    const topUsers = allUsers
      .filter(u => u.totalXp > 0)
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 10)
      .map(u => {
        const guild = client.guilds.cache.get(u.guildId);
        const member = guild?.members.cache.get(u.userId);
        return {
          id: u.userId,
          guildId: u.guildId,
          xp: u.totalXp,
          level: u.level || 0,
          username: member?.user?.username || u.username || 'Usuario',
          displayName: member?.displayName || member?.user?.globalName || u.displayName || u.username || 'Usuario',
          avatar: member?.user?.displayAvatarURL({ size: 64 }) || u.avatar || null
        };
      });
    
    const activeBoosts = db.getActiveBoosts(null, null);
    const globalBoosts = activeBoosts.filter(b => !b.userId && !b.channelId);
    
    res.json({
      totalXp,
      avgXp,
      maxXp,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.totalXp > 0).length,
      topUsers,
      config: {
        cooldown: CONFIG.XP_COOLDOWN,
        baseMin: CONFIG.BASE_XP_MIN,
        baseMax: CONFIG.BASE_XP_MAX,
        boosterMultiplier: CONFIG.BOOSTER_VIP_MULTIPLIER,
        nightMultiplier: CONFIG.NIGHT_BOOST_MULTIPLIER
      },
      activeBoosts: globalBoosts.length,
      noXpChannels: CONFIG.NO_XP_CHANNELS
    });
  } catch (error) {
    console.error('Error en XP API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Levels
app.get('/api/admin/levels', verifyAdminToken, (req, res) => {
  try {
    const allUsers = Object.values(db.users);
    const levelDistribution = {};
    
    allUsers.forEach(u => {
      const level = u.level || 0;
      const bracket = Math.floor(level / 10) * 10;
      const key = `${bracket}-${bracket + 9}`;
      levelDistribution[key] = (levelDistribution[key] || 0) + 1;
    });
    
    const maxLevel = Math.max(...allUsers.map(u => u.level || 0), 0);
    const avgLevel = allUsers.length > 0 ? 
      Math.round(allUsers.reduce((sum, u) => sum + (u.level || 0), 0) / allUsers.length) : 0;
    
    const levelRoles = Object.entries(CONFIG.LEVEL_ROLES).map(([level, roleId]) => ({
      level: parseInt(level),
      roleId
    }));
    
    const topLevels = allUsers
      .filter(u => u.level > 0)
      .sort((a, b) => b.level - a.level)
      .slice(0, 10)
      .map(u => {
        const guild = client.guilds.cache.get(u.guildId);
        const member = guild?.members.cache.get(u.userId);
        return {
          id: u.userId,
          guildId: u.guildId,
          level: u.level,
          xp: u.totalXp,
          username: member?.user?.username || u.username || 'Usuario',
          displayName: member?.displayName || member?.user?.globalName || u.displayName || u.username || 'Usuario',
          avatar: member?.user?.displayAvatarURL({ size: 64 }) || u.avatar || null
        };
      });
    
    res.json({
      maxLevel,
      avgLevel,
      levelDistribution,
      levelRoles,
      topLevels,
      usersWithLevel100: allUsers.filter(u => u.level >= 100).length
    });
  } catch (error) {
    console.error('Error en Levels API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Roles
app.get('/api/admin/roles', verifyAdminToken, async (req, res) => {
  try {
    const levelRoles = Object.entries(CONFIG.LEVEL_ROLES).map(([level, roleId]) => {
      let roleName = `Role ID: ${roleId}`;
      let memberCount = 0;
      
      for (const guild of client.guilds.cache.values()) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          roleName = role.name;
          memberCount = role.members.size;
          break;
        }
      }
      
      return {
        level: parseInt(level),
        roleId,
        roleName,
        memberCount
      };
    });
    
    res.json({
      levelRoles: levelRoles.sort((a, b) => a.level - b.level),
      specialRoles: {
        staff: { id: CONFIG.STAFF_ROLE_ID, name: 'Staff' },
        booster: { id: CONFIG.BOOSTER_ROLE_ID, name: 'Booster' },
        vip: { id: CONFIG.VIP_ROLE_ID, name: 'VIP' },
        level100: { id: CONFIG.LEVEL_100_ROLE_ID, name: 'Nivel 100' }
      }
    });
  } catch (error) {
    console.error('Error en Roles API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Missions
app.get('/api/admin/missions', verifyAdminToken, async (req, res) => {
  try {
    const weekNumber = Math.ceil((new Date().getDate()) / 7);
    const year = new Date().getFullYear();
    
    let totalMissions = 0;
    let completedMissions = 0;
    
    const allUsers = Object.values(db.users);
    for (const user of allUsers.slice(0, 50)) {
      try {
        const missions = await getUserMissions(user.guildId, user.userId, weekNumber, year);
        if (missions && missions.missions) {
          totalMissions += missions.missions.length;
          completedMissions += missions.missions.filter(m => m.completed).length;
        }
      } catch (e) {}
    }
    
    res.json({
      weekNumber,
      year,
      totalMissions,
      completedMissions,
      completionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
      missionChannel: CONFIG.MISSION_COMPLETE_CHANNEL_ID
    });
  } catch (error) {
    console.error('Error en Missions API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Power-ups/Boosts
app.get('/api/admin/powerups', verifyAdminToken, (req, res) => {
  try {
    const now = Date.now();
    const allActiveBoosts = db.getActiveBoosts(null, null);
    
    const globalBoosts = allActiveBoosts
      .filter(b => !b.userId && !b.channelId)
      .map(boost => ({
        type: 'global',
        multiplier: boost.multiplier,
        expiresAt: boost.expiresAt,
        timeLeft: boost.expiresAt ? Math.max(0, boost.expiresAt - now) : null,
        addedBy: boost.addedBy || 'Sistema'
      }));
    
    let userBoostCount = 0;
    let channelBoostCount = 0;
    const userBoostDetails = [];
    const channelBoostDetails = [];
    
    if (db.boosts && db.boosts.users) {
      for (const [userId, boosts] of Object.entries(db.boosts.users)) {
        const activeBoosts = boosts.filter(b => !b.expiresAt || b.expiresAt > now);
        userBoostCount += activeBoosts.length;
        activeBoosts.forEach(b => {
          userBoostDetails.push({
            userId,
            multiplier: b.multiplier,
            expiresAt: b.expiresAt
          });
        });
      }
    }
    
    if (db.boosts && db.boosts.channels) {
      for (const [channelId, boosts] of Object.entries(db.boosts.channels)) {
        const activeBoosts = boosts.filter(b => !b.expiresAt || b.expiresAt > now);
        channelBoostCount += activeBoosts.length;
        activeBoosts.forEach(b => {
          channelBoostDetails.push({
            channelId,
            multiplier: b.multiplier,
            expiresAt: b.expiresAt
          });
        });
      }
    }
    
    res.json({
      globalBoosts,
      userBoostCount,
      channelBoostCount,
      totalActive: globalBoosts.length + userBoostCount + channelBoostCount,
      userBoostDetails: userBoostDetails.slice(0, 20),
      channelBoostDetails: channelBoostDetails.slice(0, 20),
      nightBoostMultiplier: CONFIG.NIGHT_BOOST_MULTIPLIER,
      boosterVipMultiplier: CONFIG.BOOSTER_VIP_MULTIPLIER
    });
  } catch (error) {
    console.error('Error en Powerups API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Statistics
app.get('/api/admin/statistics', verifyAdminToken, async (req, res) => {
  try {
    const allUsers = Object.values(db.users);
    const totalXp = allUsers.reduce((sum, u) => sum + (u.totalXp || 0), 0);
    const totalLevels = allUsers.reduce((sum, u) => sum + (u.level || 0), 0);
    
    const levelBrackets = {
      '1-10': 0, '11-25': 0, '26-50': 0, '51-75': 0, '76-100': 0, '100+': 0
    };
    
    allUsers.forEach(u => {
      const level = u.level || 0;
      if (level === 0) return;
      if (level <= 10) levelBrackets['1-10']++;
      else if (level <= 25) levelBrackets['11-25']++;
      else if (level <= 50) levelBrackets['26-50']++;
      else if (level <= 75) levelBrackets['51-75']++;
      else if (level <= 100) levelBrackets['76-100']++;
      else levelBrackets['100+']++;
    });
    
    const activeToday = allUsers.filter(u => {
      if (!u.lastUpdate) return false;
      return new Date(u.lastUpdate).toDateString() === new Date().toDateString();
    }).length;
    
    const activeThisWeek = allUsers.filter(u => {
      if (!u.lastUpdate) return false;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(u.lastUpdate).getTime() > weekAgo;
    }).length;
    
    res.json({
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.totalXp > 0).length,
      totalXp,
      totalLevels,
      avgXpPerUser: allUsers.length > 0 ? Math.round(totalXp / allUsers.length) : 0,
      avgLevelPerUser: allUsers.length > 0 ? (totalLevels / allUsers.length).toFixed(1) : 0,
      levelBrackets,
      activeToday,
      activeThisWeek,
      mongoConnected: isMongoConnected(),
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Error en Statistics API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API Configuration
app.get('/api/admin/config', verifyAdminToken, (req, res) => {
  try {
    res.json({
      xpSystem: {
        cooldown: CONFIG.XP_COOLDOWN,
        baseMin: CONFIG.BASE_XP_MIN,
        baseMax: CONFIG.BASE_XP_MAX,
        boosterMultiplier: CONFIG.BOOSTER_VIP_MULTIPLIER,
        nightMultiplier: CONFIG.NIGHT_BOOST_MULTIPLIER
      },
      channels: {
        levelUp: CONFIG.LEVEL_UP_CHANNEL_ID,
        missionComplete: CONFIG.MISSION_COMPLETE_CHANNEL_ID,
        noXp: CONFIG.NO_XP_CHANNELS
      },
      roles: {
        staff: CONFIG.STAFF_ROLE_ID,
        booster: CONFIG.BOOSTER_ROLE_ID,
        vip: CONFIG.VIP_ROLE_ID,
        level100: CONFIG.LEVEL_100_ROLE_ID
      },
      levelRoles: CONFIG.LEVEL_ROLES,
      timezone: CONFIG.VENEZUELA_TIMEZONE,
      maintenanceMode: db.settings?.maintenanceMode || false
    });
  } catch (error) {
    console.error('Error en Config API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Toggle Maintenance Mode
app.post('/api/admin/maintenance', verifyAdminToken, express.json(), (req, res) => {
  try {
    const { enabled } = req.body;
    if (!db.settings) db.settings = {};
    db.settings.maintenanceMode = !!enabled;
    res.json({ success: true, maintenanceMode: db.settings.maintenanceMode });
  } catch (error) {
    console.error('Error toggling maintenance:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update Bot Configuration
app.post('/api/admin/config', verifyAdminToken, express.json(), (req, res) => {
  try {
    const { category, field, value } = req.body;
    
    if (!category || !field || value === undefined) {
      return res.status(400).json({ message: 'Faltan parametros requeridos' });
    }
    
    let updated = false;
    let oldValue = null;
    
    if (category === 'xpSystem') {
      switch (field) {
        case 'cooldown':
          oldValue = CONFIG.XP_COOLDOWN;
          CONFIG.XP_COOLDOWN = parseInt(value) * 1000;
          updated = true;
          break;
        case 'baseMin':
          oldValue = CONFIG.BASE_XP_MIN;
          CONFIG.BASE_XP_MIN = parseInt(value);
          updated = true;
          break;
        case 'baseMax':
          oldValue = CONFIG.BASE_XP_MAX;
          CONFIG.BASE_XP_MAX = parseInt(value);
          updated = true;
          break;
        case 'boosterMultiplier':
          oldValue = CONFIG.BOOSTER_VIP_MULTIPLIER;
          CONFIG.BOOSTER_VIP_MULTIPLIER = parseFloat(value);
          updated = true;
          break;
        case 'nightMultiplier':
          oldValue = CONFIG.NIGHT_BOOST_MULTIPLIER;
          CONFIG.NIGHT_BOOST_MULTIPLIER = parseFloat(value);
          updated = true;
          break;
      }
    } else if (category === 'channels') {
      switch (field) {
        case 'levelUp':
          oldValue = CONFIG.LEVEL_UP_CHANNEL_ID;
          CONFIG.LEVEL_UP_CHANNEL_ID = value;
          updated = true;
          break;
        case 'missionComplete':
          oldValue = CONFIG.MISSION_COMPLETE_CHANNEL_ID;
          CONFIG.MISSION_COMPLETE_CHANNEL_ID = value;
          updated = true;
          break;
        case 'addNoXp':
          if (!CONFIG.NO_XP_CHANNELS.includes(value)) {
            CONFIG.NO_XP_CHANNELS.push(value);
            updated = true;
          }
          break;
        case 'removeNoXp':
          const idx = CONFIG.NO_XP_CHANNELS.indexOf(value);
          if (idx > -1) {
            CONFIG.NO_XP_CHANNELS.splice(idx, 1);
            updated = true;
          }
          break;
      }
    } else if (category === 'roles') {
      switch (field) {
        case 'staff':
          oldValue = CONFIG.STAFF_ROLE_ID;
          CONFIG.STAFF_ROLE_ID = value;
          updated = true;
          break;
        case 'booster':
          oldValue = CONFIG.BOOSTER_ROLE_ID;
          CONFIG.BOOSTER_ROLE_ID = value;
          updated = true;
          break;
        case 'vip':
          oldValue = CONFIG.VIP_ROLE_ID;
          CONFIG.VIP_ROLE_ID = value;
          updated = true;
          break;
        case 'level100':
          oldValue = CONFIG.LEVEL_100_ROLE_ID;
          CONFIG.LEVEL_100_ROLE_ID = value;
          updated = true;
          break;
      }
    }
    
    if (updated) {
      logActivity(LOG_TYPES.CONFIG_CHANGE, {
        category,
        field,
        oldValue,
        newValue: value,
        changedBy: req.adminUsername
      });
      
      res.json({ 
        success: true, 
        message: 'Configuracion actualizada',
        field,
        newValue: value
      });
    } else {
      res.status(400).json({ message: 'Campo no reconocido' });
    }
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ===== ACTIVITY LOGS API =====
app.get('/api/admin/logs', verifyAdminToken, (req, res) => {
  try {
    const { type, limit, userId } = req.query;
    const logs = getLogs({
      type,
      userId,
      limit: parseInt(limit) || 100
    });
    const stats = getLogStats();
    res.json({ logs, stats });
  } catch (error) {
    console.error('Error en Logs API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ===== USER MANAGEMENT API =====
app.get('/api/admin/user/search', verifyAdminToken, (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query requerida' });
    }
    
    const allUsers = Object.values(db.users);
    let foundUsers = [];
    const queryLower = query.toLowerCase();
    
    for (const user of allUsers) {
      const guild = client.guilds.cache.get(user.guildId);
      const member = guild?.members.cache.get(user.userId);
      
      const username = member?.user?.username || user.username || '';
      const displayName = member?.displayName || user.displayName || '';
      const nickname = member?.nickname || '';
      const globalName = member?.user?.globalName || '';
      const savedDisplayName = user.displayName || '';
      
      const matchesId = user.userId === query;
      const matchesUsername = username.toLowerCase().includes(queryLower);
      const matchesDisplayName = displayName.toLowerCase().includes(queryLower);
      const matchesNickname = nickname.toLowerCase().includes(queryLower);
      const matchesGlobalName = globalName.toLowerCase().includes(queryLower);
      const matchesSavedDisplayName = savedDisplayName.toLowerCase().includes(queryLower);
      
      if (matchesId || matchesUsername || matchesDisplayName || matchesNickname || matchesGlobalName || matchesSavedDisplayName) {
        foundUsers.push({
          ...user,
          username: username || user.username || 'Desconocido',
          displayName: displayName || user.displayName || username || 'Desconocido',
          nickname: nickname || null,
          avatar: member?.user?.avatarURL() || user.avatar || null,
          guildName: guild?.name || 'Servidor'
        });
      }
    }
    
    if (foundUsers.length === 0) {
      for (const guild of client.guilds.cache.values()) {
        const member = guild.members.cache.find(m => 
          m.user.username.toLowerCase().includes(query.toLowerCase()) ||
          m.id === query
        );
        if (member) {
          const key = `${guild.id}-${member.id}`;
          const userData = db.users[key] || { userId: member.id, guildId: guild.id };
          foundUsers.push({
            ...userData,
            username: member.user.username,
            displayName: member.displayName,
            avatar: member.user.avatarURL(),
            guildName: guild.name
          });
        }
      }
    }
    
    res.json({ users: foundUsers.slice(0, 20) });
  } catch (error) {
    console.error('Error en User Search API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/admin/user/:guildId/:userId', verifyAdminToken, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const key = `${guildId}-${userId}`;
    
    const userData = db.users[key] || null;
    let economyData = null;
    
    try {
      const { getUserEconomy } = await import('./utils/economyDB.js');
      economyData = await getUserEconomy(guildId, userId);
    } catch (e) {}
    
    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(userId);
    
    const userLogs = getUserLogs(userId, 100);
    
    res.json({
      user: userData,
      economy: economyData,
      username: member?.user?.username || 'Desconocido',
      displayName: member?.displayName || 'Desconocido',
      avatar: member?.user?.avatarURL() || null,
      guildName: guild?.name || 'Servidor',
      roles: member?.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor })) || [],
      logs: userLogs
    });
  } catch (error) {
    console.error('Error en User Details API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/admin/user/:guildId/:userId/modify', verifyAdminToken, express.json(), async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { action, field, value, reason } = req.body;
    const key = `${guildId}-${userId}`;
    
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const session = sessionTokens.get(token);
    const adminName = session?.username || 'Admin';
    
    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(userId);
    const username = member?.user?.username || 'Usuario';
    
    if (!db.users[key]) {
      db.users[key] = { userId, guildId, xp: 0, level: 0, totalXp: 0 };
    }
    
    let result = { success: false };
    
    if (field === 'lagcoins' || field === 'bank') {
      const { getUserEconomy, saveUserEconomy } = await import('./utils/economyDB.js');
      let economy = await getUserEconomy(guildId, userId);
      if (!economy) {
        economy = { guildId, userId, lagcoins: 0, bank: 0 };
      }
      
      const oldValue = field === 'lagcoins' ? economy.lagcoins : economy.bank;
      let newValue = oldValue;
      
      switch (action) {
        case 'add':
          newValue = oldValue + parseInt(value);
          break;
        case 'remove':
          newValue = Math.max(0, oldValue - parseInt(value));
          break;
        case 'set':
          newValue = Math.max(0, parseInt(value));
          break;
        case 'reset':
          newValue = 0;
          break;
      }
      
      if (field === 'lagcoins') {
        economy.lagcoins = newValue;
      } else {
        economy.bank = newValue;
      }
      
      await saveUserEconomy(guildId, userId, economy);
      
      logActivity({
        type: LOG_TYPES.ADMIN_ACTION,
        userId,
        username,
        guildId,
        guildName: guild?.name,
        amount: newValue - oldValue,
        reason: `Admin ${adminName}: ${action} ${field} - ${reason || 'Sin motivo'}`,
        details: { field, action, oldValue, newValue, admin: adminName }
      });
      
      result = { success: true, field, oldValue, newValue };
    }
    else if (field === 'xp' || field === 'totalXp') {
      const user = db.users[key];
      const oldValue = user.totalXp || 0;
      let newValue = oldValue;
      
      switch (action) {
        case 'add':
          newValue = oldValue + parseInt(value);
          break;
        case 'remove':
          newValue = Math.max(0, oldValue - parseInt(value));
          break;
        case 'set':
          newValue = Math.max(0, parseInt(value));
          break;
        case 'reset':
          newValue = 0;
          break;
      }
      
      user.totalXp = newValue;
      user.level = calculateLevel(newValue);
      user.xp = getXPProgress(newValue, user.level).current;
      db.save();
      
      if (isMongoConnected()) {
        await saveUserToMongo(user);
      }
      
      logActivity({
        type: newValue > oldValue ? LOG_TYPES.XP_GAIN : LOG_TYPES.XP_LOSS,
        userId,
        username,
        guildId,
        guildName: guild?.name,
        amount: newValue - oldValue,
        reason: `Admin ${adminName}: ${action} XP - ${reason || 'Sin motivo'}`,
        details: { action, oldValue, newValue, admin: adminName }
      });
      
      result = { success: true, field: 'totalXp', oldValue, newValue, newLevel: user.level };
    }
    else if (field === 'level') {
      const user = db.users[key];
      const oldLevel = user.level || 0;
      let newLevel = oldLevel;
      
      switch (action) {
        case 'add':
          newLevel = oldLevel + parseInt(value);
          break;
        case 'remove':
          newLevel = Math.max(0, oldLevel - parseInt(value));
          break;
        case 'set':
          newLevel = Math.max(0, parseInt(value));
          break;
        case 'reset':
          newLevel = 0;
          break;
      }
      
      const { getTotalXPForLevel } = await import('./utils/xpSystem.js');
      user.totalXp = getTotalXPForLevel(newLevel);
      user.level = newLevel;
      user.xp = 0;
      db.save();
      
      if (isMongoConnected()) {
        await saveUserToMongo(user);
      }
      
      logActivity({
        type: newLevel > oldLevel ? LOG_TYPES.LEVEL_UP : LOG_TYPES.LEVEL_DOWN,
        userId,
        username,
        guildId,
        guildName: guild?.name,
        amount: newLevel - oldLevel,
        reason: `Admin ${adminName}: ${action} nivel - ${reason || 'Sin motivo'}`,
        details: { action, oldLevel, newLevel, admin: adminName }
      });
      
      result = { success: true, field: 'level', oldValue: oldLevel, newValue: newLevel };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en User Modify API:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

app.get('/api/admin/users/list', verifyAdminToken, (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'totalXp', order = 'desc' } = req.query;
    
    let allUsers = Object.values(db.users).map(user => {
      const guild = client.guilds.cache.get(user.guildId);
      const member = guild?.members.cache.get(user.userId);
      return {
        ...user,
        username: member?.user?.username || user.username || 'Desconocido',
        displayName: member?.displayName || 'Desconocido',
        guildName: guild?.name || 'Servidor'
      };
    });
    
    allUsers.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = allUsers.slice(start, start + parseInt(limit));
    
    res.json({
      users: paginatedUsers,
      total: allUsers.length,
      page: parseInt(page),
      totalPages: Math.ceil(allUsers.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error en Users List API:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ===== EXPORT LOG FUNCTION FOR OTHER MODULES =====
globalThis.logBotActivity = logActivity;
globalThis.LOG_TYPES = LOG_TYPES;

// Catch-all route for SPA (must be after all API routes)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conectar a Discord SI hay token disponible
const token = process.env.DISCORD_BOT_TOKEN;
if (token) {
  client.login(token);
} else {
  console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables!');
  console.log('⚠️  El panel admin funcionará, pero el bot no se conectará a Discord');
  console.log('📝 Para conectar el bot:');
  console.log('1. Go to https://discord.com/developers/applications');
  console.log('2. Create or select your application');
  console.log('3. Go to the "Bot" section');
  console.log('4. Copy your bot token');
  console.log('5. Add it as DISCORD_BOT_TOKEN in environment variables\n');
}
