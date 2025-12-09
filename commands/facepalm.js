import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/JZbGJLv6_TIAAAAC/anime-facepalm.gif',
  'https://media.tenor.com/gkHH5-xQNfkAAAAC/facepalm.gif',
  'https://media.tenor.com/14l5LLmLYU8AAAAC/face-palm-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('facepalm')
    .setDescription('Facepalm'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `🤦 **${interaction.user.username}** hace facepalm`;

    const embed = new EmbedBuilder()
      .setColor(0x808080)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
