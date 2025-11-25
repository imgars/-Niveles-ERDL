import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOSTS_FILE = path.join(DATA_DIR, 'boosts.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.users = this.loadFile(USERS_FILE, {});
    this.boosts = this.loadFile(BOOSTS_FILE, { global: [], users: {}, channels: {} });
    this.cooldowns = this.loadFile(COOLDOWNS_FILE, { xp: {}, minigames: {} });
    this.bans = this.loadFile(BANS_FILE, { users: {}, channels: [] });
  }

  loadFile(filePath, defaultData) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
    return defaultData;
  }

  saveFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filePath}:`, error);
    }
  }

  getUser(guildId, userId) {
    const key = `${guildId}-${userId}`;
    if (!this.users[key]) {
      this.users[key] = {
        userId,
        guildId,
        xp: 0,
        level: 0,
        totalXp: 0
      };
    }
    return this.users[key];
  }

  saveUser(guildId, userId, data) {
    const key = `${guildId}-${userId}`;
    this.users[key] = { ...this.users[key], ...data };
    this.saveFile(USERS_FILE, this.users);
  }

  getAllUsers(guildId) {
    return Object.values(this.users).filter(u => u.guildId === guildId);
  }

  addBoost(type, target, multiplier, duration, description) {
    const boost = {
      type,
      target,
      multiplier,
      expiresAt: duration ? Date.now() + duration : null,
      description
    };

    if (type === 'global') {
      this.boosts.global.push(boost);
    } else if (type === 'user') {
      if (!this.boosts.users[target]) this.boosts.users[target] = [];
      this.boosts.users[target].push(boost);
    } else if (type === 'channel') {
      if (!this.boosts.channels[target]) this.boosts.channels[target] = [];
      this.boosts.channels[target].push(boost);
    }

    this.saveFile(BOOSTS_FILE, this.boosts);
  }

  getActiveBoosts(userId = null, channelId = null) {
    const now = Date.now();
    const active = [];
    let boostsChanged = false;

    const oldGlobalLength = this.boosts.global.length;
    this.boosts.global = this.boosts.global.filter(b => !b.expiresAt || b.expiresAt > now);
    if (this.boosts.global.length !== oldGlobalLength) boostsChanged = true;
    active.push(...this.boosts.global);

    if (userId && this.boosts.users[userId]) {
      const oldUserLength = this.boosts.users[userId].length;
      this.boosts.users[userId] = this.boosts.users[userId].filter(b => !b.expiresAt || b.expiresAt > now);
      if (this.boosts.users[userId].length !== oldUserLength) boostsChanged = true;
      active.push(...this.boosts.users[userId]);
    }

    if (channelId && this.boosts.channels[channelId]) {
      const oldChannelLength = this.boosts.channels[channelId].length;
      this.boosts.channels[channelId] = this.boosts.channels[channelId].filter(b => !b.expiresAt || b.expiresAt > now);
      if (this.boosts.channels[channelId].length !== oldChannelLength) boostsChanged = true;
      active.push(...this.boosts.channels[channelId]);
    }

    if (boostsChanged) {
      this.saveFile(BOOSTS_FILE, this.boosts);
    }

    return active;
  }

  removeGlobalBoost() {
    this.boosts.global = [];
    this.saveFile(BOOSTS_FILE, this.boosts);
  }

  setCooldown(type, userId, duration) {
    if (!this.cooldowns[type]) this.cooldowns[type] = {};
    this.cooldowns[type][userId] = Date.now() + duration;
    this.saveFile(COOLDOWNS_FILE, this.cooldowns);
  }

  checkCooldown(type, userId) {
    if (!this.cooldowns[type] || !this.cooldowns[type][userId]) return false;
    const remaining = this.cooldowns[type][userId] - Date.now();
    return remaining > 0 ? remaining : false;
  }

  banUser(userId, duration) {
    this.bans.users[userId] = duration ? Date.now() + duration : null;
    this.saveFile(BANS_FILE, this.bans);
  }

  unbanUser(userId) {
    delete this.bans.users[userId];
    this.saveFile(BANS_FILE, this.bans);
  }

  isUserBanned(userId) {
    if (!this.bans.users[userId]) return false;
    if (this.bans.users[userId] === null) return true;
    if (this.bans.users[userId] > Date.now()) return true;
    delete this.bans.users[userId];
    this.saveFile(BANS_FILE, this.bans);
    return false;
  }

  banChannel(channelId) {
    if (!this.bans.channels.includes(channelId)) {
      this.bans.channels.push(channelId);
      this.saveFile(BANS_FILE, this.bans);
    }
  }

  unbanChannel(channelId) {
    this.bans.channels = this.bans.channels.filter(c => c !== channelId);
    this.saveFile(BANS_FILE, this.bans);
  }

  isChannelBanned(channelId) {
    return this.bans.channels.includes(channelId);
  }

  resetAllUsers(guildId) {
    Object.keys(this.users).forEach(key => {
      if (this.users[key].guildId === guildId) {
        this.users[key].xp = 0;
        this.users[key].level = 0;
        this.users[key].totalXp = 0;
      }
    });
    this.saveFile(USERS_FILE, this.users);
  }
}

export default new Database();
