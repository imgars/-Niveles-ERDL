import mongoose from 'mongoose';

const MAX_LOGS = 1000;
const activityLogs = [];

export const LOG_TYPES = {
  XP_GAIN: 'xp_gain',
  XP_LOSS: 'xp_loss',
  LEVEL_UP: 'level_up',
  LEVEL_DOWN: 'level_down',
  ROLE_GAIN: 'role_gain',
  ROLE_LOSS: 'role_loss',
  COINS_GAIN: 'coins_gain',
  COINS_LOSS: 'coins_loss',
  WORK: 'work',
  CASINO_WIN: 'casino_win',
  CASINO_LOSS: 'casino_loss',
  THEFT_SUCCESS: 'theft_success',
  THEFT_FAIL: 'theft_fail',
  THEFT_VICTIM: 'theft_victim',
  MISSION_COMPLETE: 'mission_complete',
  ITEM_GAIN: 'item_gain',
  ITEM_USE: 'item_use',
  MINIGAME_WIN: 'minigame_win',
  MINIGAME_LOSS: 'minigame_loss',
  DAILY_REWARD: 'daily_reward',
  BANK_DEPOSIT: 'bank_deposit',
  BANK_WITHDRAW: 'bank_withdraw',
  SHOP_PURCHASE: 'shop_purchase',
  POWERUP_ACTIVATE: 'powerup_activate',
  STREAK_GAIN: 'streak_gain',
  STREAK_LOSS: 'streak_loss',
  ADMIN_ACTION: 'admin_action',
  RANKCARD_UNLOCK: 'rankcard_unlock',
  COMMAND_USE: 'command_use',
  BUTTON_CLICK: 'button_click',
  GIFT_SENT: 'gift_sent',
  GIFT_RECEIVED: 'gift_received',
  MARRIAGE: 'marriage',
  DIVORCE: 'divorce',
  NATIONALITY_CHANGE: 'nationality_change',
  TRAVEL: 'travel',
  AUCTION_CREATE: 'auction_create',
  AUCTION_BID: 'auction_bid',
  TRADE: 'trade',
  INSURANCE_BUY: 'insurance_buy',
  TAX_PAID: 'tax_paid',
  BANK_HEIST: 'bank_heist',
  CONFIG_CHANGE: 'config_change',
  GAMECARD_GENERATE: 'gamecard_generate'
};

export const SYSTEMS = [
  'economia', 'niveles', 'casino', 'minijuegos', 'misiones',
  'nacionalidades', 'social', 'admin', 'tienda', 'powerups',
  'robos', 'seguridad', 'general'
];

