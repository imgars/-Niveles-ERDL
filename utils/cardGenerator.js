import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';

const CARD_WIDTH = 800;
const CARD_HEIGHT = 250;

export async function getAvailableThemes(member, level, purchasedCards = []) {
  const userId = member.user.id;
  let roles;
  const themes = ['discord', 'pixel'];
  
  try {
    const freshMember = await member.guild.members.fetch(userId);
    roles = freshMember.roles.cache;
  } catch (error) {
    console.error('Error fetching fresh member for card theme:', error);
    roles = member.roles.cache;
  }
  
  if (userId === CONFIG.SPECIAL_USER_ID) {
    return ['discord', 'roblox', 'minecraft', 'zelda', 'fnaf', 'geometrydash', 'pixel'];
  }
  
  if (roles && roles.has(CONFIG.VIP_ROLE_ID)) {
    themes.push('night');
  }
  
  if (roles && roles.has(CONFIG.BOOSTER_ROLE_ID)) {
    themes.push('geometrydash');
  }
  
  if (level >= 100) {
    themes.push('pokemon');
  }
  
  if (roles && roles.has(CONFIG.LEVEL_ROLES[35])) {
    themes.push('zelda');
  }
  
  if (roles && roles.has(CONFIG.LEVEL_ROLES[25])) {
    themes.push('ocean');
  }
  
  if (purchasedCards && purchasedCards.length > 0) {
    for (const card of purchasedCards) {
      if (!themes.includes(card)) {
        themes.push(card);
      }
    }
  }
  
  return [...new Set(themes)];
}

export async function getCardTheme(member, level, selectedTheme = null, purchasedCards = []) {
  const userId = member.user.id;
  let roles;
  
  try {
    const freshMember = await member.guild.members.fetch(userId);
    roles = freshMember.roles.cache;
  } catch (error) {
    console.error('Error fetching fresh member for card theme:', error);
    roles = member.roles.cache;
  }
  
  if (selectedTheme) {
    const available = await getAvailableThemes(member, level, purchasedCards);
    if (available.includes(selectedTheme)) {
      return selectedTheme;
    }
  }
  
  if (userId === CONFIG.SPECIAL_USER_ID) {
    const themes = ['roblox', 'minecraft', 'zelda', 'fnaf', 'geometrydash'];
    return themes[Math.floor(Math.random() * themes.length)];
  }
  
  if (roles && roles.has(CONFIG.VIP_ROLE_ID)) {
    return 'night';
  }
  
  if (roles && roles.has(CONFIG.BOOSTER_ROLE_ID)) {
    return 'geometrydash';
  }
  
  if (level >= 100) {
    return 'pokemon';
  }
  
  if (roles && roles.has(CONFIG.LEVEL_ROLES[35])) {
    return 'zelda';
  }
  
  if (roles && roles.has(CONFIG.LEVEL_ROLES[25])) {
    return 'ocean';
  }
  
  return 'discord';
}

export function getThemeButtonColor(theme) {
  const colors = getPixelArtThemeColors(theme);
  return colors.buttonColor || 'Primary';
}

export function getThemeButtonStyle(theme) {
  const themeStyles = {
    pixel: 1,
    ocean: 1,
    zelda: 2,
    pokemon: 4,
    geometrydash: 3,
    night: 2,
    roblox: 4,
    minecraft: 3,
    fnaf: 4,
  };
  return themeStyles[theme] || 1;
}

function drawPixelatedRect(ctx, x, y, width, height, pixelSize = 4) {
  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = x + col * pixelSize;
      const py = y + row * pixelSize;
      ctx.fillRect(px, py, pixelSize - 0.5, pixelSize - 0.5);
    }
  }
}

