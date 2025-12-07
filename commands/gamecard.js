import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function fetchRobloxProfile(username) {
  try {
    const userResponse = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`);
    const userData = await userResponse.json();
    
    if (!userData.data || userData.data.length === 0) {
      return null;
    }
    
    const userId = userData.data[0].id;
    const displayName = userData.data[0].displayName;
    const name = userData.data[0].name;
    
    const detailResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const detailData = await detailResponse.json();
    
    const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
    
    return {
      id: userId,
      username: name,
      displayName: displayName,
      description: detailData.description || 'Sin descripción',
      created: detailData.created,
      isBanned: detailData.isBanned || false,
      avatarUrl
    };
  } catch (error) {
    console.error('Error fetching Roblox profile:', error);
    return null;
  }
}

async function fetchMinecraftProfile(username) {
  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      uuid: data.id,
      username: data.name,
      avatarUrl: `https://mc-heads.net/avatar/${data.id}/150`,
      bodyUrl: `https://mc-heads.net/body/${data.id}/150`,
      skinUrl: `https://mc-heads.net/skin/${data.id}`
    };
  } catch (error) {
    console.error('Error fetching Minecraft profile:', error);
    return null;
  }
}

async function generateRobloxCard(profile) {
  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#E3242B');
  gradient.addColorStop(1, '#8B0000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < height; i += 4) {
    if (i % 8 === 0) {
      ctx.fillRect(0, i, width, 2);
    }
  }
  
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, width, 4);
  ctx.fillRect(0, height - 4, width, 4);
  ctx.fillRect(0, 0, 4, height);
  ctx.fillRect(width - 4, 0, 4, height);
  
  if (profile.avatarUrl) {
    try {
      const avatar = await loadImage(profile.avatarUrl);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(25, 50, 130, 130);
      ctx.fillStyle = '#000000';
      ctx.fillRect(30, 55, 120, 120);
      ctx.drawImage(avatar, 35, 60, 110, 110);
    } catch (e) {
      console.error('Error loading Roblox avatar:', e);
    }
  }
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('ROBLOX', 180, 50);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(profile.displayName, 180, 90);
  
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(`@${profile.username}`, 180, 115);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`ID: ${profile.id}`, 180, 145);
  
  const createdDate = new Date(profile.created).toLocaleDateString('es-ES');
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(`Cuenta creada: ${createdDate}`, 180, 170);
  
  if (profile.description && profile.description.length > 0) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial, sans-serif';
    const desc = profile.description.substring(0, 80) + (profile.description.length > 80 ? '...' : '');
    ctx.fillText(desc, 30, 210);
  }
  
  ctx.fillStyle = profile.isBanned ? '#FF0000' : '#00FF00';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(profile.isBanned ? '🔴 BANEADO' : '🟢 ACTIVO', 30, 250);
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText('Generado por - Niveles Bot', width - 160, height - 15);
  
  return canvas.toBuffer('image/png');
}

async function generateMinecraftCard(profile) {
  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const dirtColors = ['#8B5A2B', '#6B4226', '#5D3A1A', '#7A4A23'];
  const pixelSize = 12;
  
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(20, 20, width - 40, height - 40);
  
  ctx.fillStyle = '#555555';
  ctx.fillRect(18, 18, width - 36, 4);
  ctx.fillRect(18, height - 22, width - 36, 4);
  ctx.fillRect(18, 18, 4, height - 36);
  ctx.fillRect(width - 22, 18, 4, height - 36);
  
  if (profile.avatarUrl) {
    try {
      const avatar = await loadImage(profile.avatarUrl);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(35, 50, 130, 130);
      ctx.drawImage(avatar, 40, 55, 120, 120);
    } catch (e) {
      console.error('Error loading Minecraft avatar:', e);
    }
  }
  
  ctx.fillStyle = '#55FF55';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('MINECRAFT', 185, 70);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(profile.username, 185, 110);
  
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(`UUID: ${profile.uuid.substring(0, 8)}...`, 185, 140);
  
  ctx.fillStyle = '#55FF55';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('✓ Cuenta Premium', 185, 170);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('⛏️ Jugador de Java Edition', 185, 200);
  
  ctx.fillStyle = '#888888';
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText('Generado por - Niveles Bot', width - 180, height - 35);
  
  return canvas.toBuffer('image/png');
}

