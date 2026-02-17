import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { doWork, getUserEconomy, JOBS } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

const jobChoices = Object.entries(JOBS).map(([id, job]) => ({
  name: `${job.emoji} ${job.name}`,
  value: id
}));

export default {
  data: new SlashCommandBuilder()
    .setName('trabajar')
    .setDescription('Trabaja para ganar Lagcoins')
    .addStringOption(option =>
      option.setName('trabajo')
        .setDescription('Tipo de trabajo')
        .addChoices(...jobChoices)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const jobId = interaction.options.getString('trabajo') || 'basico';
    
    try {
      const result = await doWork(interaction.guildId, interaction.user.id, jobId);

      if (result.error === 'cooldown') {
        return interaction.editReply(`⏳ Debes esperar **${result.remaining} segundos** para trabajar de nuevo`);
      }

      if (result.error === 'missing_items') {
        const neededItems = result.needed.map(id => JOBS[id]?.name || id).join(', ');
        return interaction.editReply(`❌ Necesitas los siguientes items para este trabajo: **${neededItems}**\n\nUsa \`/tienda\` para comprarlos.`);
      }

      if (result.error === 'invalid_job') {
        return interaction.editReply('❌ Trabajo no válido');
      }

      logActivity({
        type: LOG_TYPES.WORK,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'trabajar',
        commandOptions: { trabajo: result.job.name },
        amount: result.total,
        balanceAfter: result.newBalance,
        importance: 'low',
        result: 'success',
        details: { trabajo: result.job.name, ganancia: result.earnings, bonus: result.bonus || 0 }
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${result.job.emoji} ¡Trabajo Completado!`)
        .setDescription(`Trabajaste como **${result.job.name}**`)
        .addFields(
          { name: '💵 Ganancia Base', value: `${result.earnings} Lagcoins`, inline: true }
        );

      if (result.bonus > 0) {
        embed.addFields({ name: '🎁 Bonus', value: `+${result.bonus} Lagcoins`, inline: true });
      }

      embed.addFields(
        { name: '💰 Total Ganado', value: `${result.total} Lagcoins`, inline: true },
        { name: '🏦 Saldo Actual', value: `${result.newBalance || 0} Lagcoins`, inline: false }
      );

      embed.setFooter({ text: `Cooldown: ${Math.round((result.job.cooldown || 60000) / 1000)}s` });

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en trabajar:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Error al trabajar', flags: 64 });
      } else {
        return interaction.editReply('❌ Error al trabajar');
      }
    }
  }
};
