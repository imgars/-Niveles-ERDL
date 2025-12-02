import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { robBank } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('robar_banco')
    .setDescription('¡Intenta robar el banco! (¡Muy riesgoso!)'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const result = await robBank(interaction.guildId, interaction.user.id);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🏦 ¡ROBO EXITOSO!')
        .setDescription('¡Lo lograste! ¡Escapaste con el dinero!')
        .addFields(
          { name: 'Dinero Robado', value: `${result.stolen} Lagcoins` },
          { name: '🚨', value: 'La policía está en camino...' }
        );
      return interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚓 ¡TE ATRAPARON!')
        .setDescription('¡La policía te capturó! Tuviste que pagar una multa')
        .addFields({ name: 'Multa', value: `-${result.penalty} Lagcoins` });
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
