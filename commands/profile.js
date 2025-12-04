import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserProfile, ITEMS, COUNTRIES, getUserActivePowerups, getUserInsurance } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Ver tu perfil o el de otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver perfil')
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    
    try {
      const profile = await getUserProfile(interaction.guildId, targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`📊 Perfil de ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL());
      
      // Información de economía
      embed.addFields(
        { name: '💵 Cartera', value: `${(profile.lagcoins || 0).toLocaleString()} Lagcoins`, inline: true },
        { name: '🏦 Banco', value: `${(profile.bankBalance || 0).toLocaleString()} Lagcoins`, inline: true },
        { name: '💎 Total', value: `${((profile.lagcoins || 0) + (profile.bankBalance || 0)).toLocaleString()} Lagcoins`, inline: true }
      );
      
      // Nacionalidad
      if (profile.nationality) {
        const originCountry = COUNTRIES[profile.nationality.country];
        const currentCountry = COUNTRIES[profile.nationality.currentCountry];
        if (originCountry && currentCountry) {
          embed.addFields({
            name: '🌎 Nacionalidad',
            value: `${originCountry.emoji} ${originCountry.name}${profile.nationality.currentCountry !== profile.nationality.country ? ` (En: ${currentCountry.emoji})` : ''}\n💼 Mult: x${currentCountry.jobMultiplier}`,
            inline: true
          });
        }
      }
      
      // Estadísticas
      embed.addFields(
        { name: '📈 Ganado', value: `${(profile.totalEarned || 0).toLocaleString()}`, inline: true },
        { name: '📉 Gastado', value: `${(profile.totalSpent || 0).toLocaleString()}`, inline: true }
      );
      
      // Casino stats
      const casinoStats = profile.casinoStats || { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
      const winRate = casinoStats.plays > 0 ? Math.round((casinoStats.wins / casinoStats.plays) * 100) : 0;
      const casinoProfit = (casinoStats.totalWon || 0) - (casinoStats.totalLost || 0);
      const profitSign = casinoProfit >= 0 ? '+' : '';
      
      embed.addFields({
        name: '🎰 Casino',
        value: `${casinoStats.plays} partidas | ${winRate}% victoria\n${profitSign}${casinoProfit.toLocaleString()} beneficio`,
        inline: true
      });
      
      // Trabajo stats
      const jobStats = profile.jobStats || { totalJobs: 0, favoriteJob: null };
      embed.addFields({
        name: '💼 Trabajo',
        value: `${jobStats.totalJobs} trabajos realizados${jobStats.favoriteJob ? `\nFavorito: ${jobStats.favoriteJob}` : ''}`,
        inline: true
      });
      
      // Other stats
      embed.addFields({
        name: '📊 Otras Estadísticas',
        value: `🎮 Minijuegos: ${profile.minigamesWon || 0}\n🤝 Trades: ${profile.tradesCompleted || 0}\n🔨 Subastas: ${profile.auctionsWon || 0}`,
        inline: true
      });
      
      // Power-ups activos
      if (profile.activePowerups && profile.activePowerups.length > 0) {
        const typeNames = {
          'work_boost': '💪 Trabajo',
          'casino_luck': '🎰 Casino',
          'luck_boost': '🍀 Suerte',
          'rob_success': '🥷 Robo',
          'xp_boost': '⭐ XP',
          'cooldown_reduction': '⚡ Cooldown'
        };
        
        const powerupList = profile.activePowerups.map(p => {
          const remaining = Math.ceil((p.expiresAt - Date.now()) / 60000);
          return `${typeNames[p.type] || p.type}: +${Math.round(p.value * 100)}% (${remaining}m)`;
        }).join('\n');
        
        embed.addFields({ name: '⚡ Power-Ups Activos', value: powerupList, inline: false });
      }
      
      // Seguro activo
      if (profile.insurance) {
        const remaining = Math.ceil((profile.insurance.expiresAt - Date.now()) / 60000);
        embed.addFields({
          name: '🛡️ Seguro Anti-Robo',
          value: `${Math.round(profile.insurance.protection * 100)}% protección (${remaining}m)`,
          inline: true
        });
      }
      
      // Items
      if (profile.items && profile.items.length > 0) {
        const itemsList = profile.items.slice(0, 10).map(i => {
          const item = ITEMS[i];
          return item ? item.emoji : '📦';
        }).join(' ');
        
        embed.addFields({
          name: `🎒 Items (${profile.items.length})`,
          value: itemsList + (profile.items.length > 10 ? ` +${profile.items.length - 10} más` : ''),
          inline: false
        });
      }
      
      embed.setFooter({ text: `Miembro desde: ${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-ES') : 'Desconocido'}` });
      embed.setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en perfil:', error);
      return interaction.reply({ content: '❌ Error al cargar el perfil', flags: 64 });
    }
  }
};
