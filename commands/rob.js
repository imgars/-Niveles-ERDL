import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, transferUserLagcoins, removeUserLagcoins } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Intenta robar Lagcoins a otro usuario (50% de probabilidad)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a robar')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('usuario');

    if (targetUser.bot) {
      return interaction.editReply('❌ No puedes robar a bots');
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.editReply('❌ No puedes robarte a ti mismo');
    }

    const target = await getUserEconomy(interaction.guildId, targetUser.id);
    if (!target || target.lagcoins < 10) {
      return interaction.editReply('❌ Este usuario no tiene suficientes Lagcoins');
    }

    const success = Math.random() > 0.5;
    const robbedAmount = Math.floor(Math.random() * (target.lagcoins / 2)) + 10;

    if (success) {
      const result = await transferUserLagcoins(interaction.guildId, targetUser.id, interaction.user.id, robbedAmount);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💰 ¡Robo Exitoso!')
        .setDescription(`${interaction.user.username} robó **${robbedAmount} Lagcoins** a ${targetUser.username}`)
        .addFields({ name: 'Tu nuevo saldo', value: `💰 ${result.from.lagcoins} Lagcoins` });

      return interaction.editReply({ embeds: [embed] });
    } else {
      const penalty = Math.floor(Math.random() * 50) + 20;
      await removeUserLagcoins(interaction.guildId, interaction.user.id, penalty, 'robbed_penalty');

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('❌ ¡Robo Fallido!')
        .setDescription(`${targetUser.username} te atrapó intentando robar y te confiscó **${penalty} Lagcoins**`)
        .addFields({ name: 'Tus Lagcoins confiscados', value: `💰 -${penalty}` });

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
