import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/tRJN3qYnMBQAAAAC/anime-pout.gif',
  'https://media.tenor.com/eIjQ9mxlDRkAAAAC/pout-angry.gif',
  'https://media.tenor.com/85Ah1j5R0CoAAAAC/anime-mad.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('pout')
    .setDescription('Haz puchero'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😤 **${interaction.user.username}** hace puchero`;

    const embed = new EmbedBuilder()
      .setColor(0xFFA07A)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
