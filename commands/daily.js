import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDailyReward } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria'),
  
  async execute(interaction) {
    const result = await getDailyReward(interaction.guildId, interaction.user.id);

    if (result === null) {
      return interaction.reply({ content: '❌ Ya reclamaste tu recompensa diaria. Vuelve mañana!', flags: 64 });
    }

    logActivity({
      type: LOG_TYPES.DAILY_REWARD,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'daily',
      amount: result.reward + (result.streakBonus || 0),
      importance: 'low',
      result: 'success',
      details: { racha: result.streak, bonus: result.streakBonus || 0 }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎁 ¡Recompensa Diaria!')
      .setDescription(`Ganaste **${result.reward} Lagcoins** por tu login diario`)
      .addFields(
        { name: '🔥 Racha', value: `${result.streak} días seguidos`, inline: true }
      );

    if (result.streakBonus > 0) {
      embed.addFields({ name: '✨ Bonus de Racha', value: `+${result.streakBonus} Lagcoins`, inline: true });
    }

    embed.setFooter({ text: '¡Vuelve mañana para mantener tu racha!' });

    return interaction.reply({ embeds: [embed] });
  }
};
