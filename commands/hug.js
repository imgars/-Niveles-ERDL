import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/9e1aE_xBLCsAAAAC/anime-hug.gif',
  'https://media.tenor.com/7J-9cP-44CYAAAAC/anime-hug-cute.gif',
  'https://media.tenor.com/FRWm_qjPNUkAAAAC/anime-hug.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Abraza a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a abrazar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `🤗 **${interaction.user.username}** se abraza a sí mismo/a... ¿estás bien?`;
    } else {
      description = `🤗 **${interaction.user.username}** abraza a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
