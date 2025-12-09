import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/JBBZ1BTUcQQAAAAC/anime-high-five.gif',
  'https://media.tenor.com/aN5WqB1MtakAAAAC/high-five.gif',
  'https://media.tenor.com/SfGJR1TIxgMAAAAC/highfive-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('highfive')
    .setDescription('Choca los cinco con alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario para chocar los cinco').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `✋ **${interaction.user.username}** choca los cinco consigo mismo/a... ¿estás bien?`;
    } else {
      description = `✋ **${interaction.user.username}** choca los cinco con **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x32CD32)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
