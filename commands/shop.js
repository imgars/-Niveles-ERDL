import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { removeUserLagcoins, saveUserEconomy, getUserEconomy } from '../utils/economyDB.js';
import db from '../utils/database.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Compra XP, niveles, boosts y tarjetas con Lagcoins')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Qué quieres comprar')
        .setChoices(
          { name: '100 XP - 3000 Lagcoins', value: 'xp100' },
          { name: '500 XP - 4500 Lagcoins', value: 'xp500' },
          { name: '1 Nivel - 7000 Lagcoins', value: 'level1' },
          { name: '5 Niveles - 25000 Lagcoins', value: 'level5' },
          { name: 'Boost 50% 24h - 16000 Lagcoins', value: 'boost24' },
          { name: 'Boost 100% 48h - 32000 Lagcoins', value: 'boost48' },
          { name: 'Tarjeta Minecraft - 16000 Lagcoins', value: 'card_minecraft' },
          { name: 'Tarjeta FNAF - 18000 Lagcoins', value: 'card_fnaf' },
          { name: 'Tarjeta Roblox - 25000 Lagcoins', value: 'card_roblox' }
        )
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const item = interaction.options.getString('item');
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    if (!economy) {
      return interaction.editReply('❌ Error al obtener tu cuenta');
    }

    const items = {
      xp100: { price: 3000, xp: 100, name: '100 XP' },
      xp500: { price: 4500, xp: 500, name: '500 XP' },
      level1: { price: 7000, levels: 1, name: '1 Nivel' },
      level5: { price: 25000, levels: 5, name: '5 Niveles' },
      boost24: { price: 16000, boost: 150, hours: 24, name: 'Boost 50% 24h' },
      boost48: { price: 32000, boost: 200, hours: 48, name: 'Boost 100% 48h' },
      card_minecraft: { price: 16000, card: 'minecraft', name: 'Tarjeta Minecraft' },
      card_fnaf: { price: 18000, card: 'fnaf', name: 'Tarjeta FNAF' },
      card_roblox: { price: 25000, card: 'roblox', name: 'Tarjeta Roblox' }
    };

    const itemData = items[item];
    if (!itemData || economy.lagcoins < itemData.price) {
      return interaction.editReply('❌ No tienes suficientes Lagcoins');
    }

    const updated = await removeUserLagcoins(interaction.guildId, interaction.user.id, itemData.price, 'shop');

    if (!updated) {
      return interaction.editReply('❌ Hubo un error al procesar el pago. Verifica si tienes suficientes Lagcoins.');
    }

    const user = db.getUser(interaction.guildId, interaction.user.id);
    
    if (itemData.xp) {
      user.totalXp += itemData.xp;
      user.level = Math.floor(Math.sqrt(user.totalXp / 100));
      db.saveUser(interaction.guildId, interaction.user.id, user);
    }

    if (itemData.levels) {
      user.totalXp += itemData.levels * 500;
      user.level = Math.floor(Math.sqrt(user.totalXp / 100));
      db.saveUser(interaction.guildId, interaction.user.id, user);
    }

    if (itemData.boost) {
      const durationMs = itemData.hours * 60 * 60 * 1000;
      const boostPercent = itemData.boost - 100;
      db.addBoost('user', interaction.user.id, itemData.boost, durationMs, `Boost de tienda ${boostPercent}% por ${itemData.hours}h`);
    }

    if (itemData.card) {
      if (!user.purchasedCards) {
        user.purchasedCards = [];
      }
      if (!user.purchasedCards.includes(itemData.card)) {
        user.purchasedCards.push(itemData.card);
      }
      user.selectedCardTheme = itemData.card;
      db.saveUser(interaction.guildId, interaction.user.id, user);
    }

    logActivity({
      type: LOG_TYPES.SHOP_PURCHASE,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'shop',
      commandOptions: { item },
      amount: -itemData.price,
      balanceAfter: updated.lagcoins,
      importance: itemData.price > 10000 ? 'medium' : 'low',
      result: 'success',
      details: { item: itemData.name, precio: itemData.price }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ ¡Compra Realizada!')
      .setDescription(`Compraste: **${itemData.name}**`)
      .addFields({ name: 'Saldo Restante', value: `💰 ${updated.lagcoins} Lagcoins` })
      .setFooter({ text: 'Gracias por tu compra' });

    return interaction.editReply({ embeds: [embed] });
  }
};
