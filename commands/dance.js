import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/rGN6mUBkxEQAAAAC/anime-dance.gif',
  'https://media.tenor.com/1FotajLkHQUAAAAC/dancing-anime.gif',
  'https://media.tenor.com/TJvl9sSaKrcAAAAC/anime-dance-cute.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('dance')
    .setDescription('Baila'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `💃 **${interaction.user.username}** baila`;

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
