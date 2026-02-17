import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserProfile, JOBS } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('estadisticas')
    .setDescription('Ver estadísticas de economía')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver estadísticas')
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    
    try {
      const profile = await getUserProfile(interaction.guildId, targetUser.id);

      const casinoWinRate = profile.casinoStats.plays > 0 
        ? ((profile.casinoStats.wins / profile.casinoStats.plays) * 100).toFixed(1)
        : 0;

      const casinoProfit = (profile.casinoStats.totalWon || 0) - (profile.casinoStats.totalLost || 0);

      const favoriteJob = profile.jobStats.favoriteJob 
        ? JOBS[profile.jobStats.favoriteJob]?.name || 'Desconocido'
        : 'Ninguno';

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`📊 Estadísticas de ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '💰 Economía General', value: '\u200B', inline: false },
          { name: '💵 Cartera', value: `${profile.lagcoins} Lagcoins`, inline: true },
          { name: '🏦 Banco', value: `${profile.bankBalance} Lagcoins`, inline: true },
          { name: '💎 Total', value: `${profile.lagcoins + profile.bankBalance} Lagcoins`, inline: true },
          { name: '📈 Total Ganado', value: `${profile.totalEarned} Lagcoins`, inline: true },
          { name: '📉 Total Gastado', value: `${profile.totalSpent} Lagcoins`, inline: true },
          { name: '🎒 Items', value: `${profile.items.length} items`, inline: true },
          
          { name: '\n🎰 Casino', value: '\u200B', inline: false },
          { name: '🎲 Partidas', value: `${profile.casinoStats.plays}`, inline: true },
          { name: '🏆 Victorias', value: `${profile.casinoStats.wins}`, inline: true },
          { name: '📊 Win Rate', value: `${casinoWinRate}%`, inline: true },
          { name: '💵 Ganado', value: `${profile.casinoStats.totalWon || 0} Lagcoins`, inline: true },
          { name: '💸 Perdido', value: `${profile.casinoStats.totalLost || 0} Lagcoins`, inline: true },
          { name: '📈 Balance', value: `${casinoProfit >= 0 ? '+' : ''}${casinoProfit} Lagcoins`, inline: true },
          
          { name: '\n💼 Trabajos', value: '\u200B', inline: false },
          { name: '📋 Total Trabajos', value: `${profile.jobStats.totalJobs}`, inline: true },
          { name: '⭐ Trabajo Favorito', value: favoriteJob, inline: true }
        )
        .setFooter({ text: `Miembro desde: ${new Date(profile.createdAt).toLocaleDateString('es-ES')}` });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en estadisticas:', error);
      return interaction.reply({ content: '❌ Error al obtener estadísticas', flags: 64 });
    }
  }
};
