import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserActivePowerups, ITEMS, buyItem, getUserEconomy } from '../utils/economyDB.js';
import { formatDuration } from '../utils/helpers.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('powerups')
    .setDescription('Ver y comprar power-ups')
    .addSubcommand(subcommand =>
      subcommand
        .setName('activos')
        .setDescription('Ver tus power-ups activos')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tienda')
        .setDescription('Ver power-ups disponibles')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('comprar')
        .setDescription('Comprar un power-up')
        .addStringOption(option =>
          option.setName('powerup')
            .setDescription('Power-up a comprar')
            .setRequired(true)
            .addChoices(
              { name: '💪 Boost Trabajo Básico (+25% 1h) - 10,000', value: 'powerup_trabajo_1' },
              { name: '💪💪 Boost Trabajo Pro (+50% 1h) - 25,000', value: 'powerup_trabajo_2' },
              { name: '🔥 Boost Trabajo Ultra (+100% 30m) - 56,000', value: 'powerup_trabajo_3' },
              { name: '🎰 Suerte Básica (+15% casino 1h) - 15,000', value: 'powerup_casino_1' },
              { name: '🎰🎰 Suerte Avanzada (+30% casino 1h) - 35,000', value: 'powerup_casino_2' },
              { name: '🎰🔥 Suerte Máxima (+50% casino 30m) - 75,000', value: 'powerup_casino_3' },
              { name: '🥷 Sigilo Básico (+20% robo 1h) - 20,000', value: 'powerup_robo_1' },
              { name: '🥷🥷 Sigilo Avanzado (+40% robo 1h) - 60,000', value: 'powerup_robo_2' },
              { name: '🥷🔥 Maestro del Robo (+60% robo 30m) - 100,000', value: 'powerup_robo_3' },
              { name: '⭐ Boost XP Básico (+25% XP 2h) - 30,000', value: 'powerup_xp_1' },
              { name: '⭐⭐ Boost XP Pro (+50% XP 2h) - 100,000', value: 'powerup_xp_2' },
              { name: '🌟 Boost XP Ultra (+100% XP 1h) - 65,000', value: 'powerup_xp_3' }
            )
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'activos') {
      const powerups = getUserActivePowerups(interaction.guildId, interaction.user.id);
      
      if (powerups.length === 0) {
        return interaction.reply({ 
          content: '❌ No tienes power-ups activos. Usa `/powerups tienda` para ver los disponibles.',
          flags: 64 
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚡ Tus Power-Ups Activos')
        .setTimestamp();
      
      const typeNames = {
        'work_boost': '💪 Boost de Trabajo',
        'casino_luck': '🎰 Suerte de Casino',
        'luck_boost': '🍀 Boost de Suerte',
        'rob_success': '🥷 Boost de Robo',
        'xp_boost': '⭐ Boost de XP',
        'cooldown_reduction': '⚡ Reducción de Cooldown'
      };
      
      for (const powerup of powerups) {
        const remainingMs = powerup.expiresAt - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        const typeName = typeNames[powerup.type] || powerup.type;
        
        embed.addFields({
          name: typeName,
          value: `+${Math.round(powerup.value * 100)}% | ⏱️ ${remainingMinutes} min restantes`,
          inline: true
        });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'tienda') {
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      
      const powerupItems = Object.entries(ITEMS)
        .filter(([_, item]) => item.category === 'powerup')
        .map(([id, item]) => ({
          id,
          ...item
        }));
      
      const workBoosts = powerupItems.filter(p => p.effect?.type === 'work_boost');
      const casinoBoosts = powerupItems.filter(p => p.effect?.type === 'casino_luck');
      const robBoosts = powerupItems.filter(p => p.effect?.type === 'rob_success');
      const xpBoosts = powerupItems.filter(p => p.effect?.type === 'xp_boost');
      
      const formatBoost = (items) => items.map(i => 
        `${i.emoji} **${i.name}** - ${i.price} Lagcoins\n└ ${i.description}`
      ).join('\n\n');
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚡ Tienda de Power-Ups')
        .setDescription(`Tu saldo: **${economy.lagcoins || 0} Lagcoins**\n\nUsa \`/powerups comprar\` para adquirir uno.`)
        .addFields(
          { name: '💪 Boost de Trabajo', value: formatBoost(workBoosts) || 'Ninguno' },
          { name: '🎰 Boost de Casino', value: formatBoost(casinoBoosts) || 'Ninguno' },
          { name: '🥷 Boost de Robo', value: formatBoost(robBoosts) || 'Ninguno' },
          { name: '⭐ Boost de XP', value: formatBoost(xpBoosts) || 'Ninguno' }
        )
        .setFooter({ text: 'Los power-ups se activan inmediatamente al comprarlos' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'comprar') {
      const powerupId = interaction.options.getString('powerup');
      const item = ITEMS[powerupId];
      
      if (!item) {
        return interaction.reply({ content: '❌ Power-up no encontrado', flags: 64 });
      }
      
      const result = await buyItem(interaction.guildId, interaction.user.id, powerupId);
      
      if (result.error) {
        const errorMessages = {
          'item_not_found': '❌ Power-up no encontrado',
          'insufficient_funds': `❌ No tienes suficientes Lagcoins. Necesitas **${item.price}** pero tienes **${result.have || 0}**`,
          'system_error': '❌ Error del sistema'
        };
        return interaction.reply({ content: errorMessages[result.error] || `❌ Error: ${result.error}`, flags: 64 });
      }
      
      const durationMinutes = Math.round(item.effect.duration / 60000);
      const boostPercent = Math.round(item.effect.value * 100);

      logActivity({
        type: LOG_TYPES.POWERUP_ACTIVATE,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'powerups comprar',
        commandOptions: { powerup: powerupId },
        amount: -item.price,
        balanceAfter: result.economy.lagcoins,
        importance: 'medium',
        result: 'success',
        details: { efecto: `+${boostPercent}%`, duracion: `${durationMinutes}min`, tipo: item.effect.type }
      });
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('⚡ ¡Power-Up Activado!')
        .setDescription(`Has activado **${item.emoji} ${item.name}**`)
        .addFields(
          { name: '📊 Efecto', value: `+${boostPercent}%`, inline: true },
          { name: '⏱️ Duración', value: `${durationMinutes} minutos`, inline: true },
          { name: '💰 Costo', value: `${item.price} Lagcoins`, inline: true },
          { name: '💵 Nuevo Saldo', value: `${result.economy.lagcoins} Lagcoins`, inline: true }
        )
        .setFooter({ text: 'El power-up ya está activo. ¡Aprovéchalo!' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
