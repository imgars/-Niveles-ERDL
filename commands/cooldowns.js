import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, getUserActivePowerups, JOBS } from '../utils/economyDB.js';
import { getCasinoCooldown } from '../utils/casinoCooldowns.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cooldowns')
    .setDescription('Ver todos tus cooldowns activos'),
  
  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    
    try {
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      const now = Date.now();
      
      const cooldowns = [];
      
      if (economy.lastWorkTime) {
        // Encontrar el cooldown del último trabajo realizado
        let workCooldown = 60000;
        if (economy.jobStats && economy.jobStats.favoriteJob && JOBS[economy.jobStats.favoriteJob]) {
          workCooldown = JOBS[economy.jobStats.favoriteJob].cooldown || 60000;
        }

        // Aplicar reducciones de cooldown si existen powerups
        const powerups = await getUserActivePowerups(interaction.guildId, interaction.user.id);
        if (powerups) {
          const reduction = powerups.find(p => p.type === 'cooldown_reduction');
          if (reduction) {
            workCooldown = workCooldown * (1 - reduction.value);
          }
        }

        const remaining = (new Date(economy.lastWorkTime).getTime() + workCooldown) - now;
        if (remaining > 0) {
          cooldowns.push({
            name: '💼 Trabajo',
            remaining: Math.ceil(remaining / 1000),
            ready: false
          });
        } else {
          cooldowns.push({ name: '💼 Trabajo', remaining: 0, ready: true });
        }
      } else {
        cooldowns.push({ name: '💼 Trabajo', remaining: 0, ready: true });
      }
      
      if (economy.lastRobTime) {
        const robCooldown = 300000;
        const remaining = (economy.lastRobTime + robCooldown) - now;
        if (remaining > 0) {
          cooldowns.push({
            name: '🥷 Robo',
            remaining: Math.ceil(remaining / 1000),
            ready: false
          });
        } else {
          cooldowns.push({ name: '🥷 Robo', remaining: 0, ready: true });
        }
      } else {
        cooldowns.push({ name: '🥷 Robo', remaining: 0, ready: true });
      }
      
      if (economy.lastDailyReward) {
        const dailyCooldown = 86400000;
        const remaining = (economy.lastDailyReward + dailyCooldown) - now;
        if (remaining > 0) {
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          cooldowns.push({
            name: '🎁 Daily',
            remaining: `${hours}h ${minutes}m`,
            ready: false
          });
        } else {
          cooldowns.push({ name: '🎁 Daily', remaining: 0, ready: true });
        }
      } else {
        cooldowns.push({ name: '🎁 Daily', remaining: 0, ready: true });
      }
      
      const casinoCooldowns = ['casino', 'slots', 'blackjack', 'coinflip', 'dice'];
      for (const game of casinoCooldowns) {
        const cd = getCasinoCooldown(interaction.user.id, game);
        if (cd > 0) {
          cooldowns.push({
            name: `🎰 ${game.charAt(0).toUpperCase() + game.slice(1)}`,
            remaining: Math.ceil(cd / 1000),
            ready: false
          });
        } else {
          cooldowns.push({
            name: `🎰 ${game.charAt(0).toUpperCase() + game.slice(1)}`,
            remaining: 0,
            ready: true
          });
        }
      }
      
      const readyList = cooldowns
        .filter(c => c.ready)
        .map(c => `${c.name}: ✅ Listo`)
        .join('\n');
      
      const waitingList = cooldowns
        .filter(c => !c.ready)
        .map(c => {
          const time = typeof c.remaining === 'string' ? c.remaining : `${c.remaining}s`;
          return `${c.name}: ⏳ ${time}`;
        })
        .join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#00CED1')
        .setTitle('⏰ Tus Cooldowns')
        .setDescription('Estado de todos los sistemas con cooldown');
      
      if (readyList) {
        embed.addFields({ name: '✅ Listos para usar', value: readyList, inline: false });
      }
      
      if (waitingList) {
        embed.addFields({ name: '⏳ En espera', value: waitingList, inline: false });
      }
      
      const powerups = await getUserActivePowerups(interaction.guildId, interaction.user.id);
      if (powerups && powerups.length > 0) {
        const cooldownReduction = powerups.find(p => p.type === 'cooldown_reduction');
        if (cooldownReduction) {
          embed.addFields({
            name: '⚡ Reducción de Cooldown Activa',
            value: `${Math.round(cooldownReduction.value * 100)}% menos tiempo de espera`,
            inline: false
          });
        }
      }
      
      embed.setFooter({ text: 'Los cooldowns te protegen del spam' });
      embed.setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en cooldowns:', error);
      return interaction.editReply('❌ Error al cargar los cooldowns');
    }
  }
};
