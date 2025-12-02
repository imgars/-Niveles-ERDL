import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { transferUserLagcoins } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Intercambia Lagcoins con otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien enviar Lagcoins')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de Lagcoins a enviar')
        .setMinValue(1)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ No puedes hacer trading con bots', flags: 64 });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes hacer trading contigo mismo', flags: 64 });
    }

    const result = await transferUserLagcoins(interaction.guildId, interaction.user.id, targetUser.id, amount);

    if (!result) {
      return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para esta transferencia', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setTitle('💸 ¡Trading Completado!')
      .setDescription(`${interaction.user.username} envió **${amount} Lagcoins** a ${targetUser.username}`)
      .addFields(
        { name: 'Tu saldo', value: `💰 ${result.from.lagcoins} Lagcoins` },
        { name: 'Saldo de ' + targetUser.username, value: `💰 ${result.to.lagcoins} Lagcoins` }
      );

    return interaction.reply({ embeds: [embed] });
  }
};
