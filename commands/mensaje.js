import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mensaje')
    .setDescription('[Staff] Envía un mensaje de texto plano')
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('El texto a enviar')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const text = interaction.options.getString('texto');
    
    await interaction.channel.send(text);
    await interaction.reply({ content: '✅ Mensaje enviado.', ephemeral: true });
  }
};
