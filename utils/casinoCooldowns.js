import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const COOLDOWNS_FILE = path.join(DATA_DIR, 'casino_cooldowns.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CASINO_COOLDOWNS = {
  slots: 30000,
  blackjack: 45000,
  coinflip: 20000,
  dice: 25000,
  roulette: 60000,
  poker: 90000,
  crash: 40000,
  races: 120000
};

const BASE_ODDS = {
  slots: {
    jackpot: 0.005,
    threeMatch: 0.08,
    twoMatch: 0.25,
    bonus: 0.03
  },
  blackjack: {
    playerAdvantage: 0.48
  },
  coinflip: {
    winChance: 0.48
  },
  dice: {
    exactMatch: 0.16,
    overUnder: 0.45
  }
};

const NATIONALITY_CASINO_MODIFIERS = {
  venezuela: { luckMod: 0.95, payoutMod: 0.85 },
  mexico: { luckMod: 1.0, payoutMod: 0.95 },
  argentina: { luckMod: 0.98, payoutMod: 0.90 },
  colombia: { luckMod: 1.0, payoutMod: 0.95 },
  brasil: { luckMod: 1.02, payoutMod: 1.0 },
  ecuador: { luckMod: 0.97, payoutMod: 0.88 },
  peru: { luckMod: 0.98, payoutMod: 0.92 },
  chile: { luckMod: 1.05, payoutMod: 1.05 },
  uruguay: { luckMod: 1.03, payoutMod: 1.02 },
  el_salvador: { luckMod: 0.96, payoutMod: 0.87 },
  panama: { luckMod: 1.02, payoutMod: 1.0 },
  costa_rica: { luckMod: 1.01, payoutMod: 0.98 },
  republica_dominicana: { luckMod: 0.99, payoutMod: 0.93 },
  guatemala: { luckMod: 0.95, payoutMod: 0.85 },
  honduras: { luckMod: 0.94, payoutMod: 0.83 },
  bolivia: { luckMod: 0.96, payoutMod: 0.86 },
  paraguay: { luckMod: 0.97, payoutMod: 0.88 },
  nicaragua: { luckMod: 0.95, payoutMod: 0.84 },
  cuba: { luckMod: 0.93, payoutMod: 0.80 },
  espana: { luckMod: 1.08, payoutMod: 1.10 },
  estados_unidos: { luckMod: 1.10, payoutMod: 1.15 },
  canada: { luckMod: 1.08, payoutMod: 1.12 },
  reino_unido: { luckMod: 1.07, payoutMod: 1.10 },
  japon: { luckMod: 1.12, payoutMod: 1.18 }
};