function getPixelArtThemeColors(theme) {
  const themes = {
    discord: {
      gradient: [
        { pos: 0, color: '#36393F' },
        { pos: 0.5, color: '#2F3136' },
        { pos: 1, color: '#202225' }
      ],
      border: '#5865F2',
      accent: '#5865F2',
      text: '#FFFFFF',
      textShadow: '#000000',
      barBg: '#202225',
      barFill: ['#5865F2', '#7289DA'],
      buttonColor: 'Primary'
    },
    pixel: {
      gradient: [
        { pos: 0, color: '#00CED1' },
        { pos: 0.5, color: '#20B2AA' },
        { pos: 1, color: '#008B8B' }
      ],
      border: '#00FFFF',
      accent: '#40E0D0',
      text: '#FFFFFF',
      textShadow: '#004444',
      barBg: '#1a3a3a',
      barFill: ['#00CED1', '#40E0D0'],
      buttonColor: 'Primary'
    },
    ocean: {
      gradient: [
        { pos: 0, color: '#0077BE' },
        { pos: 0.5, color: '#00A3E0' },
        { pos: 1, color: '#005F8A' }
      ],
      border: '#00BFFF',
      accent: '#00CED1',
      text: '#FFFFFF',
      textShadow: '#003366',
      barBg: '#002244',
      barFill: ['#00BFFF', '#87CEEB'],
      buttonColor: 'Primary'
    },
    zelda: {
      gradient: [
        { pos: 0, color: '#90EE90' },
        { pos: 0.5, color: '#FFD700' },
        { pos: 1, color: '#228B22' }
      ],
      border: '#FFD700',
      accent: '#98FB98',
      text: '#FFFFFF',
      textShadow: '#2F4F2F',
      barBg: '#2F4F2F',
      barFill: ['#FFD700', '#90EE90'],
      buttonColor: 'Success'
    },
    pokemon: {
      gradient: [
        { pos: 0, color: '#FF6B35' },
        { pos: 0.5, color: '#FF4500' },
        { pos: 1, color: '#FFD700' }
      ],
      border: '#FF0000',
      accent: '#FFD700',
      text: '#FFFFFF',
      textShadow: '#8B0000',
      barBg: '#4A0000',
      barFill: ['#FF4500', '#FFD700'],
      buttonColor: 'Danger'
    },
    geometrydash: {
      gradient: [
        { pos: 0, color: '#FF00FF' },
        { pos: 0.25, color: '#00FFFF' },
        { pos: 0.5, color: '#00FF00' },
        { pos: 0.75, color: '#FFFF00' },
        { pos: 1, color: '#FF00FF' }
      ],
      border: '#00FF00',
      accent: '#FF00FF',
      text: '#FFFFFF',
      textShadow: '#330033',
      barBg: '#1a0033',
      barFill: ['#00FF00', '#FF00FF', '#00FFFF'],
      buttonColor: 'Success'
    },
    night: {
      gradient: [
        { pos: 0, color: '#191970' },
        { pos: 0.5, color: '#0F0F3F' },
        { pos: 1, color: '#000033' }
      ],
      border: '#4169E1',
      accent: '#FFD700',
      text: '#FFFFFF',
      textShadow: '#000022',
      barBg: '#0a0a1a',
      barFill: ['#9370DB', '#4169E1'],
      stars: true,
      buttonColor: 'Secondary'
    },
    roblox: {
      gradient: [
        { pos: 0, color: '#E31C3D' },
        { pos: 0.5, color: '#B31B31' },
        { pos: 1, color: '#8B0000' }
      ],
      border: '#FF0000',
      accent: '#00A2FF',
      text: '#FFFFFF',
      textShadow: '#4A0000',
      barBg: '#2a0a0a',
      barFill: ['#00A2FF', '#00FFFF'],
      buttonColor: 'Danger'
    },
    minecraft: {
      gradient: [
        { pos: 0, color: '#4A7C59' },
        { pos: 0.5, color: '#5D8A5C' },
        { pos: 1, color: '#3B5323' }
      ],
      border: '#8B4513',
      accent: '#55FF55',
      text: '#FFFFFF',
      textShadow: '#1A2F1A',
      barBg: '#2F4F2F',
      barFill: ['#55FF55', '#00FF00'],
      buttonColor: 'Success'
    },
    fnaf: {
      gradient: [
        { pos: 0, color: '#1C0A00' },
        { pos: 0.5, color: '#2D1810' },
        { pos: 1, color: '#000000' }
      ],
      border: '#8B0000',
      accent: '#FFD700',
      text: '#FFFFFF',
      textShadow: '#000000',
      barBg: '#1a0a0a',
      barFill: ['#FFD700', '#FF6347'],
      buttonColor: 'Danger'
    }
  };
  
  return themes[theme] || themes.discord;
}

function drawPixelBorder(ctx, x, y, width, height, color, thickness = 4) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, thickness);
  ctx.fillRect(x, y + height - thickness, width, thickness);
  ctx.fillRect(x, y, thickness, height);
  ctx.fillRect(x + width - thickness, y, thickness, height);
  
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + thickness, y + thickness, width - thickness * 2, thickness / 2);
  ctx.fillRect(x + thickness, y + thickness, thickness / 2, height - thickness * 2);
}

