import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOSTS_FILE = path.join(DATA_DIR, 'boosts.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');
const SYSTEMS_FILE = path.join(DATA_DIR, 'systems.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.users = this.loadFile(USERS_FILE, {});
    this.boosts = this.loadFile(BOOSTS_FILE, { global: [], users: {}, channels: {} });
    this.cooldowns = this.loadFile(COOLDOWNS_FILE, { xp: {}, minigames: {} });
    this.bans = this.loadFile(BANS_FILE, { users: {}, channels: [] });
    this.systems = this.loadFile(SYSTEMS_FILE, {});
    this.settings = { maintenanceMode: false };
    this.mongoSync = null;
  }

  saveSettings() {
    this.saveFile(path.join(DATA_DIR, 'settings.json'), this.settings);
  }

  setMongoSync(mongoSync) {
    this.mongoSync = mongoSync;
  }

  loadFile(filePath, defaultData) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        let parsed = JSON.parse(data);
        
        // Limpiar datos corruptos de MongoDB en JSON
        if (filePath === USERS_FILE) {
          Object.keys(parsed).forEach(key => {
            const user = parsed[key];
            // Remover metadata de MongoDB
            delete user.$setOnInsert;
            delete user.__v;
            // Arreglar valores nulos o inválidos
            if (user.totalXp === null || user.totalXp === undefined) user.totalXp = 0;
            if (user.level === null || user.level === undefined || user.level < 0) user.level = 0;
            if (user.xp === null || user.xp === undefined) user.xp = 0;
          });
        }
        
        return parsed;
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

  getUser(guildId, userId, memberInfo = null) {
    const key = `${guildId}-${userId}`;
    if (!this.users[key]) {
      this.users[key] = {
        userId,
        guildId,
        xp: 0,
        level: 0,
        totalXp: 0,
        selectedCardTheme: null,
        purchasedCards: [],
        rankcard_custom: null,
        afk: { status: false, reason: null, timestamp: null },
        lastActivity: Date.now(),
        inactivityMessages: 0,
        isInactive: false,
        username: null,
        displayName: null,
        avatar: null
      };
    }
    
    if (memberInfo) {
      const user = this.users[key];
      user.username = memberInfo.username || user.username;
      user.displayName = memberInfo.displayName || user.displayName;
      user.avatar = memberInfo.avatar || user.avatar;
    }
    
    const user = this.users[key];
    let needsPersist = false;

    if (user.lastActivity === undefined) {
      user.lastActivity = Date.now();
      needsPersist = true;
    }
    if (user.inactivityMessages === undefined) {
      user.inactivityMessages = 0;
      needsPersist = true;
    }
    if (user.isInactive === undefined) {
      user.isInactive = false;
      needsPersist = true;
    }
    
    if (user.totalXp === null || user.totalXp === undefined || isNaN(user.totalXp)) {
      user.totalXp = 0;
      needsPersist = true;
    }
    if (user.level === null || user.level === undefined || isNaN(user.level) || user.level < 0) {
      user.level = 0;
      needsPersist = true;
    }
    if (user.xp === null || user.xp === undefined || isNaN(user.xp)) {
      user.xp = 0;
      needsPersist = true;
    }
    
    if (needsPersist) {
      this.saveFile(USERS_FILE, this.users);
      if (this.mongoSync) {
        setImmediate(() => {
          this.mongoSync.saveUserToMongo(guildId, userId, user).catch(err => 
            console.error('Error persisting corrected user to MongoDB:', err.message)
          );
        });
      }
    }
    
    return user;
  }

  saveUser(guildId, userId, data) {
    const key = `${guildId}-${userId}`;
    this.users[key] = { ...this.users[key], ...data };
    this.saveFile(USERS_FILE, this.users);
    
    // Guardar a MongoDB en background (no bloquea Discord)
    if (this.mongoSync) {
      setImmediate(() => {
        this.mongoSync.saveUserToMongo(guildId, userId, this.users[key]).catch(err => 
          console.error('Error guardando a MongoDB:', err.message)
        );
      });
    }
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
    
    // Guardar boosts a MongoDB en background
    if (this.mongoSync) {
      setImmediate(() => {
        this.mongoSync.saveBoostsToMongo(this.boosts).catch(err => 
          console.error('Error guardando boosts en MongoDB:', err.message)
        );
      });
    }
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
      if (this.mongoSync) {
        setImmediate(() => {
          this.mongoSync.saveBoostsToMongo(this.boosts).catch(err => 
            console.error('Error guardando boosts en MongoDB:', err.message)
          );
        });
      }
    }

    return active;
  }

  removeGlobalBoost() {
    this.boosts.global = [];
    this.saveFile(BOOSTS_FILE, this.boosts);
    
    if (this.mongoSync) {
      setImmediate(() => {
        this.mongoSync.saveBoostsToMongo(this.boosts).catch(err => 
          console.error('Error guardando boosts en MongoDB:', err.message)
        );
      });
    }
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

  getSystemStatus(guildId) {
    if (!this.systems[guildId]) {
      this.systems[guildId] = {
        economy: true,
        casino: true,
        jobs: true,
        minigames: true,
        insurance: true,
        robbery: true,
        missions: true,
        powerups: true
      };
    }
    return this.systems[guildId];
  }

  setSystemStatus(guildId, system, enabled) {
    if (!this.systems[guildId]) {
      this.systems[guildId] = {
        economy: true,
        casino: true,
        jobs: true,
        minigames: true,
        insurance: true,
        robbery: true,
        missions: true,
        powerups: true
      };
    }
    this.systems[guildId][system] = enabled;
    this.saveFile(SYSTEMS_FILE, this.systems);
  }

  isSystemEnabled(guildId, system) {
    const status = this.getSystemStatus(guildId);
    return status[system] !== false;
  }
}

export default new Database();
