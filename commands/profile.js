import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserProfile, ITEMS, COUNTRIES, getUserActivePowerups, getUserInsurance } from '../utils/economyDB.js';
import db from '../utils/database.js';
import { getXPProgress, calculateLevel } from '../utils/xpSystem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Ver tu perfil o el de otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver perfil')
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    
    try {
      const profile = await getUserProfile(interaction.guildId, targetUser.id);
      const userData = db.getUser(interaction.guildId, targetUser.id);
      
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!member) {
        return interaction.editReply('❌ No se pudo encontrar al usuario.');
      }
      
      const level = userData.level || 0;
      const totalXp = userData.totalXp || 0;
      const xpProgress = getXPProgress(totalXp, level);
      
      const progressBar = createProgressBar(xpProgress.percentage);
      
      const nationalityInfo = profile.nationality ? 
        `${COUNTRIES[profile.nationality.currentCountry]?.emoji || '🌍'} ${COUNTRIES[profile.nationality.currentCountry]?.name || 'Desconocido'}` : 
        '🌍 Sin nacionalidad';
      
      const casinoWinRate = profile.casinoStats.plays > 0 ? 
        ((profile.casinoStats.wins / profile.casinoStats.plays) * 100).toFixed(1) : 0;
      
      const netCasino = (profile.casinoStats.totalWon || 0) - (profile.casinoStats.totalLost || 0);
      const netCasinoText = netCasino >= 0 ? `+${netCasino.toLocaleString()}` : netCasino.toLocaleString();
      
      const activePowerups = profile.activePowerups || [];
      const powerupsText = activePowerups.length > 0 ? 
        activePowerups.map(p => `• ${p.type}`).join('\n') : 
        'Ninguno activo';
      
      const insuranceText = profile.insurance?.active ? 
        `✅ Activo (${Math.round((profile.insurance.expiresAt - Date.now()) / 60000)}min)` : 
        '❌ Sin seguro';
      
      const boosts = db.getActiveBoosts(targetUser.id, null);
      let boostText = 'Ninguno activo';
      if (boosts.length > 0) {
        let totalBoostPercent = 0;
        for (const boost of boosts) {
          if (boost.multiplier >= 1) {
            totalBoostPercent += (boost.multiplier - 100);
          } else {
            totalBoostPercent += (boost.multiplier * 100);
          }
        }
        boostText = `🚀 +${Math.round(totalBoostPercent)}% XP`;
      }
      
      const cardTheme = userData.selectedCardTheme ? 
        `🎴 ${userData.selectedCardTheme.charAt(0).toUpperCase() + userData.selectedCardTheme.slice(1)}` : 
        '🎴 Default';
      
      const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setAuthor({ 
          name: member.displayName, 
          iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTitle(`📊 Perfil de ${targetUser.username}`)
        .addFields(
          { 
            name: '📈 Nivel y XP', 
            value: `**Nivel:** ${level}\n**XP Total:** ${totalXp.toLocaleString()}\n${progressBar} ${xpProgress.percentage.toFixed(1)}%\n**Siguiente nivel:** ${xpProgress.current.toLocaleString()}/${xpProgress.needed.toLocaleString()} XP`, 
            inline: false 
          },
          { 
            name: '💰 Economía', 
            value: `**Lagcoins:** ${profile.lagcoins.toLocaleString()}\n**Banco:** ${profile.bankBalance.toLocaleString()}\n**Total ganado:** ${profile.totalEarned.toLocaleString()}\n**Total gastado:** ${profile.totalSpent.toLocaleString()}`, 
            inline: true 
          },
          { 
            name: '🎰 Casino', 
            value: `**Partidas:** ${profile.casinoStats.plays}\n**Victorias:** ${profile.casinoStats.wins}\n**Ratio:** ${casinoWinRate}%\n**Balance:** ${netCasinoText}`, 
            inline: true 
          },
          { 
            name: '📍 Nacionalidad', 
            value: nationalityInfo, 
            inline: true 
          },
          { 
            name: '💼 Trabajos', 
            value: `**Completados:** ${profile.jobStats.totalJobs}\n**Favorito:** ${profile.jobStats.favoriteJob || 'N/A'}`, 
            inline: true 
          },
          { 
            name: '🎮 Actividad', 
            value: `**Minijuegos ganados:** ${profile.minigamesWon}\n**Intercambios:** ${profile.tradesCompleted}\n**Subastas ganadas:** ${profile.auctionsWon}`, 
            inline: true 
          },
          { 
            name: '🚀 Boosts Activos', 
            value: boostText, 
            inline: true 
          },
          { 
            name: '🛡️ Seguro', 
            value: insuranceText, 
            inline: true 
          },
          { 
            name: '🎴 Tarjeta', 
            value: cardTheme, 
            inline: true 
          }
        )
        .setFooter({ text: `ID: ${targetUser.id}` })
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en perfil:', error);
      return interaction.editReply({ content: '❌ Error al cargar el perfil' });
    }
  }
};

function createProgressBar(percentage) {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}
