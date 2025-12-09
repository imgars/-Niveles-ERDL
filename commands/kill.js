import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/6t_xY6ACwPUAAAAC/anime-death.gif',
  'https://media.tenor.com/g3fY7TGdmycAAAAC/attack-anime.gif',
  'https://media.tenor.com/ZpPV1VNV3jMAAAAC/anime-killed.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Mata a alguien (de broma)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a matar (de broma)').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `💀 **${interaction.user.username}** se mata (de broma) a sí mismo/a... ¿estás bien?`;
    } else {
      description = `💀 **${interaction.user.username}** mata (de broma) a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
