import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lb')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const allUsers = db.getAllUsers(interaction.guild.id);
    const sortedUsers = allUsers
      .filter(u => u.level > 0 || u.totalXp > 0)
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
        const member = await interaction.guild.members.fetch(user.userId);
        const username = member.user.username;
        
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
        title: '🏆 Tabla de Clasificación',
        description: `Top ${sortedUsers.length} usuarios del servidor`,
        fields: fields,
        footer: { text: `Total de usuarios activos: ${allUsers.length}` },
        timestamp: new Date()
      }],
      components: [row]
    });
  }
};
