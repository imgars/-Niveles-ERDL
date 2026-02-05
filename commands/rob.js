import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, robUser, saveUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Intenta robar Lagcoins a otro usuario')
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

    const result = await robUser(interaction.guildId, interaction.user.id, targetUser.id);

    if (result.error === 'cooldown') {
      return interaction.editReply(`⏳ Debes esperar **${result.remaining} segundos** para volver a robar`);
    }

    if (result.error === 'victim_poor') {
      return interaction.editReply('❌ Este usuario no tiene suficientes Lagcoins para robar');
    }

    if (result.blocked) {
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🛡️ ¡Robo Bloqueado!')
        .setDescription(`${targetUser.username} tiene un **Escudo Anti-Robo** activo.\n¡Tu intento de robo falló!`);
      return interaction.editReply({ embeds: [embed] });
    }

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💰 ¡Robo Exitoso!')
        .setDescription(`${interaction.user.username} robó **${result.stolen} Lagcoins** a ${targetUser.username}`)
        .addFields({ name: 'Tu nuevo saldo', value: `💰 ${result.newBalance} Lagcoins` })
        .setFooter({ text: 'Cooldown: 30 segundos' });

      return interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('❌ ¡Robo Fallido!')
        .setDescription(`${targetUser.username} te atrapó intentando robar y te multaron **${result.fine} Lagcoins**`)
        .addFields({ name: 'Tus Lagcoins confiscados', value: `💰 -${result.fine}` })
        .setFooter({ text: 'Cooldown: 30 segundos' });

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