const SYSTEM_MAP = {
  [LOG_TYPES.WORK]: 'economia',
  [LOG_TYPES.COINS_GAIN]: 'economia',
  [LOG_TYPES.COINS_LOSS]: 'economia',
  [LOG_TYPES.DAILY_REWARD]: 'economia',
  [LOG_TYPES.BANK_DEPOSIT]: 'economia',
  [LOG_TYPES.BANK_WITHDRAW]: 'economia',
  [LOG_TYPES.GIFT_SENT]: 'economia',
  [LOG_TYPES.GIFT_RECEIVED]: 'economia',
  [LOG_TYPES.TAX_PAID]: 'economia',
  [LOG_TYPES.XP_GAIN]: 'niveles',
  [LOG_TYPES.XP_LOSS]: 'niveles',
  [LOG_TYPES.LEVEL_UP]: 'niveles',
  [LOG_TYPES.LEVEL_DOWN]: 'niveles',
  [LOG_TYPES.ROLE_GAIN]: 'niveles',
  [LOG_TYPES.ROLE_LOSS]: 'niveles',
  [LOG_TYPES.CASINO_WIN]: 'casino',
  [LOG_TYPES.CASINO_LOSS]: 'casino',
  [LOG_TYPES.MINIGAME_WIN]: 'minijuegos',
  [LOG_TYPES.MINIGAME_LOSS]: 'minijuegos',
  [LOG_TYPES.MISSION_COMPLETE]: 'misiones',
  [LOG_TYPES.NATIONALITY_CHANGE]: 'nacionalidades',
  [LOG_TYPES.TRAVEL]: 'nacionalidades',
  [LOG_TYPES.MARRIAGE]: 'social',
  [LOG_TYPES.DIVORCE]: 'social',
  [LOG_TYPES.STREAK_GAIN]: 'social',
  [LOG_TYPES.STREAK_LOSS]: 'social',
  [LOG_TYPES.ADMIN_ACTION]: 'admin',
  [LOG_TYPES.CONFIG_CHANGE]: 'admin',
  [LOG_TYPES.SHOP_PURCHASE]: 'tienda',
  [LOG_TYPES.ITEM_GAIN]: 'tienda',
  [LOG_TYPES.ITEM_USE]: 'tienda',
  [LOG_TYPES.POWERUP_ACTIVATE]: 'powerups',
  [LOG_TYPES.THEFT_SUCCESS]: 'robos',
  [LOG_TYPES.THEFT_FAIL]: 'robos',
  [LOG_TYPES.THEFT_VICTIM]: 'robos',
  [LOG_TYPES.BANK_HEIST]: 'robos',
  [LOG_TYPES.INSURANCE_BUY]: 'robos',
  [LOG_TYPES.COMMAND_USE]: 'general',
  [LOG_TYPES.BUTTON_CLICK]: 'general',
  [LOG_TYPES.RANKCARD_UNLOCK]: 'general',
  [LOG_TYPES.GAMECARD_GENERATE]: 'general',
  [LOG_TYPES.AUCTION_CREATE]: 'economia',
  [LOG_TYPES.AUCTION_BID]: 'economia',
  [LOG_TYPES.TRADE]: 'economia'
};

const activityLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true },
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, index: true },
  system: { type: String, index: true },
  userId: { type: String, index: true },
  username: String,
  guildId: String,
  guildName: String,
  command: String,
  commandOptions: { type: mongoose.Schema.Types.Mixed, default: {} },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  amount: { type: Number, default: 0 },
  balanceBefore: Number,
  balanceAfter: Number,
  xpBefore: Number,
  xpAfter: Number,
  levelBefore: Number,
  levelAfter: Number,
  reason: String,
  importance: { type: String, index: true, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  result: { type: String, enum: ['success', 'failure', 'error', 'cooldown'], default: 'success' }
});

