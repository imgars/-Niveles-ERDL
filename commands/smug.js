import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/yXB2qXbQX4UAAAAC/anime-smug.gif',
  'https://media.tenor.com/GryShyQOvxUAAAAC/smug-face.gif',
  'https://media.tenor.com/a1TKBoCRfQYAAAAC/smug-anime-smug.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('smug')
    .setDescription('Cara de engreído/a'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😏 **${interaction.user.username}** pone cara de engreído/a`;

    const embed = new EmbedBuilder()
      .setColor(0x9370DB)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