function loadCooldownsFile() {
  try {
    if (fs.existsSync(COOLDOWNS_FILE)) {
      return JSON.parse(fs.readFileSync(COOLDOWNS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading casino cooldowns:', error);
  }
  return {};
}

function saveCooldownsFile(data) {
  try {
    fs.writeFileSync(COOLDOWNS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving casino cooldowns:', error);
  }
}

export function checkCasinoCooldown(userId, gameType) {
  const data = loadCooldownsFile();
  const key = `${userId}-${gameType}`;
  const now = Date.now();
  
  if (!data[key]) return { canPlay: true };
  
  const cooldownEnd = data[key] + (CASINO_COOLDOWNS[gameType] || 30000);
  
  if (now < cooldownEnd) {
    const remaining = cooldownEnd - now;
    return { 
      canPlay: false, 
      remaining,
      remainingSeconds: Math.ceil(remaining / 1000)
    };
  }
  
  return { canPlay: true };
}

export function setCasinoCooldown(userId, gameType) {
  const data = loadCooldownsFile();
  const key = `${userId}-${gameType}`;
  data[key] = Date.now();
  saveCooldownsFile(data);
}

export function getCooldownDuration(gameType) {
  return CASINO_COOLDOWNS[gameType] || 30000;
}

export function getGameOdds(gameType, nationality = null, powerupBonus = 0) {
  const baseOdds = { ...BASE_ODDS[gameType] };
  
  let luckMod = 1.0;
  let payoutMod = 1.0;
  
  if (nationality && NATIONALITY_CASINO_MODIFIERS[nationality]) {
    const mods = NATIONALITY_CASINO_MODIFIERS[nationality];
    luckMod = mods.luckMod;
    payoutMod = mods.payoutMod;
  }
  
  luckMod += powerupBonus;
  
  return {
    odds: baseOdds,
    luckMod,
    payoutMod
  };
}

export function calculateSlotResult(bet, nationality = null, powerupBonus = 0) {
  const { odds, luckMod, payoutMod } = getGameOdds('slots', nationality, powerupBonus);
  
  const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
  const weights = [25, 22, 20, 15, 10, 5, 3];
  
  function getRandomSymbol() {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < symbols.length; i++) {
      random -= weights[i];
      if (random <= 0) return symbols[i];
    }
    return symbols[0];
  }
  
  const reels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  
  let multiplier = 0;
  let jackpot = false;
  let won = false;
  
  const adjustedRoll = Math.random() * luckMod;
  
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    won = true;
    if (reels[0] === '7️⃣') {
      multiplier = 10;
      jackpot = true;
    } else if (reels[0] === '💎') {
      multiplier = 7;
    } else if (reels[0] === '⭐') {
      multiplier = 5;
    } else {
      multiplier = 3;
    }
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    if (adjustedRoll < odds.twoMatch * luckMod) {
      won = true;
      multiplier = 1.5;
    }
  }
  
  multiplier = Math.round(multiplier * payoutMod * 100) / 100;
  
  const winnings = won ? Math.floor(bet * multiplier) - bet : -bet;
  
  return {
    reels,
    won,
    jackpot,
    multiplier,
    winnings,
    bet
  };
}

export function calculateBlackjackResult(bet, nationality = null, powerupBonus = 0) {
  const { luckMod, payoutMod } = getGameOdds('blackjack', nationality, powerupBonus);
  
  function drawCard() {
    return Math.min(10, Math.floor(Math.random() * 13) + 1);
  }
  
  function calculateTotal(cards) {
    let total = cards.reduce((sum, card) => sum + card, 0);
    let aces = cards.filter(c => c === 1).length;
    while (total <= 11 && aces > 0) {
      total += 10;
      aces--;
    }
    return total;
  }
  
  const playerCards = [drawCard(), drawCard()];
  let dealerCards = [drawCard(), drawCard()];
  
  let playerTotal = calculateTotal(playerCards);
  
  const hitThreshold = 16 + Math.floor(luckMod);
  while (playerTotal < hitThreshold && playerTotal < 21) {
    playerCards.push(drawCard());
    playerTotal = calculateTotal(playerCards);
  }
  
  let dealerTotal = calculateTotal(dealerCards);
  while (dealerTotal < 17) {
    dealerCards.push(drawCard());
    dealerTotal = calculateTotal(dealerCards);
  }
  
  let result;
  let multiplier = 0;
  
  if (playerTotal > 21) {
    result = 'lose';
    multiplier = 0;
  } else if (dealerTotal > 21) {
    result = 'win';
    multiplier = 2;
  } else if (playerCards.length === 2 && playerTotal === 21) {
    result = 'blackjack';
    multiplier = 2.5;
  } else if (playerTotal > dealerTotal) {
    result = 'win';
    multiplier = 2;
  } else if (playerTotal === dealerTotal) {
    result = 'tie';
    multiplier = 1;
  } else {
    result = 'lose';
    multiplier = 0;
  }
  
  multiplier = Math.round(multiplier * payoutMod * 100) / 100;
  
  const winnings = Math.floor(bet * multiplier) - bet;
  
  return {
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal,
    result,
    multiplier,
    winnings,
    newBalance: 0
  };
}

export function calculateCoinflipResult(bet, choice, nationality = null, powerupBonus = 0) {
  const { odds, luckMod, payoutMod } = getGameOdds('coinflip', nationality, powerupBonus);
  
  const adjustedWinChance = Math.min(0.52, odds.winChance * luckMod);
  
  const result = Math.random() < 0.5 ? 'cara' : 'cruz';
  const won = result === choice;
  
  let actualWon = won;
  if (!won && Math.random() < (adjustedWinChance - 0.48)) {
    actualWon = true;
  }
  
  const multiplier = actualWon ? Math.round(1.9 * payoutMod * 100) / 100 : 0;
  const winnings = actualWon ? Math.floor(bet * multiplier) - bet : -bet;
  
  return {
    result: actualWon ? choice : (choice === 'cara' ? 'cruz' : 'cara'),
    won: actualWon,
    multiplier,
    winnings
  };
}

export function calculateDiceResult(bet, guess, nationality = null, powerupBonus = 0) {
  const { luckMod, payoutMod } = getGameOdds('dice', nationality, powerupBonus);
  
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;
  
  let won = false;
  let multiplier = 0;
  
  if (typeof guess === 'number') {
    if (total === guess) {
      won = true;
      multiplier = 5;
    }
  } else if (guess === 'alto' && total >= 8) {
    won = true;
    multiplier = 1.8;
  } else if (guess === 'bajo' && total <= 6) {
    won = true;
    multiplier = 1.8;
  } else if (guess === 'par' && total % 2 === 0) {
    won = true;
    multiplier = 1.9;
  } else if (guess === 'impar' && total % 2 !== 0) {
    won = true;
    multiplier = 1.9;
  }
  
  multiplier = Math.round(multiplier * payoutMod * 100) / 100;
  const winnings = won ? Math.floor(bet * multiplier) - bet : -bet;
  
  return {
    dice: [dice1, dice2],
    total,
    won,
    multiplier,
    winnings
  };
}

export function formatCooldownTime(ms) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export { CASINO_COOLDOWNS, BASE_ODDS, NATIONALITY_CASINO_MODIFIERS };
