import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, bankDeposit, bankWithdraw } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Gestiona tu dinero en el banco')
    .addSubcommand(subcommand =>
      subcommand
        .setName('depositar')
        .setDescription('Deposita Lagcoins en el banco')
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad a depositar')
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('retirar')
        .setDescription('Retira Lagcoins del banco')
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad a retirar')
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ve tu saldo del banco')
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    if (!economy) {
      return interaction.editReply({ content: '❌ Error al obtener tu cuenta' });
    }

    if (subcommand === 'depositar') {
      const amount = interaction.options.getInteger('cantidad');
      if (amount <= 0) return interaction.editReply({ content: '❌ La cantidad debe ser mayor a 0' });

      const result = await bankDeposit(interaction.guildId, interaction.user.id, amount);
      if (!result) {
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        return interaction.editReply({ content: `❌ No tienes suficientes Lagcoins. Tienes: ${economy?.lagcoins || 0}` });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Depósito Realizado!')
        .setDescription(`Depositaste **${amount} Lagcoins** en tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${result.lagcoins}` },
          { name: 'Banco', value: `🏦 ${result.bankBalance}` }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'retirar') {
      const amount = interaction.options.getInteger('cantidad');
      if (amount <= 0) return interaction.editReply({ content: '❌ La cantidad debe ser mayor a 0' });

      const result = await bankWithdraw(interaction.guildId, interaction.user.id, amount);
      if (!result) {
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        return interaction.editReply({ content: `❌ No tienes suficientes Lagcoins en el banco. Tienes: ${economy?.bankBalance || 0}` });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Retiro Realizado!')
        .setDescription(`Retiraste **${amount} Lagcoins** de tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${result.lagcoins}` },
          { name: 'Banco', value: `🏦 ${result.bankBalance}` }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'ver') {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏦 Tu Cuenta Bancaria')
        .addFields(
          { name: 'Cartera', value: `💵 ${economy.lagcoins} Lagcoins` },
          { name: 'Banco', value: `🏦 ${economy.bankBalance || 0} Lagcoins` },
          { name: 'Total', value: `💎 ${economy.lagcoins + (economy.bankBalance || 0)} Lagcoins` }
        );

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
