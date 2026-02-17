import { CONFIG } from '../config.js';
import { getNightBoostStatus } from './timeBoost.js';

export function calculateXPForLevel(level) {
  if (level <= 0) return 0;
  
  let baseXP;
  
  if (level <= 5) {
    baseXP = 100;
  } else if (level <= 10) {
    baseXP = 150;
  } else if (level <= 15) {
    baseXP = 250;
  } else if (level <= 20) {
    baseXP = 400;
  } else if (level <= 35) {
    baseXP = 600;
  } else if (level <= 40) {
    baseXP = 850;
  } else if (level <= 50) {
    baseXP = 1200;
  } else if (level <= 75) {
    baseXP = 1800;
  } else if (level <= 90) {
    baseXP = 2500;
  } else {
    baseXP = 3500;
  }
  
  return Math.floor(baseXP * (1 + (level * 0.1)));
}

export function getTotalXPForLevel(level) {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

export function calculateLevel(totalXp) {
  if (totalXp === null || totalXp === undefined || isNaN(totalXp) || totalXp < 0) {
    return 0;
  }
  
  totalXp = Math.floor(Number(totalXp));
  
  let level = 0;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += calculateXPForLevel(level);
  }
  
  return Math.max(0, level - 1);
}

export function getXPProgress(totalXp, level) {
  if (totalXp === null || totalXp === undefined || isNaN(totalXp)) totalXp = 0;
  if (level === null || level === undefined || isNaN(level) || level < 0) level = 0;
  
  totalXp = Math.floor(Number(totalXp));
  level = Math.floor(Number(level));
  
  const currentLevelXP = getTotalXPForLevel(level);
  const nextLevelXP = getTotalXPForLevel(level + 1);
  const currentXP = totalXp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  
  const safeCurrentXP = isNaN(currentXP) ? 0 : Math.max(0, currentXP);
  const safeNeededXP = isNaN(neededXP) || neededXP <= 0 ? 1 : neededXP;
  const percentage = (safeCurrentXP / safeNeededXP) * 100;
  
  return {
    current: safeCurrentXP,
    needed: safeNeededXP,
    percentage: isNaN(percentage) ? 0 : Math.min(100, Math.max(0, percentage))
  };
}

export function getRandomXP() {
  return Math.floor(Math.random() * (CONFIG.BASE_XP_MAX - CONFIG.BASE_XP_MIN + 1)) + CONFIG.BASE_XP_MIN;
}

export function calculateBoostMultiplier(boosts, isInactive = false) {
  if (isInactive) return 0.5; // Ganar XP dos veces más lento
  if (!boosts || boosts.length === 0) return 1.0;
  
  let totalMultiplier = 100;
  
  for (const boost of boosts) {
    if (boost.multiplier >= 1) {
      totalMultiplier += (boost.multiplier - 100);
    } else {
      totalMultiplier += (boost.multiplier * 100);
    }
  }
  
  return Math.max(1, totalMultiplier / 100);
}

export function addLevels(currentTotalXp, levelsToAdd) {
  const wholeLevels = Math.floor(levelsToAdd);
  const fractionalPart = levelsToAdd - wholeLevels;
  
  let newTotalXp = currentTotalXp;
  
  for (let i = 0; i < wholeLevels; i++) {
    const currentLevel = calculateLevel(newTotalXp);
    const xpNeededForNextLevel = calculateXPForLevel(currentLevel + 1);
    newTotalXp += xpNeededForNextLevel;
  }
  
  if (fractionalPart > 0) {
    const currentLevel = calculateLevel(newTotalXp);
    const xpNeededForNextLevel = calculateXPForLevel(currentLevel + 1);
    newTotalXp += Math.floor(xpNeededForNextLevel * fractionalPart);
  }
  
  return newTotalXp;
}

export function removeLevels(currentTotalXp, levelsToRemove) {
  const wholeLevels = Math.floor(levelsToRemove);
  const fractionalPart = levelsToRemove - wholeLevels;
  
  let newTotalXp = currentTotalXp;
  
  for (let i = 0; i < wholeLevels; i++) {
    const currentLevel = calculateLevel(newTotalXp);
    if (currentLevel === 0) break;
    
    const xpNeededForCurrentLevel = calculateXPForLevel(currentLevel);
    newTotalXp -= xpNeededForCurrentLevel;
  }
  
  if (fractionalPart > 0) {
    const currentLevel = calculateLevel(newTotalXp);
    if (currentLevel > 0) {
      const xpNeededForCurrentLevel = calculateXPForLevel(currentLevel);
      newTotalXp -= Math.floor(xpNeededForCurrentLevel * fractionalPart);
    }
  }
  
  return Math.max(0, newTotalXp);
}

export function getActiveBoostsText(boosts) {
  if (!boosts || boosts.length === 0) return '';
  
  const boostLines = boosts.map(boost => {
    const percentage = boost.multiplier >= 1 ? Math.round(boost.multiplier - 100) : Math.round(boost.multiplier * 100);
    
    let remaining = '';
    if (boost.expiresAt) {
      const now = Date.now();
      const expiresAt = new Date(boost.expiresAt).getTime();
      const diff = expiresAt - now;
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          remaining = ` (${hours}h ${minutes}m)`;
        } else {
          remaining = ` (${minutes}m)`;
        }
      }
    }
    
    return `+${percentage}%${remaining}`;
  });
  
  return boostLines.join('\n');
}

export function getSimplifiedBoostsText(boosts) {
  if (!boosts || boosts.length === 0) return '';
  
  let totalPercentage = 0;
  for (const boost of boosts) {
    if (boost.multiplier >= 1) {
      totalPercentage += (boost.multiplier - 100);
    } else {
      totalPercentage += (boost.multiplier * 100);
    }
  }
  
  return `🚀 +${Math.round(totalPercentage)}%`;
}

export function getBoostTextForCard(boosts) {
  if (!boosts || boosts.length === 0) return '';
  
  let totalPercentage = 0;
  for (const boost of boosts) {
    if (boost.multiplier >= 1) {
      totalPercentage += (boost.multiplier - 100);
    } else {
      totalPercentage += (boost.multiplier * 100);
    }
  }
  
  return `Boost activo del ${Math.round(totalPercentage)}%`;
}

export function formatBoostMultiplier(multiplier) {
  const percentage = multiplier >= 1 ? Math.round(multiplier - 100) : Math.round(multiplier * 100);
  return `+${percentage}%`;
}