function drawPixelatedGradientBackground(ctx, width, height, colors) {
  const pixelSize = 8;
  const rows = Math.ceil(height / pixelSize);
  const cols = Math.ceil(width / pixelSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = row / rows;
      
      let color;
      for (let i = 0; i < colors.length - 1; i++) {
        if (t >= colors[i].pos && t <= colors[i + 1].pos) {
          const localT = (t - colors[i].pos) / (colors[i + 1].pos - colors[i].pos);
          color = interpolateColor(colors[i].color, colors[i + 1].color, localT);
          break;
        }
      }
      if (!color) color = colors[colors.length - 1].color;
      
      const noise = (Math.random() - 0.5) * 15;
      const rgb = hexToRgb(color);
      const adjustedColor = `rgb(${Math.max(0, Math.min(255, rgb.r + noise))}, ${Math.max(0, Math.min(255, rgb.g + noise))}, ${Math.max(0, Math.min(255, rgb.b + noise))})`;
      
      ctx.fillStyle = adjustedColor;
      ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
    }
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function interpolateColor(color1, color2, t) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawStars(ctx, width, height, count = 30) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    const brightness = Math.random() * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, size, size);
  }
}

function drawPixelText(ctx, text, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Press Start 2P", monospace, Arial`;
  ctx.fillText(text, x, y);
}

export async function generateRankCard(member, userData, progress, boostsText = '') {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const theme = await getCardTheme(member, userData.level, userData.selectedCardTheme, userData.purchasedCards || []);
  const colors = getPixelArtThemeColors(theme);
  
  drawPixelatedGradientBackground(ctx, CARD_WIDTH, CARD_HEIGHT, colors.gradient);
  
  if (colors.stars) {
    drawStars(ctx, CARD_WIDTH, CARD_HEIGHT);
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let i = 0; i < CARD_HEIGHT; i += 4) {
    if (i % 8 === 0) {
      ctx.fillRect(0, i, CARD_WIDTH, 2);
    }
  }
  
  drawPixelBorder(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, colors.border, 6);
  drawPixelBorder(ctx, 8, 8, CARD_WIDTH - 16, CARD_HEIGHT - 16, 'rgba(0,0,0,0.3)', 2);
  
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    
    const avatarSize = 140;
    const avatarX = 35;
    const avatarY = (CARD_HEIGHT - avatarSize) / 2;
    
    ctx.fillStyle = colors.border;
    ctx.fillRect(avatarX - 6, avatarY - 6, avatarSize + 12, avatarSize + 12);
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(avatarX - 4, avatarY - 4, avatarSize + 8, avatarSize + 8);
    
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    
    ctx.fillStyle = colors.border;
    ctx.fillRect(avatarX, avatarY, avatarSize, 3);
    ctx.fillRect(avatarX, avatarY + avatarSize - 3, avatarSize, 3);
    ctx.fillRect(avatarX, avatarY, 3, avatarSize);
    ctx.fillRect(avatarX + avatarSize - 3, avatarY, 3, avatarSize);
  } catch (error) {
    console.error('Error loading avatar:', error);
  }
  
  const textX = 210;
  const shadowOffset = 2;
  const shadowColor = colors.textShadow || '#000000';
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(textX - 5, 35, 560, 35);
  
  // Username with shadow
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = shadowColor;
  ctx.fillText(member.user.username, textX + shadowOffset, 60 + shadowOffset);
  ctx.fillStyle = colors.text;
  ctx.fillText(member.user.username, textX, 60);
  
  // Level with shadow
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = shadowColor;
  ctx.fillText(`NIVEL ${userData.level}`, textX + shadowOffset, 100 + shadowOffset);
  ctx.fillStyle = colors.accent;
  ctx.fillText(`NIVEL ${userData.level}`, textX, 100);
  
  // XP text with shadow
  const xpText = `XP: ${Math.floor(progress.current)} / ${Math.floor(progress.needed)}`;
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = shadowColor;
  ctx.fillText(xpText, textX + 1, 130 + 1);
  ctx.fillStyle = colors.text;
  ctx.fillText(xpText, textX, 130);
  
  const barX = textX;
  const barY = 150;
  const barWidth = 540;
  const barHeight = 28;
  
  ctx.fillStyle = colors.barBg;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX + 2, barY + 2, barWidth - 4, 4);
  
  const progressWidth = Math.max(8, (progress.percentage / 100) * barWidth);
  
  if (colors.barFill.length > 2) {
    const gradient = ctx.createLinearGradient(barX, 0, barX + progressWidth, 0);
    colors.barFill.forEach((color, i) => {
      gradient.addColorStop(i / (colors.barFill.length - 1), color);
    });
    ctx.fillStyle = gradient;
  } else {
    const gradient = ctx.createLinearGradient(barX, 0, barX + progressWidth, 0);
    gradient.addColorStop(0, colors.barFill[0]);
    gradient.addColorStop(1, colors.barFill[1] || colors.barFill[0]);
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(barX + 2, barY + 2, progressWidth - 4, barHeight - 4);
  
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(barX + 2, barY + 2, progressWidth - 4, (barHeight - 4) / 2);
  
  ctx.fillStyle = colors.border;
  ctx.fillRect(barX, barY, barWidth, 3);
  ctx.fillRect(barX, barY + barHeight - 3, barWidth, 3);
  ctx.fillRect(barX, barY, 3, barHeight);
  ctx.fillRect(barX + barWidth - 3, barY, 3, barHeight);
  
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 14px Arial, sans-serif';
  const percentText = `${Math.floor(progress.percentage)}%`;
  const textWidth = ctx.measureText(percentText).width;
  ctx.fillText(percentText, barX + (barWidth - textWidth) / 2, barY + 19);
  
  if (boostsText && boostsText.trim() !== '') {
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`🚀 ${boostsText}`, textX, barY + barHeight + 25);
  }
  
  const themeLabel = getThemeLabel(theme);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(CARD_WIDTH - 130, CARD_HEIGHT - 35, 120, 25);
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText(themeLabel, CARD_WIDTH - 125, CARD_HEIGHT - 17);
  
  return canvas.toBuffer('image/png');
}

