import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getLeaderboard } from '../utils/economyDB.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function generateLeaderboardImage(leaderboard, client, type, guildName) {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fondo degradado
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Borde decorativo
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  
  // Títulos según tipo
  const titles = {
    'lagcoins': { title: '💰 Leaderboard de Lagcoins', subtitle: 'Los más ricos del servidor', color: '#FFD700' },
    'casino': { title: '🎰 Mejores del Casino', subtitle: 'Los que más han ganado', color: '#FF6B6B' },
    'minigames': { title: '🎮 Campeones de Minijuegos', subtitle: 'Los que más han ganado minijuegos', color: '#4ECDC4' },
    'trades': { title: '🤝 Mejores Negociantes', subtitle: 'Los que más trades y subastas han hecho', color: '#45B7D1' }
  };
  
  const config = titles[type] || titles['lagcoins'];
  
  // Título principal
  ctx.fillStyle = config.color;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(config.title, width / 2, 50);
  
  // Subtítulo
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '18px Arial';
  ctx.fillText(config.subtitle, width / 2, 80);
  
  // Nombre del servidor
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.fillText(guildName, width / 2, 105);
  
  // Línea separadora
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 120);
  ctx.lineTo(width - 50, 120);
  ctx.stroke();
  
  // Dibujar usuarios
  const startY = 150;
  const rowHeight = 45;
  
  for (let i = 0; i < Math.min(leaderboard.length, 10); i++) {
    const user = leaderboard[i];
    const y = startY + (i * rowHeight);
    
    // Fondo de fila alternado
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(30, y - 25, width - 60, 40);
    }
    
    // Posición
    const medals = ['🥇', '🥈', '🥉'];
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    if (i < 3) {
      ctx.fillStyle = config.color;
      ctx.fillText(medals[i], 50, y + 5);
    } else {
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText(`#${i + 1}`, 50, y + 5);
    }
    
    // Nombre de usuario
    try {
      const discordUser = await client.users.fetch(user.userId);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(discordUser.username.substring(0, 20), 110, y + 5);
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(`Usuario ${user.userId.substring(0, 8)}...`, 110, y + 5);
    }
    
    // Valor según tipo
    ctx.textAlign = 'right';
    ctx.fillStyle = config.color;
    ctx.font = 'bold 18px Arial';
    
    let valueText = '';
    switch (type) {
      case 'lagcoins':
        valueText = `${user.totalWealth.toLocaleString()} 💰`;
        break;
      case 'casino':
        const sign = user.casinoProfit >= 0 ? '+' : '';
        valueText = `${sign}${user.casinoProfit.toLocaleString()} 🎰`;
        break;
      case 'minigames':
        valueText = `${user.minigamesWon} victorias 🏆`;
        break;
      case 'trades':
        valueText = `${user.tradesCompleted + user.auctionsWon} trades 🤝`;
        break;
    }
    
    ctx.fillText(valueText, width - 50, y + 5);
  }
  
  // Footer
  ctx.fillStyle = '#666666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, width / 2, height - 25);
  
  return canvas.toBuffer('image/png');
}

export default {
  data: new SlashCommandBuilder()
    .setName('lbeconomia')
    .setDescription('Ver leaderboards de economía en imagen')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de leaderboard')
        .setRequired(true)
        .addChoices(
          { name: '💰 Más Ricos (Lagcoins)', value: 'lagcoins' },
          { name: '🎰 Mejores del Casino', value: 'casino' },
          { name: '🎮 Campeones de Minijuegos', value: 'minigames' },
          { name: '🤝 Mejores Negociantes', value: 'trades' }
        )
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const type = interaction.options.getString('tipo');
    
    try {
      const leaderboard = await getLeaderboard(interaction.guildId, type, 10);
      
      if (leaderboard.length === 0) {
        return interaction.editReply('❌ No hay datos suficientes para generar el leaderboard.');
      }
      
      const imageBuffer = await generateLeaderboardImage(
        leaderboard, 
        interaction.client, 
        type, 
        interaction.guild.name
      );
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: `leaderboard_${type}.png` });
      
      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error generando leaderboard:', error);
      return interaction.editReply('❌ Error al generar el leaderboard.');
    }
  }
};
