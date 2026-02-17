import mongoose from 'mongoose';
import { isMongoConnected } from './mongoSync.js';

export const STREAK_BREAK_CHANNEL_ID = '1441276918916710501';

const streakSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  user1Id: { type: String, required: true, index: true },
  user2Id: { type: String, required: true, index: true },
  streakCount: { type: Number, default: 0 },
  user1LastMessage: { type: Date, default: null },
  user2LastMessage: { type: Date, default: null },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'broken', 'expired'],
    default: 'pending'
  },
  initiatorId: { type: String },
  highestStreak: { type: Number, default: 0 },
  breakHistory: [{
    date: Date,
    streakAtBreak: Number,
    reason: String
  }]
});

streakSchema.index({ guildId: 1, user1Id: 1, user2Id: 1 }, { unique: true });

let StreakModel;
try {
  StreakModel = mongoose.model('StreakV2');
} catch {
  StreakModel = mongoose.model('StreakV2', streakSchema);
}

function sortUserIds(user1Id, user2Id) {
  return [user1Id, user2Id].sort();
}

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return getDateString(new Date(date1)) === getDateString(new Date(date2));
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export async function createStreakRequest(guildId, initiatorId, targetId) {
  if (!isMongoConnected()) return { error: 'database_unavailable' };
  
  try {
    const [user1Id, user2Id] = sortUserIds(initiatorId, targetId);
    
    const existing = await StreakModel.findOne({
      guildId,
      user1Id,
      user2Id,
      status: { $in: ['pending', 'active'] }
    });
    
    if (existing) {
      if (existing.status === 'pending') {
        return { error: 'pending_request_exists' };
      }
      return { error: 'streak_already_active', streak: existing };
    }
    
    const streak = new StreakModel({
      guildId,
      user1Id,
      user2Id,
      initiatorId,
      status: 'pending',
      streakCount: 0
    });
    
    await streak.save();
    return { success: true, streak };
  } catch (error) {
    console.error('Error creating streak request:', error);
    return { error: 'system_error' };
  }
}

export async function acceptStreakRequest(guildId, initiatorId, acceptorId) {
  if (!isMongoConnected()) return { error: 'database_unavailable' };
  
  try {
    const [user1Id, user2Id] = sortUserIds(initiatorId, acceptorId);
    
    const streak = await StreakModel.findOne({
      guildId,
      user1Id,
      user2Id,
      status: 'pending',
      initiatorId
    });
    
    if (!streak) {
      return { error: 'no_pending_request' };
    }
    
    streak.status = 'active';
    streak.streakCount = 1;
    streak.lastUpdated = new Date();
    streak.user1LastMessage = new Date();
    streak.user2LastMessage = new Date();
    
    await streak.save();
    return { success: true, streak };
  } catch (error) {
    console.error('Error accepting streak request:', error);
    return { error: 'system_error' };
  }
}

export async function rejectStreakRequest(guildId, initiatorId, rejectorId) {
  if (!isMongoConnected()) return { error: 'database_unavailable' };
  
  try {
    const [user1Id, user2Id] = sortUserIds(initiatorId, rejectorId);
    
    const result = await StreakModel.deleteOne({
      guildId,
      user1Id,
      user2Id,
      status: 'pending',
      initiatorId
    });
    
    if (result.deletedCount === 0) {
      return { error: 'no_pending_request' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting streak request:', error);
    return { error: 'system_error' };
  }
}

export async function recordMessage(guildId, senderId, receiverId) {
  if (!isMongoConnected()) return null;
  
  try {
    const [user1Id, user2Id] = sortUserIds(senderId, receiverId);
    
    const streak = await StreakModel.findOne({
      guildId,
      user1Id,
      user2Id,
      status: 'active'
    });
    
    if (!streak) return null;
    
    const today = getDateString();
    const isUser1 = senderId === user1Id;
    const userLastMessage = isUser1 ? streak.user1LastMessage : streak.user2LastMessage;
    const otherLastMessage = isUser1 ? streak.user2LastMessage : streak.user1LastMessage;
    
    if (userLastMessage && getDateString(new Date(userLastMessage)) === today) {
      return { alreadyRecorded: true, streak };
    }
    
    if (isUser1) {
      streak.user1LastMessage = new Date();
    } else {
      streak.user2LastMessage = new Date();
    }
    
    const user1Today = getDateString(new Date(streak.user1LastMessage)) === today;
    const user2Today = getDateString(new Date(streak.user2LastMessage)) === today;
    
    if (user1Today && user2Today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      
      const lastUpdateStr = getDateString(new Date(streak.lastUpdated));
      
      if (lastUpdateStr !== today) {
        streak.streakCount += 1;
        streak.lastUpdated = new Date();
        
        if (streak.streakCount > streak.highestStreak) {
          streak.highestStreak = streak.streakCount;
        }
        
        await streak.save();
        return { 
          extended: true, 
          streak,
          newCount: streak.streakCount,
          message: `La racha ha crecido a ${streak.streakCount} dias`
        };
      }
    }
    
    await streak.save();
    return { recorded: true, streak };
  } catch (error) {
    console.error('Error recording message:', error);
    return null;
  }
}

export async function checkAndBreakExpiredStreaks(client) {
  if (!isMongoConnected()) return [];
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const expiredStreaks = await StreakModel.find({
      status: 'active',
      lastUpdated: { $lt: yesterday }
    });
    
    const brokenStreaks = [];
    
    for (const streak of expiredStreaks) {
      const daysMissed = getDaysDifference(streak.lastUpdated, new Date());
      
      if (daysMissed >= 2) {
        streak.breakHistory.push({
          date: new Date(),
          streakAtBreak: streak.streakCount,
          reason: 'expired'
        });
        
        const oldCount = streak.streakCount;
        streak.status = 'broken';
        await streak.save();
        
        brokenStreaks.push({
          guildId: streak.guildId,
          user1Id: streak.user1Id,
          user2Id: streak.user2Id,
          streakCount: oldCount,
          daysMissed
        });
      }
    }
    
    if (brokenStreaks.length > 0 && client) {
      await notifyBrokenStreaks(client, brokenStreaks);
    }
    
    return brokenStreaks;
  } catch (error) {
    console.error('Error checking expired streaks:', error);
    return [];
  }
}

async function notifyBrokenStreaks(client, brokenStreaks) {
  try {
    const groupedByGuild = {};
    
    for (const streak of brokenStreaks) {
      if (!groupedByGuild[streak.guildId]) {
        groupedByGuild[streak.guildId] = [];
      }
      groupedByGuild[streak.guildId].push(streak);
    }
    
    for (const [guildId, streaks] of Object.entries(groupedByGuild)) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(STREAK_BREAK_CHANNEL_ID);
        
        if (!channel) continue;
        
        for (const streak of streaks) {
          const embed = {
            color: 0xFF4444,
            title: '💔 Racha Rota',
            description: `La racha entre <@${streak.user1Id}> y <@${streak.user2Id}> se ha roto.`,
            fields: [
              { name: '🔥 Dias de Racha', value: `${streak.streakCount} dias`, inline: true },
              { name: '📅 Dias sin hablar', value: `${streak.daysMissed} dias`, inline: true }
            ],
            footer: { text: 'Pueden crear una nueva racha con /racha crear' },
            timestamp: new Date().toISOString()
          };
          
          await channel.send({ embeds: [embed] });
        }
      } catch (e) {
        console.error(`Error notifying broken streaks for guild ${guildId}:`, e.message);
      }
    }
  } catch (error) {
    console.error('Error in notifyBrokenStreaks:', error);
  }
}

