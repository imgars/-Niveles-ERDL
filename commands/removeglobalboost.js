import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removeglobalboost')
    .setDescription('[Staff] Quita el boost global del servidor'),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    db.removeGlobalBoost();
    
    await interaction.reply({
      embeds: [{
        color: 0x43B581,
        title: '✅ Boost Global Eliminado',
        description: 'El boost global ha sido eliminado del servidor'
      }]
    });
  }
};
