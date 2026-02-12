import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playDice } from '../utils/economyDB.js';
import { checkCasinoCooldown, setCasinoCooldown, formatCooldownTime } from '../utils/casinoCooldowns.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Tira los dados y apuesta')
    .addIntegerOption(option =>
      option.setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setMinValue(10)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('prediccion')
        .setDescription('¿Qué predices?')
        .setRequired(true)
        .addChoices(
          { name: '📈 Alto (8-12) - x1.8', value: 'alto' },
          { name: '📉 Bajo (2-6) - x1.8', value: 'bajo' },
          { name: '🎯 Exacto (7) - x3', value: 'exacto' },
          { name: '🎲 Dobles - x4', value: 'dobles' }
        )
    ),
  
  async execute(interaction) {
    const cooldown = checkCasinoCooldown(interaction.user.id, 'dice');
    if (!cooldown.canPlay) {
      return interaction.reply({ 
        content: `⏳ Debes esperar **${formatCooldownTime(cooldown.remaining)}** para volver a jugar dados.`, 
        flags: 64 
      });
    }

    const bet = interaction.options.getInteger('apuesta');
    const guess = interaction.options.getString('prediccion');
    
    try {
      const result = await playDice(interaction.guildId, interaction.user.id, bet, guess);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esa apuesta', flags: 64 });
      }

      setCasinoCooldown(interaction.user.id, 'dice');

      logActivity({
        type: result.won ? LOG_TYPES.CASINO_WIN : LOG_TYPES.CASINO_LOSS,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'dice',
        commandOptions: { apuesta: bet, prediccion: guess },
        amount: result.winnings,
        balanceAfter: result.newBalance,
        importance: 'low',
        result: 'success',
        details: { dado1: result.dice1, dado2: result.dice2, total: result.total, multiplicador: result.multiplier }
      });

      const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const dice1Emoji = diceEmojis[result.dice1];
      const dice2Emoji = diceEmojis[result.dice2];

      const guessNames = {
        'alto': 'Alto (8-12)',
        'bajo': 'Bajo (2-6)',
        'exacto': 'Exacto (7)',
        'dobles': 'Dobles'
      };

      const embed = new EmbedBuilder()
        .setColor(result.won ? '#00FF00' : '#FF0000')
        .setTitle(result.won ? '🎲 ¡GANASTE!' : '🎲 Perdiste...')
        .setDescription(`Los dados muestran: ${dice1Emoji} + ${dice2Emoji} = **${result.total}**`)
        .addFields(
          { name: 'Tu predicción', value: guessNames[guess], inline: true },
          { name: 'Total', value: `${result.total}`, inline: true },
          { name: 'Multiplicador', value: `x${result.multiplier}`, inline: true },
          { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
          { name: result.won ? 'Ganancia' : 'Pérdida', value: `${result.won ? '+' : ''}${result.winnings} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `💰 ${result.newBalance} Lagcoins`, inline: true }
        );

      if (result.dice1 === result.dice2) {
        embed.setFooter({ text: '🎲 ¡Dobles!' });
      }

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en dice:', error);
      return interaction.reply({ content: '❌ Error en dados', flags: 64 });
    }
  }
};
