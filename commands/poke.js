import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/85-5xEPbIh8AAAAC/anime-poke.gif',
  'https://media.tenor.com/0lzL_WFQC4cAAAAC/poke-anime.gif',
  'https://media.tenor.com/X_7PaKF7sQQAAAAC/anime-boop.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('Pincha a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a pinchar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👆 **${interaction.user.username}** se pincha a sí mismo/a... ¿estás bien?`;
    } else {
      description = `👆 **${interaction.user.username}** pincha a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x9370DB)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
