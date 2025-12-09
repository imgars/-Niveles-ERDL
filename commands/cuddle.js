import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/zlJwg8F5DwQAAAAC/anime-cuddle.gif',
  'https://media.tenor.com/UxRwJTPdNEUAAAAC/cuddle-anime.gif',
  'https://media.tenor.com/DVPdZ_EGFrQAAAAC/anime-couple-anime-cuddle.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('cuddle')
    .setDescription('Acurrúcate con alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario para acurrucarse').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `💕 **${interaction.user.username}** se acurruca consigo mismo/a... ¿estás bien?`;
    } else {
      description = `💕 **${interaction.user.username}** se acurruca con **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF1493)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
