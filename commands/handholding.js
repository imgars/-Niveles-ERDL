import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/K88K3RHx44MAAAAC/hand-holding.gif',
  'https://media.tenor.com/EBGFWZ4GNfgAAAAC/anime-hold-hands.gif',
  'https://media.tenor.com/FyxP18KWJ0kAAAAC/holding-hands-anime.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('handholding')
    .setDescription('Toma la mano de alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario para tomar la mano').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `🤝 **${interaction.user.username}** se toma la mano a sí mismo/a... ¿estás bien?`;
    } else {
      description = `🤝 **${interaction.user.username}** toma la mano de **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFB6C1)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
