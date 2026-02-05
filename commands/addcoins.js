import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { staffAddCoins } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addcoins')
    .setDescription('(Staff) Añadir Lagcoins a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que añadir Lagcoins')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de Lagcoins a añadir')
        .setMinValue(1)
        .setMaxValue(999999999999)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para añadir Lagcoins')
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');
    const reason = interaction.options.getString('razon') || 'Regalo del Staff';

    try {
      await interaction.deferReply();
      
      const result = await staffAddCoins(interaction.guildId, targetUser.id, amount, reason);

      if (!result) {
        return interaction.editReply({ content: '❌ Error al añadir Lagcoins' });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 Lagcoins Añadidos')
        .setDescription(`Se han añadido **${amount} Lagcoins** a ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Cantidad', value: `+${amount} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `${result.lagcoins || 0} Lagcoins`, inline: true },
          { name: 'Razón', value: reason }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en addcoins:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Error al añadir Lagcoins', flags: 64 });
      } else {
        return interaction.editReply({ content: '❌ Error al añadir Lagcoins' });
      }
    }
  }
};
