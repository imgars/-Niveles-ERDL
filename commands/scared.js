import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/6pzBRvxNQ1QAAAAC/anime-scared.gif',
  'https://media.tenor.com/mFbO_6Ow9D0AAAAC/scared-hiding.gif',
  'https://media.tenor.com/RuBIlk6m8YEAAAAC/fear-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('scared')
    .setDescription('Expresa miedo'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😨 **${interaction.user.username}** tiene miedo`;

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
