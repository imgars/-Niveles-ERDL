import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

const pendingTrades = new Map();

const TRADEABLE_CARDS = [
  { name: 'Minecraft', value: 'minecraft' },
  { name: 'FNAF', value: 'fnaf' },
  { name: 'Roblox', value: 'roblox' }
];

export default {
  data: new SlashCommandBuilder()
    .setName('tradecard')
    .setDescription('Regala una de tus tarjetas a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que regalar la tarjeta')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tarjeta')
        .setDescription('Tarjeta a regalar')
        .setRequired(true)
        .addChoices(...TRADEABLE_CARDS)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const cardType = interaction.options.getString('tarjeta');
    const cardName = TRADEABLE_CARDS.find(c => c.value === cardType)?.name || cardType;

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes regalarte tarjetas a ti mismo/a', flags: 64 });
    }

    if (target.bot) {
      return interaction.reply({ content: '❌ No puedes regalar tarjetas a bots', flags: 64 });
    }

    const userData = db.getUser(interaction.guildId, interaction.user.id);
    const targetData = db.getUser(interaction.guildId, target.id);

    if (!userData.purchasedCards || !userData.purchasedCards.includes(cardType)) {
      return interaction.reply({ 
        content: `❌ No tienes la tarjeta **${cardName}**`, 
        flags: 64 
      });
    }

    if (targetData.purchasedCards && targetData.purchasedCards.includes(cardType)) {
      return interaction.reply({ 
        content: `❌ ${target.username} ya tiene la tarjeta **${cardName}**`, 
        flags: 64 
      });
    }

    const tradeKey = `${interaction.guildId}-${interaction.user.id}-${target.id}-${cardType}`;
    pendingTrades.set(tradeKey, {
      sender: interaction.user.id,
      receiver: target.id,
      cardType: cardType,
      cardName: cardName,
      guildId: interaction.guildId,
      timestamp: Date.now()
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`tradecard_accept_${tradeKey}`)
          .setLabel('✅ Aceptar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`tradecard_reject_${tradeKey}`)
          .setLabel('❌ Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle('🎁 Regalo de Tarjeta')
      .setDescription(`**${interaction.user.username}** quiere regalarte la tarjeta **${cardName}**!`)
      .addFields({ name: '🃏 Tarjeta', value: cardName })
      .setFooter({ text: 'El regalo expira en 60 segundos' });

    const reply = await interaction.reply({ 
      content: `<@${target.id}>`,
      embeds: [embed], 
      components: [row] 
    });

    logActivity({
      type: LOG_TYPES.TRADE,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'tradecard',
      importance: 'low',
      result: 'success',
      details: { receptor: target.username, tarjeta: cardName, estado: 'propuesta' }
    });

    setTimeout(() => {
      if (pendingTrades.has(tradeKey)) {
        pendingTrades.delete(tradeKey);
        interaction.editReply({
          embeds: [embed.setFooter({ text: 'El regalo ha expirado' })],
          components: []
        }).catch(() => {});
      }
    }, 60000);
  }
};

export { pendingTrades };
