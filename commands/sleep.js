import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/A1XFkH6WbhMAAAAC/anime-sleep.gif',
  'https://media.tenor.com/u9FUwBUEP1cAAAAC/sleepy-anime.gif',
  'https://media.tenor.com/kLEQC0FxwgQAAAAC/sleeping-cute.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('sleep')
    .setDescription('Mimir time'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😴 **${interaction.user.username}** se va a dormir (mimir time)`;

    const embed = new EmbedBuilder()
      .setColor(0x191970)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
