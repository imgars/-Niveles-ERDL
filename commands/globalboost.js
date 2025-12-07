import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('globalboost')
    .setDescription('[Staff] Añade un boost global al servidor')
    .addIntegerOption(option =>
      option.setName('multiplicador')
        .setDescription('Valor del multiplicador (100=x1, 150=x1.5, 200=x2, 1000=x10)')
        .setRequired(true)
        .setMinValue(101)
    )
    .addIntegerOption(option =>
      option.setName('duracion')
        .setDescription('Duración en minutos (0 = permanente)')
        .setRequired(true)
        .setMinValue(0)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const multiplier = interaction.options.getInteger('multiplicador');
    const duration = interaction.options.getInteger('duracion');
    const durationMs = duration > 0 ? duration * 60 * 1000 : null;
    const boostPercent = multiplier - 100;
    const description = `Boost global de ${boostPercent}%`;
    
    db.addBoost('global', null, multiplier, durationMs, description);
    
    await interaction.reply({
      embeds: [{
        color: 0xFFD700,
        title: '🌍 Boost Global Activado',
        description: `Boost de **${boostPercent}%** (x${(multiplier/100).toFixed(2)}) para todo el servidor`,
        fields: [{ name: 'Duración', value: duration > 0 ? `${duration} minutos` : 'Permanente' }]
      }]
    });
  }
};
