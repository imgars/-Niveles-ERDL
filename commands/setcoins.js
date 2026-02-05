import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { staffSetCoins } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setcoins')
    .setDescription('(Staff) Establecer los Lagcoins de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que establecer Lagcoins')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Nueva cantidad de Lagcoins')
        .setMinValue(0)
        .setMaxValue(999999999999)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    try {
      await interaction.deferReply();
      
      const result = await staffSetCoins(interaction.guildId, targetUser.id, amount);

      if (!result) {
        return interaction.editReply({ content: '❌ Error al establecer Lagcoins' });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💰 Lagcoins Establecidos')
        .setDescription(`Se han establecido los Lagcoins de ${targetUser} a **${amount}**`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Nuevo Saldo', value: `${result.lagcoins || 0} Lagcoins`, inline: true }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en setcoins:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Error al establecer Lagcoins', flags: 64 });
      } else {
        return interaction.editReply({ content: '❌ Error al establecer Lagcoins' });
      }
    }
  }
};
