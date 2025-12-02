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
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading economy file:', error);
  }
  return {};
}

function saveEconomyFile(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving economy file:', error);
  }
}

export async function getUserEconomy(guildId, userId) {
  const mongoConnected = isMongoConnected();
  
  if (mongoConnected) {
    return await getEconomy(guildId, userId);
  }
  
  // Fallback a JSON local
  const economyData = loadEconomyFile();
  const key = `${guildId}-${userId}`;
  
  if (!economyData[key]) {
    economyData[key] = {
      guildId,
      userId,
      lagcoins: 100,
      bankBalance: 0,
      lastWorkTime: null,
      lastRobTime: null,
      transactions: [],
      createdAt: new Date()
    };
    saveEconomyFile(economyData);
  }
  
  return economyData[key];
}

export async function addUserLagcoins(guildId, userId, amount, reason = 'work') {
  const mongoConnected = isMongoConnected();
  
  if (mongoConnected) {
    return await addLagcoins(guildId, userId, amount, reason);
  }
  
  const economyData = loadEconomyFile();
  const key = `${guildId}-${userId}`;
  
  if (!economyData[key]) {
    economyData[key] = {
      guildId,
      userId,
      lagcoins: 100,
      bankBalance: 0,
      lastWorkTime: null,
      lastRobTime: null,
      transactions: []
    };
  }
  
  economyData[key].lagcoins += amount;
  economyData[key].transactions.push({
    type: reason,
    amount,
    date: new Date().toISOString()
  });
  
  saveEconomyFile(economyData);
  return economyData[key];
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
    // Si MongoDB está conectado, también guardamos ahí
    try {
      await addLagcoins(guildId, userId, 0, 'update');
    } catch (e) {
      // Ignorar errores de MongoDB
    }
  }
  
  // Siempre guardar en JSON local
  const economyData = loadEconomyFile();
  const key = `${guildId}-${userId}`;
  economyData[key] = { ...economyData[key], ...data };
  saveEconomyFile(economyData);
  return economyData[key];
}
