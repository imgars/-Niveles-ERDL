import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/8SWNP6KDqHcAAAAC/anime-lick.gif',
  'https://media.tenor.com/IH-vUFGxGEAAAAAC/lick-anime.gif',
  'https://media.tenor.com/3q6U_Y6r9QcAAAAC/anime-licking.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('lick')
    .setDescription('Lame a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a lamer').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👅 **${interaction.user.username}** se lame a sí mismo/a... ¿estás bien?`;
    } else {
      description = `👅 **${interaction.user.username}** lame a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
