import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playCoinflip } from '../utils/economyDB.js';
import { checkCasinoCooldown, setCasinoCooldown, formatCooldownTime } from '../utils/casinoCooldowns.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Lanza una moneda y apuesta')
    .addIntegerOption(option =>
      option.setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setMinValue(10)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('eleccion')
        .setDescription('¿Cara o Cruz?')
        .setRequired(true)
        .addChoices(
          { name: '🪙 Cara', value: 'cara' },
          { name: '⭐ Cruz', value: 'cruz' }
        )
    ),
  
  async execute(interaction) {
    const cooldown = checkCasinoCooldown(interaction.user.id, 'coinflip');
    if (!cooldown.canPlay) {
      return interaction.reply({ 
        content: `⏳ Debes esperar **${formatCooldownTime(cooldown.remaining)}** para volver a jugar coinflip.`, 
        flags: 64 
      });
    }

    const bet = interaction.options.getInteger('apuesta');
    const choice = interaction.options.getString('eleccion');
    
    try {
      const result = await playCoinflip(interaction.guildId, interaction.user.id, bet, choice);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esa apuesta', flags: 64 });
      }

      setCasinoCooldown(interaction.user.id, 'coinflip');

      const coinEmoji = result.result === 'cara' ? '🪙' : '⭐';
      const choiceEmoji = choice === 'cara' ? '🪙' : '⭐';

      const embed = new EmbedBuilder()
        .setColor(result.won ? '#00FF00' : '#FF0000')
        .setTitle(result.won ? '🪙 ¡GANASTE!' : '🪙 Perdiste...')
        .setDescription(`La moneda cayó en **${coinEmoji} ${result.result.toUpperCase()}**`)
        .addFields(
          { name: 'Tu elección', value: `${choiceEmoji} ${choice.charAt(0).toUpperCase() + choice.slice(1)}`, inline: true },
          { name: 'Resultado', value: `${coinEmoji} ${result.result.charAt(0).toUpperCase() + result.result.slice(1)}`, inline: true },
          { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
          { name: result.won ? 'Ganancia' : 'Pérdida', value: `${result.won ? '+' : ''}${result.winnings} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `💰 ${result.newBalance} Lagcoins`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en coinflip:', error);
      return interaction.reply({ content: '❌ Error en coinflip', flags: 64 });
    }
  }
};
