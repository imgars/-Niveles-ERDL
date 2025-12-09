import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/uMlplWH1CZEAAAAC/anime-wave.gif',
  'https://media.tenor.com/HZ0zc-9iNEgAAAAC/cute-hello.gif',
  'https://media.tenor.com/1T8WqeHMNZ0AAAAC/anime-hi.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Saluda a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a saludar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👋 **${interaction.user.username}** se saluda a sí mismo/a... ¿estás bien?`;
    } else {
      description = `👋 **${interaction.user.username}** saluda a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
