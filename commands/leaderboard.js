import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';
import { generateLeaderboardImage, generateMinecraftLeaderboard, generatePokemonLeaderboard, generateZeldaLeaderboard } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Muestra la tabla de clasificación del servidor'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allUsers = db.getAllUsers(interaction.guild.id);
      
      let userData;
      try {
        userData = db.getUser(interaction.guild.id, interaction.user.id);
      } catch (e) {
        userData = null;
      }
      
      const userLevel = (userData && userData.level) ? userData.level : 0;
      const isSuperActive = member.roles.cache.has(CONFIG.LEVEL_ROLES[35]);
      const hasLevel100Role = CONFIG.LEVEL_100_ROLE_ID && member.roles.cache.has(CONFIG.LEVEL_100_ROLE_ID);
      const isLevel100 = userLevel >= 100 || hasLevel100Role;
      
      let tipo = 'pixel';
      if (isLevel100) {
        tipo = 'pokemon';
      } else if (isSuperActive) {
        tipo = 'zelda';
      }
      
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
      
      let imageBuffer;
      let title;
      
      if (tipo === 'pokemon') {
        imageBuffer = await generatePokemonLeaderboard(sortedUsers, interaction.guild);
        title = '🔥 Pokemon Masters';
      } else if (tipo === 'zelda') {
        imageBuffer = await generateZeldaLeaderboard(sortedUsers, interaction.guild);
        title = '⚔️ Heroes of Hyrule';
      } else {
        imageBuffer = await generateLeaderboardImage(sortedUsers, interaction.guild, 'pixel');
        title = '🏆 Tabla de Clasificación';
      }
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });
      
      const viewFullButton = new ButtonBuilder()
        .setLabel('Ver leaderboard completo')
        .setStyle(ButtonStyle.Link)
        .setURL('https://niveles-wul5.onrender.com/#leaderboard');
      
      const row = new ActionRowBuilder().addComponents(viewFullButton);
      
      const themeNames = {
        pixel: '🏆 General',
        minecraft: '⛏️ Minecraft',
        pokemon: '🔥 Pokemon',
        zelda: '⚔️ Zelda'
      };
      
      await interaction.editReply({
        embeds: [{
          color: tipo === 'pokemon' ? 0xFF4500 : (tipo === 'zelda' ? 0x90EE90 : 0xFFD700),
          title: title,
          image: { url: 'attachment://leaderboard.png' },
          footer: { text: `¡Chatea en el servidor para subir de nivel! 🏆` }
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
