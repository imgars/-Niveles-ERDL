import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { staffRemoveCoins } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removecoins')
    .setDescription('(Staff) Quitar Lagcoins a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quitar Lagcoins')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de Lagcoins a quitar')
        .setMinValue(1)
        .setMaxValue(999999999999)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para quitar Lagcoins')
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    // Defer de inmediato para evitar el error "Unknown interaction" de 3 segundos
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');
    const reason = interaction.options.getString('razon') || 'Sanción del Staff';

    try {
      const result = await staffRemoveCoins(interaction.guildId, targetUser.id, amount, reason);

      if (!result) {
        return interaction.editReply({ content: '❌ Error al quitar Lagcoins' });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💸 Lagcoins Removidos')
        .setDescription(`Se han quitado **${amount} Lagcoins** a ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Cantidad', value: `-${amount} Lagcoins`, inline: true },
          { name: 'Nuevo Saldo', value: `${result.lagcoins || 0} Lagcoins`, inline: true },
          { name: 'Razón', value: reason }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en removecoins:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Error al quitar Lagcoins', flags: 64 });
      } else {
        return interaction.editReply({ content: '❌ Error al quitar Lagcoins' });
      }
    }
  }
};
