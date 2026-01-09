import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { bankDeposit, getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('depositar')
    .setDescription('Deposita Lagcoins en el banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a depositar (usa 0 para todo)')
        .setMinValue(0)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    let amount = interaction.options.getInteger('cantidad');
    
    try {
      if (amount < 0) {
        return interaction.reply({ content: '❌ La cantidad a depositar debe ser mayor que 0.', flags: 64 });
      }

      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      
      if (amount === 0) {
        amount = economy.lagcoins;
      }

      if (amount <= 0) {
        return interaction.reply({ content: '❌ No tienes Lagcoins para depositar.', flags: 64 });
      }

      if (economy.lagcoins < amount) {
        return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Tienes: ${economy.lagcoins}`, flags: 64 });
      }

      const result = await bankDeposit(interaction.guildId, interaction.user.id, amount);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins para depositar', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🏦 Depósito Realizado')
        .setDescription(`Has depositado **${amount} Lagcoins** en el banco`)
        .addFields(
          { name: '💵 Cartera', value: `${result.lagcoins} Lagcoins`, inline: true },
          { name: '🏦 Banco', value: `${result.bankBalance} Lagcoins`, inline: true },
          { name: '💎 Total', value: `${result.lagcoins + result.bankBalance} Lagcoins`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en depositar:', error);
      return interaction.reply({ content: '❌ Error al depositar', flags: 64 });
    }
  }
};
