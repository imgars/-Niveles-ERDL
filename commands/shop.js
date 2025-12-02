import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { removeUserLagcoins, saveUserEconomy, getUserEconomy } from '../utils/economyDB.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Compra XP, niveles y boosts con Lagcoins')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Qué quieres comprar')
        .setChoices(
          { name: '100 XP - 50 Lagcoins', value: 'xp100' },
          { name: '500 XP - 200 Lagcoins', value: 'xp500' },
          { name: '1 Nivel - 300 Lagcoins', value: 'level1' },
          { name: '5 Niveles - 1200 Lagcoins', value: 'level5' },
          { name: 'Boost 50% 24h - 400 Lagcoins', value: 'boost24' },
          { name: 'Boost 100% 48h - 800 Lagcoins', value: 'boost48' }
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
      xp100: { price: 50, xp: 100, name: '100 XP' },
      xp500: { price: 200, xp: 500, name: '500 XP' },
      level1: { price: 300, levels: 1, name: '1 Nivel' },
      level5: { price: 1200, levels: 5, name: '5 Niveles' },
      boost24: { price: 400, boost: 0.5, hours: 24, name: 'Boost 50% 24h' },
      boost48: { price: 800, boost: 1, hours: 48, name: 'Boost 100% 48h' }
    };

    const itemData = items[item];
    if (!itemData || economy.lagcoins < itemData.price) {
      return interaction.editReply('❌ No tienes suficientes Lagcoins');
    }

    const updated = await removeUserLagcoins(interaction.guildId, interaction.user.id, itemData.price, 'shop');

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
      const expiresAt = new Date(Date.now() + itemData.hours * 60 * 60 * 1000);
      db.addBoost('global', itemData.boost, expiresAt);
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ ¡Compra Realizada!')
      .setDescription(`Compraste: **${itemData.name}**`)
      .addFields({ name: 'Saldo Restante', value: `💰 ${updated.lagcoins} Lagcoins` })
      .setFooter({ text: 'Gracias por tu compra' });

    return interaction.editReply({ embeds: [embed] });
  }
};
