import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { getLeaderboard } from '../utils/economyDB.js';
import { generateEconomyLeaderboardImage } from '../utils/cardGenerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lbeconomia')
    .setDescription('Ver leaderboards de economía en imagen pixel art')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de leaderboard')
        .setRequired(true)
        .addChoices(
          { name: '💰 Más Ricos (Lagcoins)', value: 'lagcoins' },
          { name: '🎰 Mejores del Casino', value: 'casino' },
          { name: '🎮 Campeones de Minijuegos', value: 'minigames' },
          { name: '🤝 Mejores Negociantes', value: 'trades' }
        )
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const type = interaction.options.getString('tipo');
    
    try {
      const leaderboard = await getLeaderboard(interaction.guildId, type, 10);
      
      if (leaderboard.length === 0) {
        return interaction.editReply('❌ No hay datos suficientes para generar el leaderboard.');
      }
      
      const imageBuffer = await generateEconomyLeaderboardImage(
        leaderboard, 
        interaction.client, 
        type, 
        interaction.guild.name
      );
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: `leaderboard_${type}.png` });
      
      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error generando leaderboard:', error);
      return interaction.editReply('❌ Error al generar el leaderboard.');
    }
  }
};
