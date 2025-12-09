import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/9ym7_CVKgXoAAAAC/anime-singing.gif',
  'https://media.tenor.com/wBGZBkNpvmwAAAAC/sing-anime.gif',
  'https://media.tenor.com/4E8kbSdNiG8AAAAC/karaoke-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('sing')
    .setDescription('Canta'),

  async execute(interaction) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    const description = `🎤 **${interaction.user.username}** canta`;

    const embed = new EmbedBuilder()
      .setColor(0x9370DB)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