function getThemeLabel(theme) {
  const labels = {
    discord: '💬 DISCORD',
    pixel: '🎮 PIXEL',
    ocean: '🌊 OCEAN',
    zelda: '⚔️ ZELDA',
    pokemon: '🔥 POKEMON',
    geometrydash: '🎵 GD NEON',
    night: '🌙 NIGHT',
    roblox: '🎲 ROBLOX',
    minecraft: '⛏️ MINECRAFT',
    fnaf: '🐻 FNAF'
  };
  return labels[theme] || theme.toUpperCase();
}

export async function generateLeaderboardImage(topUsers, guild, theme = 'discord') {
  const canvas = createCanvas(700, 50 + (topUsers.length * 65));
  const ctx = canvas.getContext('2d');
  
  const darkBg = '#2B2D31';
  const lightBg = '#313338';
  const accent = '#FFD700';
  const accentAlt = '#90EE90';
  const textColor = '#FFFFFF';
  const gold = '#FFD700';
  const silver = '#C0C0C0';
  const bronze = '#CD7F32';
  
  ctx.fillStyle = darkBg;
  ctx.fillRect(0, 0, 700, canvas.height);
  
  // Yellow border around entire leaderboard
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 700, 4);
  ctx.fillRect(0, canvas.height - 4, 700, 4);
  ctx.fillRect(0, 0, 4, canvas.height);
  ctx.fillRect(696, 0, 4, canvas.height);
  
  ctx.fillStyle = '#1E1F22';
  ctx.fillRect(0, 0, 700, 50);
  ctx.fillStyle = accent;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 LEADERBOARD 🏆', 350, 35);
  ctx.textAlign = 'left';
  
  const userDataArray = [];
  const usersToFetch = Math.min(10, topUsers.length);
  
  // Fetch all members in parallel
  const memberPromises = topUsers.slice(0, usersToFetch).map(user =>
    guild.members.fetch(user.userId).catch(() => null)
  );
  
  const members = await Promise.all(memberPromises);
  
  // Load all avatars in parallel with timeout
  const loadImageWithTimeout = async (url, timeoutMs = 5000) => {
    return Promise.race([
      loadImage(url).catch(() => null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)).catch(() => null)
    ]).catch(() => null);
  };
  
  const avatarPromises = members.map((member, i) => {
    if (!member) return Promise.resolve(null);
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 64 });
    return loadImageWithTimeout(avatarURL, 5000);
  });
  
  const avatars = await Promise.all(avatarPromises);
  
  // Build user data array
  for (let i = 0; i < usersToFetch; i++) {
    const user = topUsers[i];
    const member = members[i];
    const username = member ? member.user.username : 'Usuario';
    const avatar = avatars[i];
    userDataArray.push({ user, username, avatar });
  }
  
  // Draw everything
  for (let i = 0; i < userDataArray.length; i++) {
    const { user, username, avatar } = userDataArray[i];
    const y = 50 + (i * 65);
    const isTop3 = i < 3;
    
    // Define ranking colors
    let rankColor, rankBgColor;
    if (i === 0) {
      rankColor = gold;
      rankBgColor = 'rgba(255, 215, 0, 0.2)';
    } else if (i === 1) {
      rankColor = silver;
      rankBgColor = 'rgba(192, 192, 192, 0.15)';
    } else if (i === 2) {
      rankColor = bronze;
      rankBgColor = 'rgba(205, 127, 50, 0.15)';
    } else {
      rankColor = accent;
      rankBgColor = lightBg;
    }
    
    // Draw background - special for top 3
    if (isTop3) {
      ctx.fillStyle = rankBgColor;
      ctx.fillRect(0, y, 700, 62);
      // Border on left with ranking color
      ctx.fillStyle = rankColor;
      ctx.fillRect(0, y, 5, 62);
    } else {
      ctx.fillStyle = rankBgColor;
      ctx.fillRect(0, y, 700, 62);
    }
    
    ctx.fillStyle = accent;
    ctx.fillRect(0, y + 62, 700, 2);
    
    // Draw avatar if loaded
    if (avatar) {
      try {
        ctx.drawImage(avatar, 12, y + 7, 48, 48);
      } catch (error) {
        console.error('Error drawing avatar:', error);
      }
    }
    
    // Medal for top 3
    const medals = ['👑', '🥈', '🥉'];
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 20px Arial, sans-serif';
    if (isTop3) {
      ctx.fillText(medals[i], 68, y + 25);
    } else {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(`#${i + 1}`, 68, y + 20);
    }
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`@${username.substring(0, 20)}`, 108, y + 20);
    
    // Level - make it prominent
    const levelSize = isTop3 ? '22px' : '18px';
    ctx.textAlign = 'right';
    
    // Draw level with background box for top 3
    if (isTop3) {
      const levelText = `LVL: ${user.level}`;
      const levelMetrics = ctx.measureText(levelText);
      const boxWidth = levelMetrics.width + 12;
      const boxHeight = 28;
      const boxX = 700 - boxWidth - 8;
      const boxY = y + 5;
      
      // Box background with ranking color
      ctx.fillStyle = rankColor.replace(')', ', 0.3)').replace('#', 'rgba(');
      if (rankColor.startsWith('#')) {
        const rgb = hexToRgb(rankColor);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      }
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.fillStyle = rankColor;
      ctx.fillRect(boxX, boxY, boxWidth, 3);
      
      // Level text
      ctx.fillStyle = rankColor;
      ctx.font = `bold ${levelSize} Arial, sans-serif`;
      ctx.fillText(levelText, 680, y + 23);
    } else {
      ctx.fillStyle = accent;
      ctx.font = `bold 16px Arial, sans-serif`;
      ctx.fillText(`LVL: ${user.level}`, 680, y + 20);
    }
    
    ctx.textAlign = 'left';
  }
  
  return canvas.toBuffer('image/png');
}

