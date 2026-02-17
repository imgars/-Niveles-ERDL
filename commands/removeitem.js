import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { staffRemoveItem, ITEMS } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

const itemChoices = Object.entries(ITEMS).map(([id, item]) => ({
  name: `${item.emoji} ${item.name}`,
  value: id
})).slice(0, 25);

export default {
  data: new SlashCommandBuilder()
    .setName('removeitem')
    .setDescription('(Staff) Quitar un item a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quitar el item')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Item a quitar')
        .setRequired(true)
        .addChoices(...itemChoices)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const itemId = interaction.options.getString('item');
    const item = ITEMS[itemId];

    if (!item) {
      return interaction.editReply({ content: '❌ Item no encontrado' });
    }

    try {
      const result = await staffRemoveItem(interaction.guildId, targetUser.id, itemId);

      if (!result) {
        return interaction.editReply({ content: '❌ El usuario no tiene ese item' });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🗑️ Item Removido')
        .setDescription(`Se ha quitado **${item.emoji} ${item.name}** de ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Item Removido', value: `${item.emoji} ${item.name}`, inline: true }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en removeitem:', error);
      return interaction.editReply({ content: '❌ Error al quitar item' });
    }
  }
};
