import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playSlots } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Juega a las tragamonedas')
    .addIntegerOption(option =>
      option.setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setMinValue(10)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const bet = interaction.options.getInteger('apuesta');
    
    try {
      const result = await playSlots(interaction.guildId, interaction.user.id, bet);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esa apuesta', flags: 64 });
      }

      const reelsDisplay = result.reels.join(' | ');
      
      let title, color, description;
      if (result.jackpot) {
        title = '🎰 ¡¡¡JACKPOT!!!';
        color = '#FFD700';
        description = '¡INCREÍBLE! ¡Has ganado el JACKPOT!';
      } else if (result.won) {
        title = '🎰 ¡GANASTE!';
        color = '#00FF00';
        description = '¡Los símbolos están a tu favor!';
      } else {
        title = '🎰 Perdiste...';
        color = '#FF0000';
        description = 'Mejor suerte la próxima vez';
      }

      // Log de economía
      try {
        const { sendEconomyLog } = await import('../index.js');
        const amount = result.won ? result.winnings : -bet;
        const logType = result.jackpot ? 'Slots (JACKPOT)' : (result.won ? 'Slots (Ganancia)' : 'Slots (Pérdida)');
        await sendEconomyLog(interaction.client, interaction, logType, amount, `Apuesta: ${bet}\nMultiplicador: x${result.multiplier}`);
      } catch (e) {}

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields(
          { name: '🎲 Resultado', value: `\`\`\`${reelsDisplay}\`\`\``, inline: false },
          { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
          { name: result.won ? 'Ganancia' : 'Pérdida', value: `${result.won ? '+' : ''}${result.winnings} Lagcoins`, inline: true },
          { name: 'Multiplicador', value: `x${result.multiplier}`, inline: true },
          { name: 'Nuevo Saldo', value: `💰 ${result.newBalance} Lagcoins`, inline: false }
        );

      if (result.jackpot) {
        embed.setFooter({ text: '🌟 ¡Jackpot x6!' });
      }

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en slots:', error);
      return interaction.reply({ content: '❌ Error en las tragamonedas', flags: 64 });
    }
  }
};
