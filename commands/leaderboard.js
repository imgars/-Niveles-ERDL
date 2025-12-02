import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';
import { generateLeaderboardImage } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allUsers = db.getAllUsers(interaction.guild.id);
      let title = '🏆 Tabla de Clasificación';
      let description = 'Top usuarios por experiencia';
      
      // Detectar rol especial
      let userRoleFilter = null;
      let roleSpecial = null;
      
      if (member.roles.cache.has(CONFIG.LEVEL_ROLES[100])) {
        title = '🏆 Tabla de Clasificación - Leyenda';
        description = 'Top Leyendas (Nivel 100+)';
        userRoleFilter = u => u.level >= 100;
        roleSpecial = '100';
      } else if (member.roles.cache.has(CONFIG.LEVEL_ROLES[35])) {
        title = '🏆 Tabla de Clasificación - Miembro Super Activo';
        description = 'Top Miembros Super Activos (Nivel 35+)';
        userRoleFilter = u => u.level >= 35;
        roleSpecial = '35';
      } else if (member.roles.cache.has(CONFIG.LEVEL_ROLES[25])) {
        title = '🏆 Tabla de Clasificación - Miembro Activo';
        description = 'Top Miembros Activos (Nivel 25+)';
        userRoleFilter = u => u.level >= 25;
        roleSpecial = '25';
      }
      
      let sortedUsers = allUsers
        .filter(u => u.level > 0 || u.totalXp > 0);
      
      if (userRoleFilter) {
        sortedUsers = sortedUsers.filter(userRoleFilter);
      }
      
      sortedUsers = sortedUsers
        .sort((a, b) => b.totalXp - a.totalXp)
        .slice(0, 10);
      
      if (sortedUsers.length === 0) {
        return interaction.editReply('📊 No hay usuarios en la tabla de clasificación todavía.');
      }
      
      const imageBuffer = await generateLeaderboardImage(sortedUsers, interaction.guild);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveles-bbe6.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      await interaction.editReply({
        embeds: [{
          color: 0xFFD700,
          title: title,
          description: `${description} - Top ${sortedUsers.length} usuarios`,
          image: { url: 'attachment://leaderboard.png' },
          footer: { text: '⭐ ¡Sigue chateando para subir en el ranking!' }
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
