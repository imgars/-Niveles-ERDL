import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';

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
    const subcommand = interaction.options.getSubcommand();
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    if (!economy) {
      return interaction.reply({ content: '❌ Error al obtener tu cuenta', flags: 64 });
    }

    if (subcommand === 'depositar') {
      const amount = interaction.options.getInteger('cantidad');
      
      if (economy.lagcoins < amount) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins', flags: 64 });
      }

      economy.lagcoins -= amount;
      economy.bankBalance = (economy.bankBalance || 0) + amount;
      await saveUserEconomy(interaction.guildId, interaction.user.id, economy);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Depósito Realizado!')
        .setDescription(`Depositaste **${amount} Lagcoins** en tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${economy.lagcoins}` },
          { name: 'Banco', value: `🏦 ${economy.bankBalance}` }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'retirar') {
      const amount = interaction.options.getInteger('cantidad');
      
      if ((economy.bankBalance || 0) < amount) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins en el banco', flags: 64 });
      }

      economy.bankBalance = (economy.bankBalance || 0) - amount;
      economy.lagcoins += amount;
      await saveUserEconomy(interaction.guildId, interaction.user.id, economy);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Retiro Realizado!')
        .setDescription(`Retiraste **${amount} Lagcoins** de tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${economy.lagcoins}` },
          { name: 'Banco', value: `🏦 ${economy.bankBalance}` }
        );

      return interaction.reply({ embeds: [embed] });
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

      return interaction.reply({ embeds: [embed] });
    }
  }
};
