import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lb')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allUsers = db.getAllUsers(interaction.guild.id);
      let title = '🏆 Tabla de Clasificación';
      let description = 'Top usuarios del servidor';
      
      // Detectar rol especial
      let userRoleFilter = null;
      
      if (member.roles.cache.has(CONFIG.LEVEL_ROLES[100])) {
        title = '🏆 Tabla de Clasificación - Leyenda';
        description = 'Top Leyendas (Nivel 100+)';
        userRoleFilter = u => u.level >= 100;
      } else if (member.roles.cache.has(CONFIG.LEVEL_ROLES[35])) {
        title = '🏆 Tabla de Clasificación - Miembro Super Activo';
        description = 'Top Miembros Super Activos (Nivel 35+)';
        userRoleFilter = u => u.level >= 35;
      } else if (member.roles.cache.has(CONFIG.LEVEL_ROLES[25])) {
        title = '🏆 Tabla de Clasificación - Miembro Activo';
        description = 'Top Miembros Activos (Nivel 25+)';
        userRoleFilter = u => u.level >= 25;
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
      
      const fields = [];
      
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        let rankEmoji = '';
        
        if (i === 0) rankEmoji = '🥇';
        else if (i === 1) rankEmoji = '🥈';
        else if (i === 2) rankEmoji = '🥉';
        
        try {
          const targetMember = await interaction.guild.members.fetch(user.userId);
          const username = targetMember.user.username;
          
          fields.push({
            name: `${rankEmoji} #${i + 1} - ${username}`,
            value: `**Nivel:** ${user.level} | **XP Total:** ${Math.floor(user.totalXp)}`,
            inline: false
          });
        } catch (error) {
          fields.push({
            name: `${rankEmoji} #${i + 1} - Usuario Desconocido`,
            value: `**Nivel:** ${user.level} | **XP Total:** ${Math.floor(user.totalXp)}`,
            inline: false
          });
        }
      }
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveles-bbe6.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      await interaction.editReply({
        embeds: [{
          color: 0x00BFFF,
          title: title,
          description: description,
          fields: fields,
          footer: { text: `Total de usuarios: ${allUsers.length}` },
          timestamp: new Date()
        }],
        components: [row]
      });
    } catch (error) {
      console.error('Error in lb command:', error);
      await interaction.editReply('❌ Error al generar la tabla de clasificación.');
    }
  }
};
