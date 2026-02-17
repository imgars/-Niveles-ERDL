import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isStaff } from '../utils/helpers.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('eliminarrankcards')
    .setDescription('Elimina todas las tarjetas de rango de los usuarios (Solo Staff)'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el Staff puede usar este comando', flags: 64 });
    }

    const allUsers = db.getAllUsers(interaction.guildId);
    const usersWithCards = allUsers.filter(u => u.purchasedCards && u.purchasedCards.length > 0);

    if (usersWithCards.length === 0) {
      return interaction.reply({ content: '❌ No hay usuarios con tarjetas compradas', flags: 64 });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`deleterankcards_confirm_${interaction.user.id}`)
          .setLabel('⚠️ Confirmar Eliminación')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`deleterankcards_cancel_${interaction.user.id}`)
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('⚠️ Eliminar Todas las Rank Cards')
      .setDescription(`Estás a punto de eliminar las tarjetas de rango de **${usersWithCards.length}** usuarios.`)
      .addFields(
        { name: '📋 Información Importante', value: '- Los usuarios **NO** perderán sus roles\n- Los usuarios tendrán que volver a obtener el nivel requerido para recuperar las tarjetas\n- Esta acción **NO** se puede deshacer' }
      )
      .setFooter({ text: 'Confirma para proceder' });

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};