let ActivityLog;
try {
  ActivityLog = mongoose.model('ActivityLog');
} catch {
  ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

export function logActivity(data) {
  const logType = data.type || 'unknown';
  const detectedSystem = SYSTEM_MAP[logType] || 'general';

  const log = {
    logId: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: logType,
    system: data.system || detectedSystem,
    userId: data.userId || null,
    username: data.username || 'Desconocido',
    guildId: data.guildId || null,
    guildName: data.guildName || 'Servidor',
    command: data.command || null,
    commandOptions: data.commandOptions || {},
    details: data.details || {},
    amount: data.amount || 0,
    balanceBefore: data.balanceBefore ?? null,
    balanceAfter: data.balanceAfter ?? null,
    xpBefore: data.xpBefore ?? null,
    xpAfter: data.xpAfter ?? null,
    levelBefore: data.levelBefore ?? null,
    levelAfter: data.levelAfter ?? null,
    reason: data.reason || '',
    importance: data.importance || 'low',
    result: data.result || 'success'
  };

  activityLogs.unshift(log);

  if (activityLogs.length > MAX_LOGS) {
    activityLogs.pop();
  }

  if (isMongoReady()) {
    const doc = new ActivityLog(log);
    doc.save().catch(err => {
      console.error('Error guardando log en MongoDB:', err.message);
    });
  }

  return log;
}

function getPeriodDate(period) {
  const now = Date.now();
  switch (period) {
    case 'hour': return new Date(now - 60 * 60 * 1000);
    case 'day': return new Date(now - 24 * 60 * 60 * 1000);
    case 'week': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export function getLogs(options = {}) {
  let logs = [...activityLogs];

  if (options.type) {
    logs = logs.filter(l => l.type === options.type);
  }

  if (options.userId) {
    logs = logs.filter(l => l.userId === options.userId);
  }

  if (options.types && Array.isArray(options.types)) {
    logs = logs.filter(l => options.types.includes(l.type));
  }

  if (options.system) {
    logs = logs.filter(l => l.system === options.system);
  }

  if (options.importance) {
    logs = logs.filter(l => l.importance === options.importance);
  }

  if (options.since) {
    const sinceDate = new Date(options.since);
    logs = logs.filter(l => new Date(l.timestamp) >= sinceDate);
  }

  if (options.period && options.period !== 'all') {
    const periodDate = getPeriodDate(options.period);
    if (periodDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= periodDate);
    }
  }

  if (options.sortBy === 'importance') {
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    logs.sort((a, b) => (importanceOrder[a.importance] ?? 3) - (importanceOrder[b.importance] ?? 3));
  }

  const page = options.page || 1;
  const limit = options.limit || 100;
  const start = (page - 1) * limit;

  return {
    logs: logs.slice(start, start + limit),
    total: logs.length,
    page,
    limit,
    totalPages: Math.ceil(logs.length / limit)
  };
}

export async function getLogsFromMongo(options = {}) {
  if (!isMongoReady()) return { logs: [], total: 0, page: 1, limit: 100, totalPages: 0 };

  try {
    const query = {};

    if (options.type) query.type = options.type;
    if (options.types && Array.isArray(options.types)) query.type = { $in: options.types };
    if (options.userId) query.userId = options.userId;
    if (options.system) query.system = options.system;
    if (options.importance) query.importance = options.importance;
    if (options.guildId) query.guildId = options.guildId;

    if (options.since) {
      query.timestamp = { $gte: new Date(options.since) };
    }

    if (options.period && options.period !== 'all') {
      const periodDate = getPeriodDate(options.period);
      if (periodDate) {
        query.timestamp = { ...(query.timestamp || {}), $gte: periodDate };
      }
    }

    const page = options.page || 1;
    const limit = options.limit || 100;
    const skip = (page - 1) * limit;

    let sortObj = { timestamp: -1 };
    if (options.sortBy === 'importance') {
      sortObj = { importance: 1, timestamp: -1 };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error obteniendo logs de MongoDB:', error.message);
    return { logs: [], total: 0, page: 1, limit: 100, totalPages: 0 };
  }
}

export function getUserLogs(userId, limit = 50) {
  return activityLogs.filter(l => l.userId === userId).slice(0, limit);
}

export function getLogStats() {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const logsLastHour = activityLogs.filter(l => new Date(l.timestamp).getTime() > hourAgo);
  const logsLastDay = activityLogs.filter(l => new Date(l.timestamp).getTime() > dayAgo);

  const typeCounts = {};
  const systemCounts = {};
  const importanceCounts = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const log of activityLogs) {
    typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;

    const sys = log.system || 'general';
    systemCounts[sys] = (systemCounts[sys] || 0) + 1;

    const imp = log.importance || 'low';
    if (importanceCounts[imp] !== undefined) {
      importanceCounts[imp]++;
    }
  }

  return {
    total: activityLogs.length,
    lastHour: logsLastHour.length,
    lastDay: logsLastDay.length,
    byType: typeCounts,
    bySystem: systemCounts,
    byImportance: importanceCounts
  };
}

export function getAlerts() {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const alerts = [];

  const recentLogs = activityLogs.filter(l => new Date(l.timestamp).getTime() > hourAgo);

  const theftByUser = {};
  const casinoWinsByUser = {};
  let adminCount = 0;

  for (const log of recentLogs) {
    if (log.type === LOG_TYPES.THEFT_SUCCESS || log.type === LOG_TYPES.THEFT_FAIL) {
      theftByUser[log.userId] = (theftByUser[log.userId] || 0) + 1;
    }

    if (log.type === LOG_TYPES.CASINO_WIN) {
      if (!casinoWinsByUser[log.userId]) casinoWinsByUser[log.userId] = [];
      casinoWinsByUser[log.userId].push(log);
    }

    if (log.type === LOG_TYPES.ADMIN_ACTION || log.type === LOG_TYPES.CONFIG_CHANGE) {
      adminCount++;
    }
  }

  for (const [userId, count] of Object.entries(theftByUser)) {
    if (count > 10) {
      alerts.push({
        type: 'theft_abuse',
        message: `Usuario con ${count} intentos de robo en la última hora`,
        userId,
        severity: 'high'
      });
    }
  }

  for (const [userId, wins] of Object.entries(casinoWinsByUser)) {
    if (wins.length > 5) {
      const sorted = wins.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < sorted.length; i++) {
        const allBetween = recentLogs.filter(l =>
          l.userId === userId &&
          l.type === LOG_TYPES.CASINO_LOSS &&
          new Date(l.timestamp) > new Date(sorted[i - 1].timestamp) &&
          new Date(l.timestamp) < new Date(sorted[i].timestamp)
        );
        if (allBetween.length === 0) {
          consecutive++;
          if (consecutive > maxConsecutive) maxConsecutive = consecutive;
        } else {
          consecutive = 1;
        }
      }
      if (maxConsecutive > 5) {
        alerts.push({
          type: 'casino_streak',
          message: `Usuario ganó ${maxConsecutive} juegos de casino consecutivos en la última hora`,
          userId,
          severity: 'medium'
        });
      }
    }
  }

  if (adminCount > 20) {
    alerts.push({
      type: 'admin_overuse',
      message: `${adminCount} acciones de admin en la última hora`,
      userId: null,
      severity: 'medium'
    });
  }

  return alerts;
}

export function exportLogs(options = {}) {
  const result = getLogs(options);
  return result.logs.map(log => ({
    logId: log.logId || log.id,
    timestamp: log.timestamp,
    type: log.type,
    system: log.system || '',
    userId: log.userId || '',
    username: log.username || '',
    guildId: log.guildId || '',
    guildName: log.guildName || '',
    command: log.command || '',
    amount: log.amount || 0,
    balanceBefore: log.balanceBefore ?? '',
    balanceAfter: log.balanceAfter ?? '',
    xpBefore: log.xpBefore ?? '',
    xpAfter: log.xpAfter ?? '',
    levelBefore: log.levelBefore ?? '',
    levelAfter: log.levelAfter ?? '',
    reason: log.reason || '',
    importance: log.importance || 'low',
    result: log.result || 'success',
    details: JSON.stringify(log.details || {}),
    commandOptions: JSON.stringify(log.commandOptions || {})
  }));
}

export async function loadLogsFromMongo() {
  if (!isMongoReady()) return;

  try {
    const docs = await ActivityLog.find({}).sort({ timestamp: -1 }).limit(MAX_LOGS).lean();

    if (docs && docs.length > 0) {
      activityLogs.length = 0;
      for (const doc of docs) {
        activityLogs.push({
          logId: doc.logId,
          timestamp: doc.timestamp ? doc.timestamp.toISOString() : new Date().toISOString(),
          type: doc.type,
          system: doc.system || 'general',
          userId: doc.userId,
          username: doc.username,
          guildId: doc.guildId,
          guildName: doc.guildName,
          command: doc.command || null,
          commandOptions: doc.commandOptions || {},
          details: doc.details || {},
          amount: doc.amount || 0,
          balanceBefore: doc.balanceBefore ?? null,
          balanceAfter: doc.balanceAfter ?? null,
          xpBefore: doc.xpBefore ?? null,
          xpAfter: doc.xpAfter ?? null,
          levelBefore: doc.levelBefore ?? null,
          levelAfter: doc.levelAfter ?? null,
          reason: doc.reason || '',
          importance: doc.importance || 'low',
          result: doc.result || 'success'
        });
      }
      console.log(`✅ Cargados ${docs.length} logs de actividad desde MongoDB`);
    }
  } catch (error) {
    console.error('Error cargando logs desde MongoDB:', error.message);
  }
}

export function getSystemsList() {
  return [...SYSTEMS];
}

export function clearLogs() {
  activityLogs.length = 0;
}
