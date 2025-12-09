import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/HKm9c5_v8EkAAAAC/anime-punch.gif',
  'https://media.tenor.com/1vj-_jq6aTQAAAAC/one-punch.gif',
  'https://media.tenor.com/gUqMkNKb3S0AAAAC/anime-fight.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('punch')
    .setDescription('Golpea a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a golpear').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `👊 **${interaction.user.username}** se golpea a sí mismo/a... ¿estás bien?`;
    } else {
      description = `👊 **${interaction.user.username}** golpea a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
