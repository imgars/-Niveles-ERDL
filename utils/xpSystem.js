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
  let level = 0;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += calculateXPForLevel(level);
  }
  
  return level - 1;
}

export function getXPProgress(totalXp, level) {
  const currentLevelXP = getTotalXPForLevel(level);
  const nextLevelXP = getTotalXPForLevel(level + 1);
  const currentXP = totalXp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  
  return {
    current: Math.max(0, currentXP),
    needed: neededXP,
    percentage: Math.min(100, Math.max(0, (currentXP / neededXP) * 100))
  };
}

export function getRandomXP() {
  return Math.floor(Math.random() * (CONFIG.BASE_XP_MAX - CONFIG.BASE_XP_MIN + 1)) + CONFIG.BASE_XP_MIN;
}

export function calculateBoostMultiplier(boosts) {
  let totalMultiplier = 1.0;
  
  for (const boost of boosts) {
    totalMultiplier += boost.multiplier;
  }
  
  return totalMultiplier;
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
  
  let boostText = '\n';
  const uniqueBoosts = new Map();
  
  for (const boost of boosts) {
    const key = `${boost.target || 'global'}-${Math.round(boost.multiplier * 100)}`;
    if (!uniqueBoosts.has(key)) {
      uniqueBoosts.set(key, boost);
    }
  }
  
  for (const boost of uniqueBoosts.values()) {
    const percentage = Math.round(boost.multiplier * 100);
    const timeLeft = boost.expiresAt ? Math.ceil((boost.expiresAt - Date.now()) / 1000 / 60) : null;
    const timeStr = timeLeft ? ` (${timeLeft}min)` : '';
    boostText += `🚀 **+${percentage}% boost**${timeStr}\n`;
  }
  
  return boostText;
}
