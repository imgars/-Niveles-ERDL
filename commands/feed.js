import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GIFS = [
  'https://media.tenor.com/8ck7evCWGj8AAAAC/anime-food.gif',
  'https://media.tenor.com/XNMF52PhmWAAAAAC/anime-eat.gif',
  'https://media.tenor.com/QnlVtT1yAKEAAAAC/anime-feeding.gif'
];

export default {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('Dale de comer a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a alimentar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];

    let description;
    if (target.id === interaction.user.id) {
      description = `🍕 **${interaction.user.username}** se alimenta a sí mismo/a... ¿estás bien?`;
    } else {
      description = `🍕 **${interaction.user.username}** le da de comer a **${target.username}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setDescription(description)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
