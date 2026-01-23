const MAX_LOGS = 500;
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
  RANKCARD_UNLOCK: 'rankcard_unlock'
};

export function logActivity(data) {
  const log = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: data.type || 'unknown',
    userId: data.userId || null,
    username: data.username || 'Desconocido',
    guildId: data.guildId || null,
    guildName: data.guildName || 'Servidor',
    details: data.details || {},
    amount: data.amount || 0,
    reason: data.reason || ''
  };
  
  activityLogs.unshift(log);
  
  if (activityLogs.length > MAX_LOGS) {
    activityLogs.pop();
  }
  
  return log;
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
  
  if (options.since) {
    const sinceDate = new Date(options.since);
    logs = logs.filter(l => new Date(l.timestamp) >= sinceDate);
  }
  
  const limit = options.limit || 100;
  return logs.slice(0, limit);
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
  for (const log of activityLogs) {
    typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;
  }
  
  return {
    total: activityLogs.length,
    lastHour: logsLastHour.length,
    lastDay: logsLastDay.length,
    byType: typeCounts
  };
}

export function clearLogs() {
  activityLogs.length = 0;
}
