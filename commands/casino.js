import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playCasino } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('Juega en el casino y apuesta Lagcoins')
    .addIntegerOption(option =>
      option.setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setMinValue(10)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const bet = interaction.options.getInteger('apuesta');
    const result = await playCasino(interaction.guildId, interaction.user.id, bet);

    if (!result) {
      return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esa apuesta', flags: 64 });
    }

    if (result.won) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎰 ¡GANASTE!')
        .setDescription(`¡La suerte está de tu lado!`)
        .addFields(
          { name: 'Apuesta', value: `${bet} Lagcoins` },
          { name: 'Ganancia', value: `+${result.winnings} Lagcoins` },
          { name: 'Nuevo Saldo', value: `${result.newBalance} Lagcoins` }
        )
        .setColor('#00FF00');
      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle('🎰 ¡PERDISTE!')
        .setDescription('La suerte no fue contigo esta vez')
        .addFields(
          { name: 'Apuesta', value: `${bet} Lagcoins` },
          { name: 'Pérdida', value: `-${bet} Lagcoins` },
          { name: 'Nuevo Saldo', value: `${result.newBalance} Lagcoins` }
        )
        .setColor('#FF0000');
      return interaction.reply({ embeds: [embed] });
    }
  }
};
