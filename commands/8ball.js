import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const MAGIC_8BALL_RESPONSES = [
  { response: 'Sí, definitivamente', type: 'positive' },
  { response: 'Sin duda alguna', type: 'positive' },
  { response: 'Puedes contar con ello', type: 'positive' },
  { response: 'Sí, absolutamente', type: 'positive' },
  { response: 'Las señales apuntan a que sí', type: 'positive' },
  { response: 'Probablemente sí', type: 'positive' },
  { response: 'El panorama es bueno', type: 'positive' },
  { response: '¡Por supuesto!', type: 'positive' },
  { response: 'Pregunta de nuevo más tarde', type: 'neutral' },
  { response: 'Mejor no te lo digo ahora', type: 'neutral' },
  { response: 'No puedo predecirlo ahora', type: 'neutral' },
  { response: 'Concéntrate y pregunta otra vez', type: 'neutral' },
  { response: 'Es difícil de ver', type: 'neutral' },
  { response: 'No cuentes con ello', type: 'negative' },
  { response: 'Mi respuesta es no', type: 'negative' },
  { response: 'Mis fuentes dicen que no', type: 'negative' },
  { response: 'No es probable', type: 'negative' },
  { response: 'Muy dudoso', type: 'negative' },
  { response: 'Las perspectivas no son buenas', type: 'negative' },
  { response: 'Definitivamente no', type: 'negative' }
];

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pregúntale a la bola mágica')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para la bola mágica')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('pregunta');
    const response = MAGIC_8BALL_RESPONSES[Math.floor(Math.random() * MAGIC_8BALL_RESPONSES.length)];
    
    const colors = {
      positive: 0x00FF00,
      neutral: 0xFFFF00,
      negative: 0xFF0000
    };

    const embed = new EmbedBuilder()
      .setColor(colors[response.type])
      .setTitle('🎱 Bola Mágica')
      .addFields(
        { name: '❓ Tu pregunta', value: question },
        { name: '🔮 Respuesta', value: `**${response.response}**` }
      )
      .setFooter({ text: `Preguntado por ${interaction.user.username}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
