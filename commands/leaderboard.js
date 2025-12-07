import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';
import { generateLeaderboardImage, generateMinecraftLeaderboard, generatePokemonLeaderboard, generateZeldaLeaderboard } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Muestra la tabla de clasificación del servidor')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de leaderboard')
        .addChoices(
          { name: '🏆 General', value: 'general' },
          { name: '⚔️ Top 100+ (Elite)', value: 'elite' },
          { name: '⚔️ Zelda (Super Activos)', value: 'zelda' }
        )
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const tipo = interaction.options.getString('tipo') || 'general';
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allUsers = db.getAllUsers(interaction.guild.id);
      const userData = db.getUser(interaction.guild.id, interaction.user.id);
      
      let sortedUsers;
      let imageBuffer;
      let title;
      
      if (tipo === 'elite') {
        sortedUsers = allUsers
          .filter(u => u.totalXp && u.totalXp > 0 && u.level && u.level >= 100)
          .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))
          .slice(0, 10);
        
        if (sortedUsers.length === 0) {
          return interaction.editReply('⚔️ No hay usuarios nivel 100+ todavía. ¡Sé el primero en llegar!');
        }
        
        const userLevel = userData.level || 0;
        const selectedTheme = userData.selectedLeaderboardTheme || 'minecraft';
        
        if (userLevel >= 100 && selectedTheme === 'pokemon') {
          imageBuffer = await generatePokemonLeaderboard(sortedUsers, interaction.guild);
          title = '🔥 Pokemon Masters (100+)';
        } else {
          imageBuffer = await generateMinecraftLeaderboard(sortedUsers, interaction.guild);
          title = '⚔️ Top Leyendas (100+)';
        }
      } else if (tipo === 'zelda') {
        const isSuperActive = member.roles.cache.has(CONFIG.LEVEL_ROLES[35]);
        if (!isSuperActive) {
          return interaction.editReply('❌ Necesitas el rol Super Activo (nivel 35+) para ver este leaderboard.');
        }
        
        sortedUsers = allUsers
          .filter(u => u.totalXp && u.totalXp > 0 && u.level && u.level > 0)
          .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))
          .slice(0, 10);
        
        if (sortedUsers.length === 0) {
          return interaction.editReply('📊 No hay usuarios en la tabla de clasificación todavía.');
        }
        
        imageBuffer = await generateZeldaLeaderboard(sortedUsers, interaction.guild);
        title = '⚔️ Heroes of Hyrule';
      } else {
        sortedUsers = allUsers
          .filter(u => u.totalXp && u.totalXp > 0 && u.level && u.level > 0)
          .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))
          .slice(0, 10);
        
        if (sortedUsers.length === 0) {
          return interaction.editReply('📊 No hay usuarios en la tabla de clasificación todavía.');
        }
        
        const isSuperActive = member.roles.cache.has(CONFIG.LEVEL_ROLES[35]);
        const theme = isSuperActive ? 'zelda' : 'pixel';
        
        imageBuffer = await generateLeaderboardImage(sortedUsers, interaction.guild, theme);
        title = '🏆 Tabla de Clasificación';
      }
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveles-wul5.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      await interaction.editReply({
        embeds: [{
          color: tipo === 'elite' ? 0xFF4500 : (tipo === 'zelda' ? 0x90EE90 : 0xFFD700),
          title: title,
          image: { url: 'attachment://leaderboard.png' },
          footer: { text: `Total de usuarios activos: ${allUsers.length}` }
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
