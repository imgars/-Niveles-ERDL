import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOSTS_FILE = path.join(DATA_DIR, 'boosts.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');
const SYSTEMS_FILE = path.join(DATA_DIR, 'systems.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const SYSTEMS_ADVANCED_FILE = path.join(DATA_DIR, 'systems_advanced.json');

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
    this.audit = this.loadFile(AUDIT_FILE, []);
    this.alerts = this.loadFile(ALERTS_FILE, []);
    this.systemsAdvanced = this.loadFile(SYSTEMS_ADVANCED_FILE, {});
    this.settings = { maintenanceMode: false };
    this.mongoSync = null;
    this._commandStats = {};
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
        
        if (filePath === USERS_FILE) {
          Object.keys(parsed).forEach(key => {
            const user = parsed[key];
            delete user.$setOnInsert;
            delete user.__v;
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
      id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      target,
      multiplier,
      expiresAt: duration ? Date.now() + duration : null,
      description,
      createdAt: Date.now()
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
    
    if (this.mongoSync) {
      setImmediate(() => {
        this.mongoSync.saveBoostsToMongo(this.boosts).catch(err => 
          console.error('Error guardando boosts en MongoDB:', err.message)
        );
      });
    }

    return boost;
  }

  removeBoostById(boostId) {
    let removed = false;

    const globalIdx = this.boosts.global.findIndex(b => b.id === boostId);
    if (globalIdx > -1) {
      this.boosts.global.splice(globalIdx, 1);
      removed = true;
    }

    if (!removed) {
      for (const userId of Object.keys(this.boosts.users)) {
        const idx = this.boosts.users[userId].findIndex(b => b.id === boostId);
        if (idx > -1) {
          this.boosts.users[userId].splice(idx, 1);
          removed = true;
          break;
        }
      }
    }

    if (!removed) {
      for (const channelId of Object.keys(this.boosts.channels)) {
        const idx = this.boosts.channels[channelId].findIndex(b => b.id === boostId);
        if (idx > -1) {
          this.boosts.channels[channelId].splice(idx, 1);
          removed = true;
          break;
        }
      }
    }

    if (removed) {
      this.saveFile(BOOSTS_FILE, this.boosts);
      if (this.mongoSync) {
        setImmediate(() => {
          this.mongoSync.saveBoostsToMongo(this.boosts).catch(err => 
            console.error('Error guardando boosts en MongoDB:', err.message)
          );
        });
      }
    }

    return removed;
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

  getAllBoostsRaw() {
    const now = Date.now();
    const all = [];

    for (const b of this.boosts.global) {
      if (!b.expiresAt || b.expiresAt > now) {
        all.push({ ...b, category: 'global' });
      }
    }

    for (const [userId, boosts] of Object.entries(this.boosts.users || {})) {
      for (const b of boosts) {
        if (!b.expiresAt || b.expiresAt > now) {
          all.push({ ...b, category: 'user', target: userId });
        }
      }
    }

    for (const [channelId, boosts] of Object.entries(this.boosts.channels || {})) {
      for (const b of boosts) {
        if (!b.expiresAt || b.expiresAt > now) {
          all.push({ ...b, category: 'channel', target: channelId });
        }
      }
    }

    return all;
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

  resetUserCooldowns(userId) {
    let changed = false;
    for (const type of Object.keys(this.cooldowns)) {
      if (this.cooldowns[type][userId]) {
        delete this.cooldowns[type][userId];
        changed = true;
      }
    }
    if (changed) this.saveFile(COOLDOWNS_FILE, this.cooldowns);
    return changed;
  }

  getUserCooldowns(userId) {
    const result = {};
    const now = Date.now();
    for (const type of Object.keys(this.cooldowns)) {
      if (this.cooldowns[type][userId]) {
        const remaining = this.cooldowns[type][userId] - now;
        if (remaining > 0) {
          result[type] = { expiresAt: this.cooldowns[type][userId], remaining };
        }
      }
    }
    return result;
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
    if (!this.bans.users.hasOwnProperty(userId)) return false;
    if (this.bans.users[userId] === null) return true;
    if (this.bans.users[userId] > Date.now()) return true;
    delete this.bans.users[userId];
    this.saveFile(BANS_FILE, this.bans);
    return false;
  }

  getUserBanInfo(userId) {
    if (!this.bans.users.hasOwnProperty(userId)) return null;
    return {
      banned: this.isUserBanned(userId),
      expiresAt: this.bans.users[userId] || null,
      permanent: this.bans.users[userId] === null
    };
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

  getSystemsAdvanced(guildId) {
    const SYSTEM_META = {
      economy: {
        name: 'Economía',
        icon: '💰',
        description: 'Coins, banco, trabajo diario y recompensas',
        commands: ['balance', 'bank', 'daily', 'depositar', 'retirar', 'gift', 'trade', 'tax', 'economy', 'staffeconomy']
      },
      casino: {
        name: 'Casino',
        icon: '🎰',
        description: 'Juegos de azar: blackjack, slots, ruleta, dados',
        commands: ['blackjack', 'slots', 'coinflip', 'dice', 'bankheist', 'casinoextendido', 'casinomulti']
      },
      jobs: {
        name: 'Trabajos',
        icon: '💼',
        description: 'Sistema de trabajo y generación de ingresos',
        commands: ['trabajar', 'work', 'bored']
      },
      minigames: {
        name: 'Minijuegos',
        icon: '🎮',
        description: 'Juegos interactivos y de habilidad',
        commands: ['minigame', 'gamecard', 'tradecard', '8ball']
      },
      insurance: {
        name: 'Seguros',
        icon: '🛡️',
        description: 'Sistema de seguros para proteger monedas',
        commands: ['seguro']
      },
      robbery: {
        name: 'Robos',
        icon: '🔫',
        description: 'Sistema de robo entre usuarios',
        commands: ['robar', 'rob']
      },
      missions: {
        name: 'Misiones',
        icon: '🎯',
        description: 'Misiones semanales con recompensas',
        commands: ['mision']
      },
      powerups: {
        name: 'Power-ups',
        icon: '⚡',
        description: 'Multiplicadores de XP y boosts',
        commands: ['powerups', 'boost', 'globalboost', 'removeglobalboost']
      }
    };

    const basicStatus = this.getSystemStatus(guildId);
    if (!this.systemsAdvanced[guildId]) this.systemsAdvanced[guildId] = {};

    const result = {};
    for (const [key, meta] of Object.entries(SYSTEM_META)) {
      const advanced = this.systemsAdvanced[guildId][key] || {};
      result[key] = {
        ...meta,
        enabled: basicStatus[key] !== false,
        reason: advanced.reason || null,
        disabledAt: advanced.disabledAt || null,
        disabledBy: advanced.disabledBy || null,
        scheduledReactivation: advanced.scheduledReactivation || null,
        channelOverrides: advanced.channelOverrides || {}
      };
    }

    return result;
  }

  setSystemAdvanced(guildId, system, options) {
    if (!this.systemsAdvanced[guildId]) this.systemsAdvanced[guildId] = {};
    if (!this.systemsAdvanced[guildId][system]) this.systemsAdvanced[guildId][system] = {};

    const adv = this.systemsAdvanced[guildId][system];

    if (options.enabled !== undefined) {
      this.setSystemStatus(guildId, system, options.enabled);
      if (!options.enabled) {
        adv.disabledAt = Date.now();
        adv.disabledBy = options.adminName || 'Admin';
      } else {
        adv.disabledAt = null;
        adv.disabledBy = null;
        adv.reason = null;
        adv.scheduledReactivation = null;
      }
    }

    if (options.reason !== undefined) adv.reason = options.reason;
    if (options.scheduledReactivation !== undefined) adv.scheduledReactivation = options.scheduledReactivation;

    if (options.channelOverride) {
      if (!adv.channelOverrides) adv.channelOverrides = {};
      adv.channelOverrides[options.channelOverride.channelId] = options.channelOverride.enabled;
    }

    if (options.removeChannelOverride) {
      if (adv.channelOverrides) {
        delete adv.channelOverrides[options.removeChannelOverride];
      }
    }

    this.saveFile(SYSTEMS_ADVANCED_FILE, this.systemsAdvanced);
  }

  checkScheduledReactivations(guildId) {
    if (!this.systemsAdvanced[guildId]) return;
    const now = Date.now();
    let changed = false;

    for (const [system, adv] of Object.entries(this.systemsAdvanced[guildId])) {
      if (adv.scheduledReactivation && adv.scheduledReactivation <= now) {
        this.setSystemStatus(guildId, system, true);
        adv.scheduledReactivation = null;
        adv.disabledAt = null;
        adv.disabledBy = null;
        adv.reason = null;
        changed = true;
      }
    }

    if (changed) this.saveFile(SYSTEMS_ADVANCED_FILE, this.systemsAdvanced);
  }

  logAdminAction(adminName, action, details = {}) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      adminName,
      action,
      details
    };

    this.audit.unshift(entry);
    if (this.audit.length > 2000) this.audit = this.audit.slice(0, 2000);
    this.saveFile(AUDIT_FILE, this.audit);
    return entry;
  }

  getAuditLog({ page = 1, limit = 50, action = null, adminName = null, since = null } = {}) {
    let logs = [...this.audit];

    if (action) logs = logs.filter(l => l.action === action || l.action.includes(action));
    if (adminName) logs = logs.filter(l => l.adminName?.toLowerCase().includes(adminName.toLowerCase()));
    if (since) logs = logs.filter(l => l.timestamp >= since);

    const total = logs.length;
    const start = (page - 1) * limit;
    return {
      logs: logs.slice(start, start + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  generateAlert(type, message, severity = 'info', details = {}) {
    const existing = this.alerts.find(a => !a.dismissed && a.type === type && a.message === message);
    if (existing) return existing;

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      severity,
      details,
      dismissed: false
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 500) this.alerts = this.alerts.slice(0, 500);
    this.saveFile(ALERTS_FILE, this.alerts);
    return alert;
  }

  getAlertsList({ includeDismissed = false } = {}) {
    if (includeDismissed) return this.alerts;
    return this.alerts.filter(a => !a.dismissed);
  }

  dismissAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.dismissed = true;
      this.saveFile(ALERTS_FILE, this.alerts);
      return true;
    }
    return false;
  }

  trackCommand(commandName) {
    if (!this._commandStats[commandName]) this._commandStats[commandName] = 0;
    this._commandStats[commandName]++;
  }

  getCommandStats() {
    return Object.entries(this._commandStats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  getTimeSeriesData(days = 7) {
    const now = Date.now();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400000;
      const dayEnd = now - i * 86400000;
      const label = new Date(dayEnd).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

      let xpGained = 0;
      let levelsUp = 0;

      for (const user of Object.values(this.users)) {
        if (user.lastUpdate && user.lastUpdate >= dayStart && user.lastUpdate < dayEnd) {
          xpGained += user.lastDayXp || 0;
          if (user.lastLevelUp && user.lastLevelUp >= dayStart && user.lastLevelUp < dayEnd) {
            levelsUp++;
          }
        }
      }

      result.push({ label, xp: xpGained, levels: levelsUp, missions: 0 });
    }

    return result;
  }
}

export default new Database();
