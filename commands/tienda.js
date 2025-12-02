import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ITEMS, buyItem, getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Compra items para mejorar tus trabajos')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Item a comprar')
        .setChoices(
          { name: 'Caña de Pesca - 500 Lagcoins', value: 'cana_pesca' },
          { name: 'Hacha - 600 Lagcoins', value: 'hacha' },
          { name: 'Pico - 800 Lagcoins', value: 'pico' },
          { name: 'Pala - 700 Lagcoins', value: 'pala' }
        )
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const itemId = interaction.options.getString('item');
    const item = ITEMS[itemId];
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    if (economy.lagcoins < item.price) {
      return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Necesitas ${item.price}`, flags: 64 });
    }

    if (economy.items && economy.items.includes(itemId)) {
      return interaction.reply({ content: '❌ Ya tienes este item', flags: 64 });
    }

    const result = await buyItem(interaction.guildId, interaction.user.id, itemId);

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ ¡Compra Realizada!')
      .setDescription(`Compraste: **${item.name}**`)
      .addFields(
        { name: 'Descripción', value: item.description },
        { name: 'Precio', value: `${item.price} Lagcoins` },
        { name: 'Nuevo Saldo', value: `${result.lagcoins} Lagcoins` }
      );

    return interaction.reply({ embeds: [embed] });
  }
};