async function generateBrawlStarsCard(tag) {
  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = 'rgba(255, 204, 0, 0.1)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 20 + 5;
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;
    for (let j = 0; j < spikes * 2; j++) {
      const radius = j % 2 === 0 ? outerRadius : innerRadius;
      const angle = (j * Math.PI) / spikes - Math.PI / 2;
      if (j === 0) {
        ctx.moveTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      } else {
        ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      }
    }
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.strokeStyle = '#FFCC00';
  ctx.lineWidth = 4;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  
  ctx.strokeStyle = '#FF6600';
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, width - 50, height - 50);
  
  ctx.fillStyle = '#FFCC00';
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BRAWL STARS', width / 2, 80);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText(`#${tag}`, width / 2, 130);
  
  ctx.fillStyle = '#FF6600';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('⭐ Player Tag ⭐', width / 2, 170);
  
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('Consulta estadísticas en:', width / 2, 210);
  
  ctx.fillStyle = '#00BFFF';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`brawlify.com/stats/profile/${tag}`, width / 2, 235);
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Generado por - Niveles Bot', width - 30, height - 20);
  
  return canvas.toBuffer('image/png');
}

export default {
  data: new SlashCommandBuilder()
    .setName('gamecard')
    .setDescription('Genera tarjetas de perfil de juegos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('roblox')
        .setDescription('Generar tarjeta de perfil de Roblox')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Nombre de usuario de Roblox')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('minecraft')
        .setDescription('Generar tarjeta de perfil de Minecraft')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Nombre de usuario de Minecraft (Java)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('brawlstars')
        .setDescription('Generar tarjeta de perfil de Brawl Stars')
        .addStringOption(option =>
          option.setName('tag')
            .setDescription('Tag de Brawl Stars (sin #)')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const subcommand = interaction.options.getSubcommand();
    
    try {
      if (subcommand === 'roblox') {
        const username = interaction.options.getString('username');
        const profile = await fetchRobloxProfile(username);
        
        if (!profile) {
          return interaction.editReply('❌ No se encontró el perfil de Roblox. Verifica el nombre de usuario.');
        }
        
        const imageBuffer = await generateRobloxCard(profile);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'roblox_profile.png' });
        
        return interaction.editReply({
          embeds: [{
            color: 0xE3242B,
            title: `🎮 Perfil de Roblox: ${profile.displayName}`,
            image: { url: 'attachment://roblox_profile.png' }
          }],
          files: [attachment]
        });
      }
      
      if (subcommand === 'minecraft') {
        const username = interaction.options.getString('username');
        const profile = await fetchMinecraftProfile(username);
        
        if (!profile) {
          return interaction.editReply('❌ No se encontró el perfil de Minecraft. Verifica el nombre de usuario (solo Java Edition).');
        }
        
        const imageBuffer = await generateMinecraftCard(profile);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'minecraft_profile.png' });
        
        return interaction.editReply({
          embeds: [{
            color: 0x55FF55,
            title: `⛏️ Perfil de Minecraft: ${profile.username}`,
            image: { url: 'attachment://minecraft_profile.png' }
          }],
          files: [attachment]
        });
      }
      
      if (subcommand === 'brawlstars') {
        const tag = interaction.options.getString('tag').toUpperCase().replace('#', '');
        
        const imageBuffer = await generateBrawlStarsCard(tag);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'brawlstars_profile.png' });
        
        return interaction.editReply({
          embeds: [{
            color: 0xFFCC00,
            title: `🌟 Brawl Stars: #${tag}`,
            description: `Consulta estadísticas completas en:\n**https://brawlify.com/stats/profile/${tag}**`,
            image: { url: 'attachment://brawlstars_profile.png' }
          }],
          files: [attachment]
        });
      }
      
    } catch (error) {
      console.error('Error en gamecard:', error);
      return interaction.editReply('❌ Error al generar la tarjeta de perfil.');
    }
  }
};
