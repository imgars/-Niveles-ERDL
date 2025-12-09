import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

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

export default {
  data: new SlashCommandBuilder()
    .setName('gamecard')
    .setDescription('Genera tarjeta de perfil de Minecraft')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Nombre de usuario de Minecraft (Java)')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
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
    } catch (error) {
      console.error('Error en gamecard:', error);
      return interaction.editReply('❌ Error al generar la tarjeta de perfil.');
    }
  }
};
