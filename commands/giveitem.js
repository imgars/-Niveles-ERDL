import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { staffGiveItem, ITEMS } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

const itemChoices = Object.entries(ITEMS).map(([id, item]) => ({
  name: `${item.emoji} ${item.name} - ${item.price} Lagcoins`,
  value: id
})).slice(0, 25);

export default {
  data: new SlashCommandBuilder()
    .setName('giveitem')
    .setDescription('(Staff) Dar un item a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que dar el item')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Item a dar')
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
      const result = await staffGiveItem(interaction.guildId, targetUser.id, itemId);

      if (!result) {
        return interaction.editReply({ content: '❌ Error al dar el item' });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎁 Item Entregado')
        .setDescription(`Se ha dado **${item.emoji} ${item.name}** a ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Item', value: `${item.emoji} ${item.name}`, inline: true },
          { name: 'Descripción', value: item.description }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en giveitem:', error);
      return interaction.editReply({ content: '❌ Error al dar item' });
    }
  }
};
