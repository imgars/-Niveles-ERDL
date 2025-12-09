import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/FH9aBB1e5goAAAAC/anime-drunk.gif',
  'https://media.tenor.com/cP0gCKnLWooAAAAC/drunk-anime.gif',
  'https://media.tenor.com/0pXpxWR1QMsAAAAC/drinking-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('drunk')
    .setDescription('Actúa ebrio/a'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `🍺 **${interaction.user.username}** está ebrio/a`;

    const embed = new EmbedBuilder()
      .setColor(0xDAA520)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