export async function getUserStreaks(guildId, userId) {
  if (!isMongoConnected()) return [];
  
  try {
    const streaks = await StreakModel.find({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active'
    }).sort({ streakCount: -1 }).lean();
    
    return streaks.map(s => ({
      ...s,
      partnerId: s.user1Id === userId ? s.user2Id : s.user1Id,
      myLastMessage: s.user1Id === userId ? s.user1LastMessage : s.user2LastMessage,
      partnerLastMessage: s.user1Id === userId ? s.user2LastMessage : s.user1LastMessage
    }));
  } catch (error) {
    console.error('Error getting user streaks:', error);
    return [];
  }
}

export async function getStreakBetween(guildId, user1Id, user2Id) {
  if (!isMongoConnected()) return null;
  
  try {
    const [sortedUser1, sortedUser2] = sortUserIds(user1Id, user2Id);
    
    const streak = await StreakModel.findOne({
      guildId,
      user1Id: sortedUser1,
      user2Id: sortedUser2
    }).lean();
    
    return streak;
  } catch (error) {
    console.error('Error getting streak between users:', error);
    return null;
  }
}

export async function getStreakLeaderboard(guildId, limit = 10) {
  if (!isMongoConnected()) return [];
  
  try {
    const streaks = await StreakModel.find({
      guildId,
      status: 'active'
    }).sort({ streakCount: -1 }).limit(limit).lean();
    
    return streaks;
  } catch (error) {
    console.error('Error getting streak leaderboard:', error);
    return [];
  }
}

export async function deleteStreak(guildId, user1Id, user2Id) {
  if (!isMongoConnected()) return { error: 'database_unavailable' };
  
  try {
    const [sortedUser1, sortedUser2] = sortUserIds(user1Id, user2Id);
    
    const result = await StreakModel.deleteOne({
      guildId,
      user1Id: sortedUser1,
      user2Id: sortedUser2
    });
    
    if (result.deletedCount === 0) {
      return { error: 'streak_not_found' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting streak:', error);
    return { error: 'system_error' };
  }
}

export async function getStreakStats(guildId, userId) {
  if (!isMongoConnected()) return null;
  
  try {
    const activeStreaks = await StreakModel.find({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active'
    }).lean();
    
    const brokenStreaks = await StreakModel.find({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'broken'
    }).lean();
    
    const allStreaks = [...activeStreaks, ...brokenStreaks];
    
    const totalDays = allStreaks.reduce((sum, s) => sum + (s.highestStreak || s.streakCount), 0);
    const longestStreak = Math.max(0, ...allStreaks.map(s => s.highestStreak || s.streakCount));
    
    return {
      activeCount: activeStreaks.length,
      brokenCount: brokenStreaks.length,
      totalDays,
      longestStreak,
      currentStreaks: activeStreaks
    };
  } catch (error) {
    console.error('Error getting streak stats:', error);
    return null;
  }
}

export async function getAllActiveStreaks(guildId = null) {
  if (!isMongoConnected()) return [];
  
  try {
    const query = { status: 'active' };
    if (guildId) query.guildId = guildId;
    
    return await StreakModel.find(query).lean();
  } catch (error) {
    console.error('Error getting all active streaks:', error);
    return [];
  }
}

export async function resetAllStreaks(guildId) {
  if (!isMongoConnected()) return { error: 'database_unavailable' };
  
  try {
    const result = await StreakModel.deleteMany({ guildId });
    return { success: true, deleted: result.deletedCount };
  } catch (error) {
    console.error('Error resetting all streaks:', error);
    return { error: 'system_error' };
  }
}
