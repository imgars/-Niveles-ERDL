import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/D4Dqy7XlLrEAAAAC/anime-kiss-cheek.gif',
  'https://media.tenor.com/8G-3eQRNPREAAAAC/kiss-cheek.gif',
  'https://media.tenor.com/Rr2AfQrFxDMAAAAC/cheek-kiss-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('kisscheeks')
    .setDescription('Beso en la mejilla')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario para besar en la mejilla').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `😘 **${interaction.user.username}** se da un beso en la mejilla a sí mismo/a... ¿estás bien?`;
    } else {
      description = `😘 **${interaction.user.username}** le da un beso en la mejilla a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
