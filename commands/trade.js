import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { transferUserLagcoins } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

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

    if (amount <= 0) {
      return interaction.reply({ content: '❌ La cantidad a enviar debe ser mayor que 0.', flags: 64 });
    }

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

    logActivity({
      type: LOG_TYPES.TRADE,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'trade',
      commandOptions: { usuario: targetUser.id, cantidad: amount },
      amount: -amount,
      balanceAfter: result.from.lagcoins,
      importance: amount > 10000 ? 'high' : 'low',
      result: 'success',
      details: { receptor: targetUser.username, cantidad: amount }
    });

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
