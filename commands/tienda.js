import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { ITEMS, ITEM_CATEGORIES, buyItem, getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Compra items para mejorar tus trabajos')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría de items')
        .addChoices(
          { name: 'Ver todo el catálogo', value: 'catalogo' },
          { name: '🔧 Herramientas', value: 'herramienta' },
          { name: '💻 Tecnología', value: 'tecnologia' },
          { name: '🚗 Vehículos', value: 'vehiculo' },
          { name: '👔 Profesional', value: 'profesional' },
          { name: '🎵 Instrumentos', value: 'instrumento' },
          { name: '🍳 Cocina', value: 'cocina' },
          { name: '🧪 Consumibles', value: 'consumible' },
          { name: '✨ Coleccionables', value: 'coleccionable' },
          { name: '✈️ Viajes', value: 'viaje' },
          { name: '⚡ Power-Ups', value: 'powerup' },
          { name: '🔒 Seguros Anti-Robo', value: 'seguro' }
        )
    ),
  
  async execute(interaction) {
    const category = interaction.options.getString('categoria');
    const itemIdInput = null; // Removido la opción manual
    
    try {
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

      if (category === 'catalogo' || !category) {
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🛒 Tienda de Items')
          .setDescription(`Tu saldo: **${economy.lagcoins || 0} Lagcoins**\n\nUsa \`/tienda categoria:<categoria>\` para ver items\nUsa \`/tienda comprar:<item>\` para comprar`)
          .setFooter({ text: 'Los items desbloquean trabajos mejor pagados' });

        for (const [catId, catInfo] of Object.entries(ITEM_CATEGORIES)) {
          const categoryItems = Object.entries(ITEMS)
            .filter(([_, item]) => item.category === catId);
          
          if (categoryItems.length > 0) {
            const itemCount = categoryItems.length;
            const priceRange = categoryItems.reduce((acc, [_, item]) => ({
              min: Math.min(acc.min, item.price),
              max: Math.max(acc.max, item.price)
            }), { min: Infinity, max: 0 });
            
            embed.addFields({ 
              name: `${catInfo.emoji} ${catInfo.name}`, 
              value: `${itemCount} items\n💰 ${priceRange.min} - ${priceRange.max}`,
              inline: true 
            });
          }
        }

        return interaction.reply({ embeds: [embed] });
      }

      const categoryInfo = ITEM_CATEGORIES[category];
      if (!categoryInfo) {
        return interaction.reply({ content: '❌ Categoría no válida', flags: 64 });
      }
      
      const categoryItems = Object.entries(ITEMS)
        .filter(([_, item]) => item.category === category);

      if (categoryItems.length === 0) {
        return interaction.reply({ content: '❌ No hay items en esta categoría', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`${categoryInfo.emoji} ${categoryInfo.name}`)
        .setDescription(`Tu saldo: **${economy.lagcoins || 0} Lagcoins**\n\nSelecciona un item del menú para comprarlo:`);

      categoryItems.forEach(([id, item]) => {
        const owned = economy.items?.includes(id) ? ' ✅ (Ya tienes)' : '';
        const canAfford = (economy.lagcoins || 0) >= item.price ? '💰' : '❌';
        let value = `${item.description}\n${canAfford} **${item.price}** Lagcoins${owned}`;
        
        if (item.unlocks) {
          value += `\n🔓 Desbloquea: ${item.unlocks}`;
        }
        if (item.effect) {
          const effectTypes = {
            'work_boost': `+${Math.round(item.effect.value * 100)}% trabajo`,
            'casino_luck': `+${Math.round(item.effect.value * 100)}% suerte casino`,
            'luck_boost': `+${Math.round(item.effect.value * 100)}% suerte`,
            'rob_success': `+${Math.round(item.effect.value * 100)}% éxito robo`,
            'xp_boost': `+${Math.round(item.effect.value * 100)}% XP`,
            'cooldown_reduction': `-${Math.round(item.effect.value * 100)}% cooldown`,
            'anti_rob': `${Math.round(item.effect.value * 100)}% protección`,
            'rob_protection': 'Protección anti-robo'
          };
          const effectText = effectTypes[item.effect.type] || item.effect.type;
          const durationMin = Math.round((item.effect.duration || 0) / 60000);
          value += `\n✨ ${effectText} por ${durationMin}min`;
        }
        
        embed.addFields({ 
          name: `${item.emoji} ${item.name}`, 
          value,
          inline: true 
        });
      });

      // Crear menú desplegable con los items (máx 25 opciones por Discord)
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tienda_buy_${category}`)
        .setPlaceholder('Selecciona un item para comprar')
        .addOptions(
          categoryItems.slice(0, 25).map(([id, item]) => {
            const owned = economy.items?.includes(id);
            const canAfford = (economy.lagcoins || 0) >= item.price;
            
            return {
              label: `${item.name.slice(0, 50)} - ${item.price} LC`,
              description: (owned ? 'Ya tienes este item' : (canAfford ? 'Puedes comprarlo' : 'No tienes suficientes Lagcoins')).slice(0, 100),
              value: id,
              emoji: item.emoji && (item.emoji.includes(':') || /[\u{1F300}-\u{1F9FF}]/u.test(item.emoji)) ? item.emoji : undefined
            };
          })
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      return interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error en tienda:', error);
      return interaction.reply({ content: '❌ Error al cargar la tienda', flags: 64 });
    }
  }
};

async function handlePurchase(interaction, economy, itemId, item) {
  if ((economy.lagcoins || 0) < item.price) {
    return interaction.reply({ 
      content: `❌ No tienes suficientes Lagcoins. Necesitas **${item.price}** pero tienes **${economy.lagcoins || 0}**`, 
      flags: 64 
    });
  }

  // Para items no consumibles/powerups/seguros, verificar si ya lo tiene
  if (!['consumible', 'powerup', 'seguro'].includes(item.category)) {
    if (economy.items && economy.items.includes(itemId)) {
      return interaction.reply({ content: '❌ Ya tienes este item', flags: 64 });
    }
  }

  const result = await buyItem(interaction.guildId, interaction.user.id, itemId);

  if (result.error) {
    const errorMessages = {
      'item_not_found': '❌ Item no encontrado',
      'insufficient_funds': `❌ No tienes suficientes Lagcoins`,
      'already_owned': '❌ Ya tienes este item',
      'system_error': '❌ Error del sistema'
    };
    return interaction.reply({ content: errorMessages[result.error] || `❌ Error: ${result.error}`, flags: 64 });
  }

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ ¡Compra Realizada!')
    .setDescription(`Compraste: **${item.emoji} ${item.name}**`)
    .addFields(
      { name: 'Descripción', value: item.description },
      { name: 'Precio', value: `${item.price} Lagcoins`, inline: true },
      { name: 'Nuevo Saldo', value: `${result.economy.lagcoins} Lagcoins`, inline: true }
    );

  if (item.unlocks) {
    embed.addFields({ name: '🔓 Desbloquea', value: `Trabajo: ${item.unlocks}` });
  }
  
  if (item.effect) {
    const durationMin = Math.round((item.effect.duration || 0) / 60000);
    embed.addFields({ name: '⚡ Efecto Activado', value: `${item.description}\nDuración: ${durationMin} minutos` });
  }

  return interaction.reply({ embeds: [embed] });
}
