import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../utils/helpers.js';
import db from '../utils/database.js';

const AVAILABLE_CARDS = [
  { name: 'Minecraft', value: 'minecraft' },
  { name: 'FNAF', value: 'fnaf' },
  { name: 'Roblox', value: 'roblox' },
  { name: 'Zelda', value: 'zelda' },
  { name: 'Pokemon', value: 'pokemon' },
  { name: 'Geometry Dash', value: 'geometrydash' },
  { name: 'Night', value: 'night' },
  { name: 'Ocean', value: 'ocean' },
  { name: 'Pixel', value: 'pixel' },
  { name: 'Discord', value: 'discord' }
];

export default {
  data: new SlashCommandBuilder()
    .setName('giftcard')
    .setDescription('Regala una tarjeta de rango a un usuario (Solo Staff)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que regalar la tarjeta')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tarjeta')
        .setDescription('Tarjeta a regalar')
        .setRequired(true)
        .addChoices(...AVAILABLE_CARDS)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el Staff puede usar este comando', flags: 64 });
    }

    const target = interaction.options.getUser('usuario');
    const cardType = interaction.options.getString('tarjeta');
    const cardName = AVAILABLE_CARDS.find(c => c.value === cardType)?.name || cardType;

    const userData = db.getUser(interaction.guildId, target.id);

    if (!userData.purchasedCards) {
      userData.purchasedCards = [];
    }

    if (userData.purchasedCards.includes(cardType)) {
      return interaction.reply({ 
        content: `❌ ${target.username} ya tiene la tarjeta **${cardName}**`, 
        flags: 64 
      });
    }

    userData.purchasedCards.push(cardType);
    userData.selectedCardTheme = cardType;
    db.saveUser(interaction.guildId, target.id, userData);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎁 ¡Tarjeta Regalada!')
      .setDescription(`**${interaction.user.username}** le ha regalado la tarjeta **${cardName}** a **${target.username}**!`)
      .addFields(
        { name: '🃏 Tarjeta', value: cardName, inline: true },
        { name: '👤 Receptor', value: target.username, inline: true }
      )
      .setFooter({ text: 'La tarjeta ha sido equipada automáticamente' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