export async function generateMinecraftLeaderboard(topUsers, guild) {
  const canvas = createCanvas(700, 760);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#8B8B8B';
  ctx.fillRect(0, 0, 700, 760);
  
  const dirtColors = ['#8B5A2B', '#6B4226', '#5D3A1A', '#7A4A23'];
  const pixelSize = 16;
  
  for (let y = 0; y < 760; y += pixelSize) {
    for (let x = 0; x < 700; x += pixelSize) {
      ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#555555';
  ctx.fillRect(18, 18, 664, 724);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ TOP 100+ LEGENDS ⚔️', 350, 55);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(40, 70, 620, 2);
  
  const usersToFetch = Math.min(10, topUsers.length);
  const memberPromises = topUsers.slice(0, usersToFetch).map(user =>
    guild.members.fetch(user.userId).catch(() => null)
  );
  const members = await Promise.all(memberPromises);
  
  const loadImageWithTimeout = async (url, timeoutMs = 5000) => {
    return Promise.race([
      loadImage(url).catch(() => null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)).catch(() => null)
    ]).catch(() => null);
  };
  
  const avatarPromises = members.map((member, i) => {
    if (!member) return Promise.resolve(null);
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 64 });
    return loadImageWithTimeout(avatarURL, 5000);
  });
  
  const avatars = await Promise.all(avatarPromises);
  
  for (let i = 0; i < usersToFetch; i++) {
    const user = topUsers[i];
    const member = members[i];
    const avatar = avatars[i];
    const y = 90 + (i * 62);
    
    ctx.fillStyle = i % 2 === 0 ? 'rgba(100, 100, 100, 0.3)' : 'rgba(60, 60, 60, 0.3)';
    ctx.fillRect(30, y, 640, 56);
    
    let rankColor;
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    else rankColor = '#55FF55';
    
    ctx.fillStyle = rankColor;
    ctx.fillRect(30, y, 4, 56);
    
    if (avatar) {
      try {
        ctx.fillStyle = '#333333';
        ctx.fillRect(42, y + 6, 46, 46);
        ctx.drawImage(avatar, 44, y + 8, 42, 42);
      } catch (error) {
        console.error('Error drawing avatar:', error);
      }
    }
    
    const medals = ['👑', '⚔️', '🛡️'];
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 20px Arial, sans-serif';
    if (i < 3) {
      ctx.fillText(medals[i], 100, y + 36);
    } else {
      ctx.fillText(`#${i + 1}`, 100, y + 36);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial, sans-serif';
    const username = member ? member.user.username : 'Steve';
    ctx.fillText(username.substring(0, 18), 150, y + 36);
    
    ctx.fillStyle = '#55FF55';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`LVL ${user.level}`, 530, y + 28);
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(`${(user.totalXp || 0).toLocaleString()} XP`, 530, y + 46);
  }
  
  ctx.fillStyle = '#555555';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Minecraft 1.12 Style - Elite Players', 350, 740);
  ctx.textAlign = 'left';
  
  return canvas.toBuffer('image/png');
}

