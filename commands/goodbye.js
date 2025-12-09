import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/6M7WN3LPXqAAAAAC/anime-bye.gif',
  'https://media.tenor.com/H-lZHLZnjJYAAAAC/goodbye-wave.gif',
  'https://media.tenor.com/3gAZAWqMJasAAAAC/wave-bye.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Despídete de alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a despedirte').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👋 **${interaction.user.username}** se despide de sí mismo/a... ¿estás bien?`;
    } else {
      description = `👋 **${interaction.user.username}** se despide de **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
