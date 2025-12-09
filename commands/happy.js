import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/mPB5xYb-L9MAAAAC/anime-happy.gif',
  'https://media.tenor.com/FgM_LCJPBhAAAAAC/happy-excited.gif',
  'https://media.tenor.com/77zEZf-AhToAAAAC/yay-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('happy')
    .setDescription('Expresa felicidad'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😄 **${interaction.user.username}** está muy feliz`;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
