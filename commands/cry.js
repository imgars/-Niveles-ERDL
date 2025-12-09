import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/NVSYbkr66yMAAAAC/anime-cry.gif',
  'https://media.tenor.com/zYbFIJg7QlcAAAAC/crying-sad.gif',
  'https://media.tenor.com/C_ASGbDN_RgAAAAC/anime-tears.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('cry')
    .setDescription('Llora o expresa tristeza'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `😢 **${interaction.user.username}** está llorando`;

    const embed = new EmbedBuilder()
      .setColor(0x4169E1)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
