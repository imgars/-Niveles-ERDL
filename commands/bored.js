import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/E7dK_UjMeowAAAAC/anime-bored.gif',
  'https://media.tenor.com/7BH8vjNs9u0AAAAC/bored-anime.gif',
  'https://media.tenor.com/0FfLqvZTWQAAAAAC/sleepy-bored.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('bored')
    .setDescription('Expresa aburrimiento'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😑 **${interaction.user.username}** está aburrido/a`;

    const embed = new EmbedBuilder()
      .setColor(0xA9A9A9)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
