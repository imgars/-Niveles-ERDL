import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserEconomy, JOBS, ITEMS, doWork } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja con los items que tienes disponibles'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      const userItems = economy.items || [];
      
      const availableJobs = Object.entries(JOBS).filter(([jobId, job]) => {
        if (job.itemsNeeded.length === 0) return true;
        return job.itemsNeeded.every(itemId => userItems.includes(itemId));
      });
      
      if (availableJobs.length === 0) {
        return interaction.editReply({
          embeds: [{
            color: 0xFF0000,
            title: '❌ Sin trabajos disponibles',
            description: 'No tienes los items necesarios para ningún trabajo.\n\nUsa `/tienda` para comprar herramientas.',
            fields: [
              { name: '🛒 Trabajos básicos', value: 'El trabajo básico no requiere items', inline: false }
            ]
          }]
        });
      }
      
      const jobList = availableJobs.map(([jobId, job]) => {
        const itemsText = job.itemsNeeded.length > 0 
          ? job.itemsNeeded.map(id => ITEMS[id]?.emoji || '📦').join(' ')
          : '🆓 Sin items';
        return `${job.emoji} **${job.name}** - ${job.minEarnings}-${job.maxEarnings} LC\n  Items: ${itemsText}`;
      }).join('\n\n');
      
      const selectOptions = availableJobs.slice(0, 25).map(([jobId, job]) => ({
        label: job.name,
        value: jobId,
        emoji: job.emoji,
        description: `${job.minEarnings}-${job.maxEarnings} Lagcoins`
      }));
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('work_select')
        .setPlaceholder('Selecciona un trabajo')
        .addOptions(selectOptions);
      
      const quickWorkBtn = new ButtonBuilder()
        .setCustomId('quick_work')
        .setLabel('Trabajo Rápido (Básico)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💼');
      
      const row1 = new ActionRowBuilder().addComponents(selectMenu);
      const row2 = new ActionRowBuilder().addComponents(quickWorkBtn);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💼 Trabajos Disponibles')
        .setDescription(`Tienes **${availableJobs.length}** trabajos disponibles:\n\n${jobList}`)
        .setFooter({ text: 'Selecciona un trabajo del menú o haz trabajo rápido' });
      
      const response = await interaction.editReply({
        embeds: [embed],
        components: [row1, row2]
      });
      
      const collector = response.createMessageComponentCollector({
        time: 60000
      });
      
      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ Este menú no es para ti', flags: 64 });
        }
        
        let jobId = 'basico';
        
        if (i.customId === 'work_select') {
          jobId = i.values[0];
        }
        
        await i.deferUpdate();
        
        const result = await doWork(interaction.guildId, interaction.user.id, jobId);
        
        if (result.error === 'cooldown') {
          await interaction.editReply({
            embeds: [{
              color: 0xFFAA00,
              title: '⏳ Cooldown',
              description: `Debes esperar **${result.remaining} segundos** para trabajar de nuevo.`
            }],
            components: []
          });
          return;
        }
        
        if (result.error) {
          await interaction.editReply({
            embeds: [{
              color: 0xFF0000,
              title: '❌ Error',
              description: result.error
            }],
            components: []
          });
          return;
        }

        // Log de economía
        try {
          const { sendEconomyLog } = await import('../index.js');
          await sendEconomyLog(interaction.client, interaction, 'Trabajo', result.total, `Trabajó como **${result.job.name}**\nGanancia: ${result.earnings}\nBonus: ${result.bonus || 0}`);
        } catch (e) {
          console.error('Error enviando log de economía en work:', e);
        }

        logActivity({
          type: LOG_TYPES.WORK,
          userId: interaction.user.id,
          username: interaction.user.username,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name,
          command: 'work',
          commandOptions: { trabajo: result.job.name },
          amount: result.total,
          balanceAfter: result.newBalance,
          importance: 'low',
          result: 'success',
          details: { trabajo: result.job.name, ganancia: result.earnings, bonus: result.bonus || 0 }
        });
        
        const resultEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`${result.job.emoji} ¡Trabajo Completado!`)
          .setDescription(`Trabajaste como **${result.job.name}**`)
          .addFields(
            { name: '💵 Ganancia', value: `${result.earnings} Lagcoins`, inline: true },
            { name: '🎁 Bonus', value: `+${result.bonus || 0} Lagcoins`, inline: true },
            { name: '💰 Total', value: `${result.total} Lagcoins`, inline: true },
            { name: '🏦 Saldo', value: `${result.newBalance || 0} Lagcoins`, inline: false }
          )
          .setFooter({ text: `Cooldown: ${Math.round((result.job.cooldown || 60000) / 1000)}s` });
        
        await interaction.editReply({
          embeds: [resultEmbed],
          components: []
        });
      });
      
      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (e) {}
      });
      
    } catch (error) {
      console.error('Error en work:', error);
      return interaction.editReply('❌ Error al cargar los trabajos');
    }
  }
};
