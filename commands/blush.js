import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/VU8_e9EIvwYAAAAC/anime-blush.gif',
  'https://media.tenor.com/E9XSe0VFzccAAAAC/blush-shy.gif',
  'https://media.tenor.com/HLBR0IV8oHEAAAAC/anime-blushing.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('blush')
    .setDescription('Sonrójate'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😊 **${interaction.user.username}** se sonroja`;

    const embed = new EmbedBuilder()
      .setColor(0xFFB6C1)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
