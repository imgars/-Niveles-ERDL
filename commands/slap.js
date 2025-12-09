import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/anime-slap.gif',
  'https://media.tenor.com/kxJFQU46MmMAAAAC/slap-anime.gif',
  'https://media.tenor.com/Mfvp8LyA_dEAAAAC/anime-slap-mad.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Abofetea a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a abofetear').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👋💥 **${interaction.user.username}** se abofetea a sí mismo/a... ¿estás bien?`;
    } else {
      description = `👋💥 **${interaction.user.username}** abofetea a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
