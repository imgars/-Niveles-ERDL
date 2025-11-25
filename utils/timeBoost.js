import moment from 'moment-timezone';
import cron from 'node-cron';
import { CONFIG } from '../config.js';
import db from './database.js';

let nightBoostActive = false;

export function isNightTime() {
  const now = moment().tz(CONFIG.VENEZUELA_TIMEZONE);
  const hour = now.hour();
  return hour >= 18 || hour < 6;
}

export function initializeNightBoost() {
  cron.schedule('0 * * * *', () => {
    const shouldBeActive = isNightTime();
    
    if (shouldBeActive && !nightBoostActive) {
      nightBoostActive = true;
      console.log('🌙 Night boost activated (25%)');
    } else if (!shouldBeActive && nightBoostActive) {
      nightBoostActive = false;
      console.log('☀️ Night boost deactivated');
    }
  });
  
  nightBoostActive = isNightTime();
  console.log(`🌙 Night boost initialized: ${nightBoostActive ? 'Active' : 'Inactive'}`);
}

export function getNightBoostMultiplier() {
  return nightBoostActive ? CONFIG.NIGHT_BOOST_MULTIPLIER : 0;
}

export function getNightBoostStatus() {
  return {
    active: nightBoostActive,
    multiplier: CONFIG.NIGHT_BOOST_MULTIPLIER,
    timezone: CONFIG.VENEZUELA_TIMEZONE
  };
}
