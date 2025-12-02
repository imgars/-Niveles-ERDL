import fs from 'fs';
import path from 'path';
import { getEconomy, addLagcoins, removeLagcoins, transferLagcoins, isMongoConnected } from './mongoSync.js';

const DATA_DIR = './data';
const ECONOMY_FILE = path.join(DATA_DIR, 'economy.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadEconomyFile() {
  try {
    if (fs.existsSync(ECONOMY_FILE)) {
      const data = fs.readFileSync(ECONOMY_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // Limpiar datos corruptos
      Object.keys(parsed).forEach(key => {
        const user = parsed[key];
        delete user.$setOnInsert;
        delete user.__v;
        if (user.lagcoins === null || user.lagcoins === undefined) user.lagcoins = 100;
        if (user.bankBalance === null || user.bankBalance === undefined) user.bankBalance = 0;
        if (!Array.isArray(user.transactions)) user.transactions = [];
      });
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading economy file:', error);
  }
  return {};
}

function saveEconomyFile(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving economy file:', error);
    return false;
  }
}

export async function getUserEconomy(guildId, userId) {
  try {
    const mongoConnected = isMongoConnected();
    
    if (mongoConnected) {
      const result = await getEconomy(guildId, userId);
      return result || createNewEconomy(guildId, userId);
    }
    
    // Fallback a JSON local
    const economyData = loadEconomyFile();
    const key = `${guildId}-${userId}`;
    
    if (!economyData[key]) {
      economyData[key] = createNewEconomy(guildId, userId);
      saveEconomyFile(economyData);
    }
    
    return economyData[key];
  } catch (error) {
    console.error('Error in getUserEconomy:', error);
    return createNewEconomy(guildId, userId);
  }
}

function createNewEconomy(guildId, userId) {
  return {
    guildId,
    userId,
    lagcoins: 100,
    bankBalance: 0,
    lastWorkTime: null,
    lastRobTime: null,
    transactions: [],
    items: [],
    createdAt: new Date().toISOString()
  };
}

export async function addUserLagcoins(guildId, userId, amount, reason = 'work') {
  try {
    const mongoConnected = isMongoConnected();
    
    if (mongoConnected) {
      const result = await addLagcoins(guildId, userId, amount, reason);
      return result || await getUserEconomy(guildId, userId);
    }
    
    const economyData = loadEconomyFile();
    const key = `${guildId}-${userId}`;
    
    if (!economyData[key]) {
      economyData[key] = createNewEconomy(guildId, userId);
    }
    
    economyData[key].lagcoins = Math.max(0, (economyData[key].lagcoins || 0) + amount);
    if (!economyData[key].transactions) economyData[key].transactions = [];
    economyData[key].transactions.push({
      type: reason,
      amount,
      date: new Date().toISOString()
    });
    
    saveEconomyFile(economyData);
    return economyData[key];
  } catch (error) {
    console.error('Error in addUserLagcoins:', error);
    return await getUserEconomy(guildId, userId);
  }
}

export async function removeUserLagcoins(guildId, userId, amount, reason = 'spend') {
  const mongoConnected = isMongoConnected();
  
  if (mongoConnected) {
    return await removeLagcoins(guildId, userId, amount, reason);
  }
  
  const economyData = loadEconomyFile();
  const key = `${guildId}-${userId}`;
  
  if (!economyData[key]) return null;
  if (economyData[key].lagcoins < amount) return null;
  
  economyData[key].lagcoins -= amount;
  economyData[key].transactions.push({
    type: reason,
    amount: -amount,
    date: new Date().toISOString()
  });
  
  saveEconomyFile(economyData);
  return economyData[key];
}

export async function transferUserLagcoins(guildId, fromUserId, toUserId, amount) {
  const mongoConnected = isMongoConnected();
  
  if (mongoConnected) {
    return await transferLagcoins(guildId, fromUserId, toUserId, amount);
  }
  
  const economyData = loadEconomyFile();
  const fromKey = `${guildId}-${fromUserId}`;
  const toKey = `${guildId}-${toUserId}`;
  
  if (!economyData[fromKey]) return null;
  if (economyData[fromKey].lagcoins < amount) return null;
  
  if (!economyData[toKey]) {
    economyData[toKey] = {
      guildId,
      userId: toUserId,
      lagcoins: 100,
      bankBalance: 0,
      lastWorkTime: null,
      lastRobTime: null,
      transactions: []
    };
  }
  
  economyData[fromKey].lagcoins -= amount;
  economyData[fromKey].transactions.push({
    type: 'transfer',
    amount: -amount,
    to: toUserId,
    date: new Date().toISOString()
  });
  
  economyData[toKey].lagcoins += amount;
  economyData[toKey].transactions.push({
    type: 'transfer',
    amount,
    from: fromUserId,
    date: new Date().toISOString()
  });
  
  saveEconomyFile(economyData);
  return { from: economyData[fromKey], to: economyData[toKey] };
}

export async function saveUserEconomy(guildId, userId, data) {
  const mongoConnected = isMongoConnected();
  
  if (mongoConnected) {
    try {
      await addLagcoins(guildId, userId, 0, 'update');
    } catch (e) {
      // Ignorar errores de MongoDB
    }
  }
  
  const economyData = loadEconomyFile();
  const key = `${guildId}-${userId}`;
  economyData[key] = { ...economyData[key], ...data };
  saveEconomyFile(economyData);
  return economyData[key];
}

// Sistema de trabajos mejorado
export const JOBS = {
  basico: { name: 'Trabajo Básico', minEarnings: 50, maxEarnings: 120, itemsNeeded: [] },
  pescar: { name: 'Pescador', minEarnings: 100, maxEarnings: 250, itemsNeeded: ['cana_pesca'] },
  talar: { name: 'Leñador', minEarnings: 120, maxEarnings: 300, itemsNeeded: ['hacha'] },
  minar: { name: 'Minero', minEarnings: 150, maxEarnings: 400, itemsNeeded: ['pico'] },
  construir: { name: 'Albañil', minEarnings: 180, maxEarnings: 450, itemsNeeded: ['pala'] }
};

// Sistema de items
export const ITEMS = {
  cana_pesca: { name: 'Caña de Pesca', price: 500, unlocks: 'pescar', description: 'Para pescar mejor' },
  hacha: { name: 'Hacha', price: 600, unlocks: 'talar', description: 'Para talar árboles' },
  pico: { name: 'Pico', price: 800, unlocks: 'minar', description: 'Para minar' },
  pala: { name: 'Pala', price: 700, unlocks: 'construir', description: 'Para construcción' }
};

export async function getUserProfile(guildId, userId) {
  const economy = await getUserEconomy(guildId, userId);
  return {
    userId,
    lagcoins: economy.lagcoins || 0,
    bankBalance: economy.bankBalance || 0,
    items: economy.items || [],
    totalEarned: (economy.transactions || []).reduce((a, t) => a + (t.amount > 0 ? t.amount : 0), 0),
    createdAt: economy.createdAt
  };
}

export async function buyItem(guildId, userId, itemId) {
  const economy = await getUserEconomy(guildId, userId);
  const item = ITEMS[itemId];
  
  if (!item || economy.lagcoins < item.price) return null;
  
  economy.lagcoins -= item.price;
  if (!economy.items) economy.items = [];
  economy.items.push(itemId);
  
  await saveUserEconomy(guildId, userId, economy);
  return economy;
}

export async function getDailyReward(guildId, userId) {
  const economy = await getUserEconomy(guildId, userId);
  const today = new Date().toDateString();
  
  if (economy.lastDailyReward === today) {
    return null; // Ya reclamó hoy
  }
  
  const reward = Math.floor(Math.random() * 200) + 150; // 150-350 coins
  economy.lastDailyReward = today;
  economy.lagcoins = (economy.lagcoins || 0) + reward;
  
  await saveUserEconomy(guildId, userId, economy);
  return reward;
}

export async function playCasino(guildId, userId, bet) {
  const economy = await getUserEconomy(guildId, userId);
  if (economy.lagcoins < bet) return null;
  
  const roll = Math.floor(Math.random() * 100);
  const won = roll > 40; // 60% de probabilidad
  const winnings = won ? Math.floor(bet * 1.5) : -bet;
  
  economy.lagcoins += winnings;
  if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0 };
  economy.casinoStats.plays++;
  if (won) economy.casinoStats.wins++;
  
  await saveUserEconomy(guildId, userId, economy);
  return { won, winnings, newBalance: economy.lagcoins };
}

export async function robBank(guildId, userId) {
  const economy = await getUserEconomy(guildId, userId);
  const success = Math.random() > 0.85; // 15% de probabilidad
  
  if (!success) {
    const penalty = Math.floor(Math.random() * 200) + 100;
    economy.lagcoins = Math.max(0, (economy.lagcoins || 0) - penalty);
    await saveUserEconomy(guildId, userId, economy);
    return { success: false, penalty };
  }
  
  const stolen = Math.floor(Math.random() * 1000) + 500; // 500-1500 coins
  economy.lagcoins = (economy.lagcoins || 0) + stolen;
  await saveUserEconomy(guildId, userId, economy);
  return { success: true, stolen };
}
