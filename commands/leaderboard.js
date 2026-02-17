import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';
import { generateLeaderboardImage } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const allUsers = db.getAllUsers(interaction.guild.id);
      
      const sortedUsers = allUsers
        .filter(u => {
          const totalXp = Number(u.totalXp) || 0;
          const level = Number(u.level) || 0;
          return totalXp > 0 && level >= 0 && !isNaN(totalXp) && !isNaN(level);
        })
        .sort((a, b) => {
          const xpA = Number(a.totalXp) || 0;
          const xpB = Number(b.totalXp) || 0;
          return xpB - xpA;
        })
        .slice(0, 10);
      
      if (sortedUsers.length === 0) {
        return interaction.editReply('📊 No hay usuarios en la tabla de clasificación todavía.');
      }
      
      const imageBuffer = await generateLeaderboardImage(sortedUsers, interaction.guild, 'pixel');
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveleserdl.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      await interaction.editReply({
        embeds: [{
          color: 0xFFD700,
          title: '🏆 Tabla de Clasificación',
          image: { url: 'attachment://leaderboard.png' },
          footer: { text: `¡Chatea en el servidor para subir de nivel! ⚡` }
        }],
        files: [attachment],
        components: [row]
      });
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      await interaction.editReply('❌ Error al generar la tabla de clasificación.');
    }
  }
};