export async function generatePokemonLeaderboard(topUsers, guild) {
  const canvas = createCanvas(700, 760);
  const ctx = canvas.getContext('2d');
  
  const pokemonColors = ['#FF6B35', '#FF4500', '#FFD700', '#FF8C00'];
  const pixelSize = 16;
  
  for (let y = 0; y < 760; y += pixelSize) {
    for (let x = 0; x < 700; x += pixelSize) {
      ctx.fillStyle = pokemonColors[Math.floor(Math.random() * pokemonColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(18, 18, 664, 724);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔥 POKEMON MASTERS 🔥', 350, 55);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(40, 70, 620, 2);
  
  const usersToFetch = Math.min(10, topUsers.length);
  const memberPromises = topUsers.slice(0, usersToFetch).map(user =>
    guild.members.fetch(user.userId).catch(() => null)
  );
  const members = await Promise.all(memberPromises);
  
  const loadImageWithTimeout = async (url, timeoutMs = 5000) => {
    return Promise.race([
      loadImage(url).catch(() => null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)).catch(() => null)
    ]).catch(() => null);
  };
  
  const avatarPromises = members.map((member, i) => {
    if (!member) return Promise.resolve(null);
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 64 });
    return loadImageWithTimeout(avatarURL, 5000);
  });
  
  const avatars = await Promise.all(avatarPromises);
  
  for (let i = 0; i < usersToFetch; i++) {
    const user = topUsers[i];
    const member = members[i];
    const avatar = avatars[i];
    const y = 90 + (i * 62);
    
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 100, 50, 0.15)' : 'rgba(255, 215, 0, 0.1)';
    ctx.fillRect(30, y, 640, 56);
    
    let rankColor;
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    else rankColor = '#FF4500';
    
    ctx.fillStyle = rankColor;
    ctx.fillRect(30, y, 4, 56);
    
    if (avatar) {
      try {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(42, y + 6, 46, 46);
        ctx.drawImage(avatar, 44, y + 8, 42, 42);
      } catch (error) {
        console.error('Error drawing avatar:', error);
      }
    }
    
    const medals = ['🏆', '⚡', '🌟'];
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 20px Arial, sans-serif';
    if (i < 3) {
      ctx.fillText(medals[i], 100, y + 36);
    } else {
      ctx.fillText(`#${i + 1}`, 100, y + 36);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial, sans-serif';
    const username = member ? member.user.username : 'Trainer';
    ctx.fillText(username.substring(0, 18), 150, y + 36);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`LVL ${user.level}`, 530, y + 28);
    ctx.fillStyle = '#FF8C00';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(`${(user.totalXp || 0).toLocaleString()} XP`, 530, y + 46);
  }
  
  ctx.fillStyle = '#FF4500';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Pokemon Style - Elite Trainers 100+', 350, 740);
  ctx.textAlign = 'left';
  
  return canvas.toBuffer('image/png');
}

