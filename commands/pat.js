import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/UN3uJYYrpJEAAAAC/pat-anime.gif',
  'https://media.tenor.com/VzHcRl5IqPkAAAAC/head-pat.gif',
  'https://media.tenor.com/3rY3I5t0XmkAAAAC/anime-head-pat.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Acaricia la cabeza de alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a acariciar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `🥰 **${interaction.user.username}** se acaricia la cabeza a sí mismo/a... ¿estás bien?`;
    } else {
      description = `🥰 **${interaction.user.username}** acaricia la cabeza de **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
