import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playBlackjack } from '../utils/economyDB.js';
import { checkCasinoCooldown, setCasinoCooldown, formatCooldownTime } from '../utils/casinoCooldowns.js';

export default {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Juega al Blackjack')
    .addIntegerOption(option =>
      option.setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setMinValue(10)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const cooldown = checkCasinoCooldown(interaction.user.id, 'blackjack');
    if (!cooldown.canPlay) {
      return interaction.reply({ 
        content: `⏳ Debes esperar **${formatCooldownTime(cooldown.remaining)}** para volver a jugar blackjack.`, 
        flags: 64 
      });
    }

    const bet = interaction.options.getInteger('apuesta');
    
    try {
      const result = await playBlackjack(interaction.guildId, interaction.user.id, bet);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esa apuesta', flags: 64 });
      }

      setCasinoCooldown(interaction.user.id, 'blackjack');

      const cardEmojis = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      const playerCardsStr = result.playerCards.map(c => cardEmojis[c] || c).join(' + ');
      const dealerCardsStr = result.dealerCards.map(c => cardEmojis[c] || c).join(' + ');

      let title, color, description;
      switch (result.result) {
        case 'blackjack':
          title = '🃏 ¡BLACKJACK!';
          color = '#FFD700';
          description = '¡Increíble! ¡21 perfecto!';
          break;
        case 'win':
          title = '🃏 ¡GANASTE!';
          color = '#00FF00';
          description = '¡Tu mano es mejor que la del dealer!';
          break;
        case 'tie':
          title = '🃏 EMPATE';
          color = '#FFFF00';
          description = 'Ambas manos son iguales';
          break;
        default:
          title = '🃏 Perdiste...';
          color = '#FF0000';
          description = 'El dealer tiene mejor mano';
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields(
          { name: '🎴 Tu Mano', value: `${playerCardsStr} = **${result.playerTotal}**`, inline: true },
          { name: '🎴 Dealer', value: `${dealerCardsStr} = **${result.dealerTotal}**`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
          { name: result.result !== 'lose' ? 'Ganancia' : 'Pérdida', value: `${result.winnings > 0 ? '+' : ''}${result.winnings} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `💰 ${result.newBalance} Lagcoins`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en blackjack:', error);
      return interaction.reply({ content: '❌ Error en blackjack', flags: 64 });
    }
  }
};