export async function generateZeldaLeaderboard(topUsers, guild) {
  const canvas = createCanvas(700, 760);
  const ctx = canvas.getContext('2d');
  
  const zeldaColors = ['#90EE90', '#228B22', '#FFD700', '#2F4F2F'];
  const pixelSize = 16;
  
  for (let y = 0; y < 760; y += pixelSize) {
    for (let x = 0; x < 700; x += pixelSize) {
      ctx.fillStyle = zeldaColors[Math.floor(Math.random() * zeldaColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(18, 18, 664, 724);
  ctx.fillStyle = '#1a2f1a';
  ctx.fillRect(20, 20, 660, 720);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ HEROES OF HYRULE ⚔️', 350, 55);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#98FB98';
  ctx.fillRect(40, 70, 620, 2);
  
  for (let i = 0; i < Math.min(10, topUsers.length); i++) {
    const user = topUsers[i];
    const y = 90 + (i * 62);
    
    ctx.fillStyle = i % 2 === 0 ? 'rgba(144, 238, 144, 0.15)' : 'rgba(255, 215, 0, 0.1)';
    ctx.fillRect(30, y, 640, 56);
    
    let rankColor;
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    else rankColor = '#98FB98';
    
    ctx.fillStyle = rankColor;
    ctx.fillRect(30, y, 4, 56);
    
    try {
      const member = await guild.members.fetch(user.userId).catch(() => null);
      if (member) {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 64 });
        const avatar = await loadImage(avatarURL);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(42, y + 6, 46, 46);
        ctx.drawImage(avatar, 44, y + 8, 42, 42);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
    
    const medals = ['🏆', '🗡️', '🛡️'];
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 20px Arial, sans-serif';
    if (i < 3) {
      ctx.fillText(medals[i], 100, y + 36);
    } else {
      ctx.fillText(`#${i + 1}`, 100, y + 36);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial, sans-serif';
    let username = 'Hero';
    try {
      const member = await guild.members.fetch(user.userId).catch(() => null);
      if (member) {
        username = member.user.username;
      }
    } catch (e) {}
    ctx.fillText(username.substring(0, 18), 150, y + 36);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`LVL ${user.level}`, 530, y + 28);
    ctx.fillStyle = '#98FB98';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(`${(user.totalXp || 0).toLocaleString()} XP`, 530, y + 46);
  }
  
  ctx.fillStyle = '#98FB98';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Zelda Style - Super Activos', 350, 740);
  ctx.textAlign = 'left';
  
  return canvas.toBuffer('image/png');
}

export async function generateEconomyLeaderboardImage(leaderboard, client, type, guildName) {
  const width = 800;
  const height = 620;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const typeColors = {
    'lagcoins': {
      gradient: [
        { pos: 0, color: '#FFD700' },
        { pos: 0.5, color: '#DAA520' },
        { pos: 1, color: '#B8860B' }
      ],
      border: '#FFD700',
      accent: '#FFF8DC'
    },
    'casino': {
      gradient: [
        { pos: 0, color: '#8B0000' },
        { pos: 0.5, color: '#DC143C' },
        { pos: 1, color: '#4B0000' }
      ],
      border: '#FF0000',
      accent: '#FF6B6B'
    },
    'minigames': {
      gradient: [
        { pos: 0, color: '#2E8B57' },
        { pos: 0.5, color: '#3CB371' },
        { pos: 1, color: '#1E5631' }
      ],
      border: '#00FF00',
      accent: '#98FB98'
    },
    'trades': {
      gradient: [
        { pos: 0, color: '#4169E1' },
        { pos: 0.5, color: '#1E90FF' },
        { pos: 1, color: '#00008B' }
      ],
      border: '#00BFFF',
      accent: '#87CEEB'
    }
  };
  
  const colors = typeColors[type] || typeColors['lagcoins'];
  
  drawPixelatedGradientBackground(ctx, width, height, colors.gradient);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < height; i += 4) {
    if (i % 8 === 0) {
      ctx.fillRect(0, i, width, 2);
    }
  }
  
  drawPixelBorder(ctx, 0, 0, width, height, colors.border, 6);
  
  const titles = {
    'lagcoins': { title: '💰 TOP RICOS 💰', emoji: '💰' },
    'casino': { title: '🎰 CASINO MASTERS 🎰', emoji: '🎰' },
    'minigames': { title: '🎮 GAME CHAMPIONS 🎮', emoji: '🏆' },
    'trades': { title: '🤝 TOP TRADERS 🤝', emoji: '🤝' }
  };
  
  const config = titles[type] || titles['lagcoins'];
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.title, width / 2, 45);
  
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(guildName, width / 2, 70);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = colors.border;
  ctx.fillRect(40, 80, width - 80, 4);
  
  const startY = 100;
  const rowHeight = 50;
  
  for (let i = 0; i < Math.min(leaderboard.length, 10); i++) {
    const user = leaderboard[i];
    const y = startY + (i * rowHeight);
    
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(25, y, width - 50, 45);
    
    let rankColor;
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    else rankColor = colors.accent;
    
    ctx.fillStyle = rankColor;
    ctx.fillRect(25, y, 4, 45);
    
    const medals = ['👑', '🥈', '🥉'];
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillStyle = rankColor;
    if (i < 3) {
      ctx.fillText(medals[i], 45, y + 30);
    } else {
      ctx.fillText(`#${i + 1}`, 45, y + 30);
    }
    
    try {
      const discordUser = await client.users.fetch(user.userId);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText(discordUser.username.substring(0, 20), 100, y + 30);
    } catch {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText(`User ${user.userId.substring(0, 8)}...`, 100, y + 30);
    }
    
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 16px Arial, sans-serif';
    
    let valueText = '';
    switch (type) {
      case 'lagcoins':
        valueText = `${user.totalWealth.toLocaleString()} ${config.emoji}`;
        break;
      case 'casino':
        const sign = user.casinoProfit >= 0 ? '+' : '';
        valueText = `${sign}${user.casinoProfit.toLocaleString()} ${config.emoji}`;
        break;
      case 'minigames':
        valueText = `${user.minigamesWon} wins ${config.emoji}`;
        break;
      case 'trades':
        valueText = `${user.tradesCompleted + user.auctionsWon} trades ${config.emoji}`;
        break;
    }
    
    ctx.fillText(valueText, width - 45, y + 30);
    ctx.textAlign = 'left';
  }
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Pixel Art Style • ${new Date().toLocaleDateString('es-ES')}`, width / 2, height - 15);
  ctx.textAlign = 'left';
  
  return canvas.toBuffer('image/png');
}

export async function generateProfileImage(member, profile, userData) {
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const colors = getPixelArtThemeColors('pixel');
  
  drawPixelatedGradientBackground(ctx, width, height, colors.gradient);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < height; i += 4) {
    if (i % 8 === 0) {
      ctx.fillRect(0, i, width, 2);
    }
  }
  
  drawPixelBorder(ctx, 0, 0, width, height, colors.border, 6);
  
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    
    const avatarSize = 120;
    const avatarX = 40;
    const avatarY = 40;
    
    ctx.fillStyle = colors.border;
    ctx.fillRect(avatarX - 4, avatarY - 4, avatarSize + 8, avatarSize + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(avatarX - 2, avatarY - 2, avatarSize + 4, avatarSize + 4);
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  } catch (error) {
    console.error('Error loading avatar:', error);
  }
  
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText(member.user.username, 180, 80);
  
  ctx.fillStyle = colors.accent;
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(`Nivel ${userData?.level || 0} • ${(userData?.totalXp || 0).toLocaleString()} XP`, 180, 110);
  
  const sections = [
    { title: '💰 ECONOMIA', items: [
      { label: 'Cartera', value: `${(profile.lagcoins || 0).toLocaleString()} LC` },
      { label: 'Banco', value: `${(profile.bankBalance || 0).toLocaleString()} LC` },
      { label: 'Total', value: `${((profile.lagcoins || 0) + (profile.bankBalance || 0)).toLocaleString()} LC` }
    ]},
    { title: '🎰 CASINO', items: [
      { label: 'Partidas', value: `${profile.casinoStats?.plays || 0}` },
      { label: 'Victorias', value: `${profile.casinoStats?.wins || 0}` },
      { label: 'Beneficio', value: `${((profile.casinoStats?.totalWon || 0) - (profile.casinoStats?.totalLost || 0)).toLocaleString()}` }
    ]},
    { title: '📊 STATS', items: [
      { label: 'Trabajos', value: `${profile.jobStats?.totalJobs || 0}` },
      { label: 'Minijuegos', value: `${profile.minigamesWon || 0}` },
      { label: 'Trades', value: `${profile.tradesCompleted || 0}` }
    ]}
  ];
  
  let sectionX = 40;
  const sectionY = 180;
  const sectionWidth = 230;
  
  for (const section of sections) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(sectionX, sectionY, sectionWidth, 140);
    
    ctx.fillStyle = colors.border;
    ctx.fillRect(sectionX, sectionY, sectionWidth, 3);
    ctx.fillRect(sectionX, sectionY + 137, sectionWidth, 3);
    ctx.fillRect(sectionX, sectionY, 3, 140);
    ctx.fillRect(sectionX + sectionWidth - 3, sectionY, 3, 140);
    
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(section.title, sectionX + 10, sectionY + 25);
    
    let itemY = sectionY + 50;
    for (const item of section.items) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(item.label, sectionX + 15, itemY);
      
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(item.value, sectionX + 120, itemY);
      
      itemY += 28;
    }
    
    sectionX += sectionWidth + 20;
  }
  
  if (profile.nationality) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(40, 340, 720, 50);
    
    ctx.fillStyle = colors.border;
    ctx.fillRect(40, 340, 720, 3);
    ctx.fillRect(40, 387, 720, 3);
    
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('🌎 NACIONALIDAD', 55, 372);
    
    ctx.fillStyle = colors.text;
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`País: ${profile.nationality.country || 'N/A'} • Actual: ${profile.nationality.currentCountry || 'N/A'}`, 200, 372);
  }
  
  if (profile.items && profile.items.length > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(40, 400, 720, 50);
    
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`🎒 ITEMS (${profile.items.length})`, 55, 432);
  }
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Perfil generado • ${new Date().toLocaleDateString('es-ES')}`, width / 2, height - 15);
  
  return canvas.toBuffer('image/png');
}
