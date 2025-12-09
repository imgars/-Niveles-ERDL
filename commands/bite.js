import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/9iUd1mR_9CYAAAAC/anime-bite.gif',
  'https://media.tenor.com/xboPZgzD3V4AAAAC/bite-anime.gif',
  'https://media.tenor.com/7bFN5bN3JWEAAAAC/bite-anime-bite.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('bite')
    .setDescription('Muerde a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a morder').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `😈 **${interaction.user.username}** se muerde a sí mismo/a... ¿estás bien?`;
    } else {
      description = `😈 **${interaction.user.username}** muerde a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
