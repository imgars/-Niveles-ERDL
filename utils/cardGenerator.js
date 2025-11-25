import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';

const CARD_WIDTH = 800;
const CARD_HEIGHT = 250;

async function getCardTheme(member, level) {
  const userId = member.user.id;
  let roles;
  
  try {
    const freshMember = await member.guild.members.fetch(userId);
    roles = freshMember.roles.cache;
  } catch (error) {
    console.error('Error fetching fresh member for card theme:', error);
    roles = member.roles.cache;
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
  
  return 'pixel';
}

function getThemeColors(theme) {
  const themes = {
    pixel: {
      bg: ['#2C2F33', '#23272A'],
      accent: '#7289DA',
      bar: '#43B581',
      text: '#FFFFFF'
    },
    ocean: {
      bg: ['#006994', '#003D5C'],
      accent: '#00A8E8',
      bar: '#00D9FF',
      text: '#FFFFFF'
    },
    zelda: {
      bg: ['#8B7D3A', '#5C5220'],
      accent: '#FFD700',
      bar: '#90EE90',
      text: '#FFFFFF'
    },
    pokemon: {
      bg: ['#EE1515', '#CC0000'],
      accent: '#FFCB05',
      bar: '#3B4CCA',
      text: '#FFFFFF'
    },
    geometrydash: {
      bg: ['#00E5FF', '#FF00E5'],
      accent: '#FFFF00',
      bar: '#00FF00',
      text: '#FFFFFF'
    },
    night: {
      bg: ['#0F0F23', '#1A1A2E'],
      accent: '#FFD700',
      bar: '#9D50BB',
      text: '#E0E0E0'
    },
    roblox: {
      bg: ['#E3242B', '#A91E24'],
      accent: '#00A2FF',
      bar: '#00FF00',
      text: '#FFFFFF'
    },
    minecraft: {
      bg: ['#3C3C3C', '#1C1C1C'],
      accent: '#8B5A3C',
      bar: '#55FF55',
      text: '#FFFFFF'
    },
    fnaf: {
      bg: ['#1C0A00', '#000000'],
      accent: '#8B0000',
      bar: '#FFD700',
      text: '#FFFFFF'
    }
  };
  
  return themes[theme] || themes.pixel;
}

export async function generateRankCard(member, userData, progress) {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  const theme = await getCardTheme(member, userData.level);
  const colors = getThemeColors(theme);
  
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, colors.bg[0]);
  gradient.addColorStop(1, colors.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    
    const avatarSize = 150;
    const avatarX = 30;
    const avatarY = (CARD_HEIGHT - avatarSize) / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  } catch (error) {
    console.error('Error loading avatar:', error);
  }
  
  const textX = 220;
  
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 32px Arial';
  ctx.fillText(member.user.username, textX, 60);
  
  ctx.font = '24px Arial';
  ctx.fillStyle = colors.accent;
  ctx.fillText(`Level: ${userData.level}`, textX, 100);
  
  const xpText = `XP: ${Math.floor(progress.current)} / ${Math.floor(progress.needed)}`;
  ctx.fillText(xpText, textX, 135);
  
  const barX = textX;
  const barY = 160;
  const barWidth = 500;
  const barHeight = 30;
  
  ctx.fillStyle = '#23272A';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  const progressWidth = (progress.percentage / 100) * barWidth;
  const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  barGradient.addColorStop(0, colors.bar);
  barGradient.addColorStop(1, colors.accent);
  ctx.fillStyle = barGradient;
  ctx.fillRect(barX, barY, progressWidth, barHeight);
  
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 16px Arial';
  const percentText = `${Math.floor(progress.percentage)}%`;
  ctx.fillText(percentText, barX + barWidth / 2 - 20, barY + 20);
  
  return canvas.toBuffer('image/png');
}

export async function generateLeaderboardImage(topUsers, guild) {
  const canvas = createCanvas(680, 740);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 740);
  gradient.addColorStop(0, '#2C2F33');
  gradient.addColorStop(1, '#23272A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 680, 740);
  
  for (let i = 0; i < Math.min(10, topUsers.length); i++) {
    const user = topUsers[i];
    const y = 10 + (i * 72);
    
    let rankColor;
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    else rankColor = '#FFFFFF';
    
    ctx.fillStyle = i < 3 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(10, y, 660, 68);
    
    ctx.strokeStyle = rankColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, y, 660, 68);
    
    try {
      const member = await guild.members.fetch(user.userId).catch(() => null);
      if (member) {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 64 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(50, y + 34, 28, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 22, y + 6, 56, 56);
        ctx.restore();
      }
    } catch (error) {
      console.error('Error loading avatar for leaderboard:', error);
    }
    
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`#${i + 1}`, 90, y + 38);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    let username = 'Usuario';
    try {
      const member = await guild.members.fetch(user.userId).catch(() => null);
      if (member) {
        username = member.user.username;
      }
    } catch (e) {
      console.error('Error fetching username:', e);
    }
    ctx.fillText(username, 150, y + 38);
    
    ctx.fillStyle = '#7289DA';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`LVL: ${user.level}`, 550, y + 38);
  }
  
  return canvas.toBuffer('image/png');
}
