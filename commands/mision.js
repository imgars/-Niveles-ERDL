import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserMissions, createUserMissions, getMissionsStats } from '../utils/mongoSync.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mision')
    .setDescription('Sistema de misiones semanales')
    .addSubcommand(subcommand =>
      subcommand
        .setName('empezar')
        .setDescription('Comienza tus misiones semanales')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Ve tus misiones de esta semana')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('progreso')
        .setDescription('Ve tu progreso en misiones')
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: 64 });
      
      const subcommand = interaction.options.getSubcommand();
      const weekNumber = Math.ceil((new Date().getDate()) / 7);
      const year = new Date().getFullYear();
      
      if (subcommand === 'empezar') {
        let missions = await getUserMissions(interaction.guildId, interaction.user.id, weekNumber, year);
        
        if (missions) {
          if (missions.completedCount === 10) {
            return interaction.editReply({ content: '✅ Ya has hecho todas las misiones semanales esta semana. ¡Vuelve la próxima!' });
          }
          return interaction.editReply({ content: '⚠️ Ya tienes misiones activas. Usa `/mision listar` para verlas' });
        }
        
        missions = await createUserMissions(interaction.guildId, interaction.user.id);
        if (!missions) {
          return interaction.editReply({ content: '❌ Error creando tus misiones - MongoDB no está disponible' });
        }

        logActivity({
          type: LOG_TYPES.MISSION_COMPLETE,
          userId: interaction.user.id,
          username: interaction.user.username,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name,
          command: 'mision empezar',
          importance: 'low',
          result: 'success',
          details: { estado: 'iniciadas', semana: weekNumber }
        });
        
        const embed = new EmbedBuilder()
          .setColor('#FF10F0')
          .setTitle('🎯 ¡Misiones Semanales Iniciadas!')
          .setDescription('Completa las 10 misiones esta semana para obtener grandes recompensas')
          .addFields(
            { name: '📊 Total de Misiones', value: '10 misiones disponibles' },
            { name: '⏰ Duración', value: 'Hasta el final de la semana' },
            { name: '🎁 Recompensas', value: 'XP, Multiplicadores, Niveles' }
          )
          .setFooter({ text: 'Usa /mision listar para ver tu lista completa' });
        
        return interaction.editReply({ embeds: [embed] });
      }
    
      if (subcommand === 'listar') {
        const missions = await getUserMissions(interaction.guildId, interaction.user.id, weekNumber, year);
        
        if (!missions) {
          return interaction.editReply({ content: '❌ No tienes misiones activas. Usa `/mision empezar` para comenzar' });
        }
        
        const missionList = missions.missions.map(m => {
          const status = m.completed ? '✅' : '⏳';
          const difficulty = '⭐'.repeat(m.difficulty);
          return `${status} **${m.title}** ${difficulty}\n${m.description}\nProgreso: ${m.progress}/${m.target}`;
        }).join('\n\n');
        
        const embed = new EmbedBuilder()
          .setColor('#39FF14')
          .setTitle('🎯 Tus Misiones Semanales')
          .setDescription(missionList)
          .addFields(
            { name: 'Completadas', value: `${missions.completedCount}/10` }
          );
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      if (subcommand === 'progreso') {
        const stats = await getMissionsStats(interaction.guildId, interaction.user.id, weekNumber, year);
        
        if (!stats) {
          return interaction.editReply({ content: '❌ No tienes misiones activas' });
        }
        
        const completed = stats.missions.filter(m => m.completed);
        const totalXP = completed.reduce((sum, m) => sum + m.reward.xp, 0);
        const totalMultiplier = completed.reduce((sum, m) => sum + m.reward.multiplier, 0);
        const totalLevels = completed.reduce((sum, m) => sum + m.reward.levels, 0);
        
        const embed = new EmbedBuilder()
          .setColor('#00FFFF')
          .setTitle('📊 Estadísticas de Misiones')
          .addFields(
            { name: 'Completadas', value: `${stats.completedCount}/10`, inline: true },
            { name: 'Faltantes', value: `${10 - stats.completedCount}/10`, inline: true },
            { name: 'XP Ganado', value: `${totalXP} XP`, inline: true },
            { name: 'Multiplicador', value: `${(totalMultiplier * 100).toFixed(0)}%`, inline: true },
            { name: 'Niveles', value: `+${totalLevels} niveles`, inline: true }
          );
        
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error en comando /mision:', error);
      if (interaction.deferred) {
        return interaction.editReply({ content: `❌ Error: ${error.message}` });
      }
      return interaction.reply({ content: `❌ Error: ${error.message}`, flags: 64 });
    }
  }
};
