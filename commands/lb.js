import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';
import { generateLeaderboardImage } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lb')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allUsers = db.getAllUsers(interaction.guild.id);
      const sortedUsers = allUsers
        .filter(u => u.level > 0 || u.totalXp > 0)
        .sort((a, b) => b.totalXp - a.totalXp)
        .slice(0, 10);
      
      if (sortedUsers.length === 0) {
        return interaction.editReply('📊 No hay usuarios en la tabla de clasificación todavía.');
      }
      
      // Detectar si es Miembro Super Activo (Nivel 35+)
      const isSuperActive = member.roles.cache.has(CONFIG.LEVEL_ROLES[35]);
      const theme = isSuperActive ? 'zelda' : 'pixel';
      
      const imageBuffer = await generateLeaderboardImage(sortedUsers, interaction.guild, theme);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveles-bbe6.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      // Solo imagen para todos
      await interaction.editReply({
        embeds: [{
          color: 0xFFD700,
          title: '🏆 Tabla de Clasificación',
          image: { url: 'attachment://leaderboard.png' },
          footer: { text: `Total de usuarios activos: ${allUsers.length}` },
          timestamp: new Date()
        }],
        files: [attachment],
        components: [row]
      });
    } catch (error) {
      console.error('Error in lb command:', error);
      await interaction.editReply('❌ Error al generar la tabla de clasificación.');
    }
  }
};
