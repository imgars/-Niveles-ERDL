import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDailyReward } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria'),
  
  async execute(interaction) {
    const reward = await getDailyReward(interaction.guildId, interaction.user.id);

    if (reward === null) {
      return interaction.reply({ content: '❌ Ya reclamaste tu recompensa diaria. Vuelve mañana!', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎁 ¡Recompensa Diaria!')
      .setDescription(`Ganaste **${reward} Lagcoins** por tu login diario`)
      .setFooter({ text: 'Vuelve mañana para más recompensas' });

    return interaction.reply({ embeds: [embed] });
  }
};
