import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/kONDHbZb6HkAAAAC/anime-laugh.gif',
  'https://media.tenor.com/D1M7dKoRKZMAAAAC/lol-anime.gif',
  'https://media.tenor.com/hL7QlEZoJTEAAAAC/laugh-funny.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('laugh')
    .setDescription('Ríete'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😂 **${interaction.user.username}** se ríe`;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
