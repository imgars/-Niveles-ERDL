import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { bankWithdraw, getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('retirar')
    .setDescription('Retira Lagcoins del banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a retirar (usa 0 para todo)')
        .setMinValue(0)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    let amount = interaction.options.getInteger('cantidad');
    
    try {
      if (amount < 0) {
        return interaction.reply({ content: '❌ La cantidad a retirar debe ser mayor que 0.', flags: 64 });
      }

      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      
      if (amount === 0) {
        amount = economy.bankBalance || 0;
      }

      if (amount <= 0) {
        return interaction.reply({ content: '❌ No tienes Lagcoins en el banco para retirar.', flags: 64 });
      }

      if ((economy.bankBalance || 0) < amount) {
        return interaction.reply({ content: `❌ No tienes suficientes Lagcoins en el banco. Tienes: ${economy.bankBalance || 0}`, flags: 64 });
      }

      const result = await bankWithdraw(interaction.guildId, interaction.user.id, amount);

      if (!result) {
        return interaction.reply({ content: '❌ No tienes suficientes Lagcoins en el banco', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🏦 Retiro Realizado')
        .setDescription(`Has retirado **${amount} Lagcoins** del banco`)
        .addFields(
          { name: '💵 Cartera', value: `${result.lagcoins} Lagcoins`, inline: true },
          { name: '🏦 Banco', value: `${result.bankBalance} Lagcoins`, inline: true },
          { name: '💎 Total', value: `${result.lagcoins + result.bankBalance} Lagcoins`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en retirar:', error);
      return interaction.reply({ content: '❌ Error al retirar', flags: 64 });
    }
  }
};
