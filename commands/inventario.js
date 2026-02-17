import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, ITEMS, ITEM_CATEGORIES } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('Ver tu inventario de items')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver inventario')
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    
    try {
      const economy = await getUserEconomy(interaction.guildId, targetUser.id);

      if (!economy.items || economy.items.length === 0) {
        return interaction.reply({ 
          content: targetUser.id === interaction.user.id 
            ? '📦 Tu inventario está vacío. ¡Usa `/tienda` para comprar items!' 
            : `📦 ${targetUser.username} no tiene items en su inventario.`,
          flags: 64 
        });
      }

      const itemsByCategory = {};
      economy.items.forEach(itemId => {
        const item = ITEMS[itemId];
        if (item) {
          const category = item.category || 'otros';
          if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
          }
          itemsByCategory[category].push(item);
        }
      });

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🎒 Inventario de ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(`Total de items: **${economy.items.length}**`);

      for (const [categoryId, items] of Object.entries(itemsByCategory)) {
        const category = ITEM_CATEGORIES[categoryId] || { name: 'Otros', emoji: '📦' };
        const itemList = items.map(item => `${item.emoji} ${item.name}`).join('\n');
        embed.addFields({ 
          name: `${category.emoji} ${category.name}`, 
          value: itemList || 'Ninguno',
          inline: true 
        });
      }

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en inventario:', error);
      return interaction.reply({ content: '❌ Error al obtener inventario', flags: 64 });
    }
  }
};
