import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { 
  createStreakRequest, 
  acceptStreakRequest, 
  rejectStreakRequest, 
  getUserStreaks, 
  getStreakBetween,
  getStreakStats,
  getStreakLeaderboard,
  deleteStreak
} from '../utils/streakService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('racha')
    .setDescription('Sistema de rachas entre usuarios')
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('Crea una racha con otro usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario con el que crear la racha')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ve tus rachas activas')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('usuario')
        .setDescription('Ve las rachas de un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario del que ver rachas')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('estadisticas')
        .setDescription('Ve tus estadisticas de rachas')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ranking')
        .setDescription('Ve el ranking de rachas del servidor')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('terminar')
        .setDescription('Termina una racha con un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario con el que terminar la racha')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'crear') {
      const targetUser = interaction.options.getUser('usuario');
      
      if (targetUser.id === interaction.user.id) {
        return interaction.reply({ content: '❌ No puedes crear una racha contigo mismo', flags: 64 });
      }
      
      if (targetUser.bot) {
        return interaction.reply({ content: '❌ No puedes crear una racha con un bot', flags: 64 });
      }
      
      const existingStreak = await getStreakBetween(interaction.guildId, interaction.user.id, targetUser.id);
      if (existingStreak) {
        if (existingStreak.status === 'active') {
          return interaction.reply({ 
            content: `⚠️ Ya tienen una racha activa de **${existingStreak.streakCount} dias**`, 
            flags: 64 
          });
        }
        if (existingStreak.status === 'pending') {
          return interaction.reply({ 
            content: '⚠️ Ya existe una solicitud de racha pendiente entre ustedes', 
            flags: 64 
          });
        }
      }
      
      const result = await createStreakRequest(interaction.guildId, interaction.user.id, targetUser.id);
      
      if (result.error) {
        const errorMessages = {
          'database_unavailable': '❌ Base de datos no disponible',
          'pending_request_exists': '⚠️ Ya existe una solicitud pendiente',
          'streak_already_active': '⚠️ Ya tienen una racha activa',
          'system_error': '❌ Error del sistema'
        };
        return interaction.reply({ content: errorMessages[result.error] || '❌ Error desconocido', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FF10F0')
        .setTitle('🔥 Propuesta de Racha!')
        .setDescription(`**${interaction.user.username}** quiere crear una racha contigo, ${targetUser.username}!`)
        .addFields(
          { 
            name: '❓ Que es una racha?', 
            value: 'Si ambos se mandan **al menos un mensaje cada dia**, la racha crece. Si pasa un dia sin que ambos hablen, se pierde la racha.' 
          },
          { 
            name: '🏆 Recompensas', 
            value: 'Mantener rachas largas te da prestigio en el servidor!' 
          },
          { 
            name: '👤 Propuesto por', 
            value: interaction.user.username, 
            inline: true 
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'La solicitud expira en 24 horas' })
        .setTimestamp();
      
      const acceptBtn = new ButtonBuilder()
        .setCustomId(`streak_accept_${interaction.user.id}_${targetUser.id}`)
        .setLabel('Aceptar')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');
      
      const rejectBtn = new ButtonBuilder()
        .setCustomId(`streak_reject_${interaction.user.id}_${targetUser.id}`)
        .setLabel('Rechazar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');
      
      const row = new ActionRowBuilder().addComponents(acceptBtn, rejectBtn);
      
      await interaction.reply({ 
        content: `<@${targetUser.id}> tienes una propuesta de racha!`,
        embeds: [embed], 
        components: [row]
      });
    }
    
    if (subcommand === 'ver') {
      const userStreaks = await getUserStreaks(interaction.guildId, interaction.user.id);
      
      if (userStreaks.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#7289DA')
          .setTitle('🔥 Tus Rachas')
          .setDescription('No tienes rachas activas.\n\nUsa `/racha crear @usuario` para crear una!')
          .setFooter({ text: 'Las rachas se rompen si no hablan ambos en un dia' });
        
        return interaction.reply({ embeds: [embed], flags: 64 });
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const streakList = userStreaks.map(s => {
        const myMessageToday = s.myLastMessage && new Date(s.myLastMessage).toISOString().split('T')[0] === today;
        const partnerMessageToday = s.partnerLastMessage && new Date(s.partnerLastMessage).toISOString().split('T')[0] === today;
        
        let status = '';
        if (myMessageToday && partnerMessageToday) {
          status = '✅ Completado hoy';
        } else if (myMessageToday) {
          status = '⏳ Esperando a tu compañero';
        } else if (partnerMessageToday) {
          status = '⚠️ Tu turno de hablar!';
        } else {
          status = '🔴 Ambos deben hablar hoy!';
        }
        
        return `<@${s.partnerId}>: **${s.streakCount} dias** 🔥\n└ ${status}`;
      }).join('\n\n');
      
      const embed = new EmbedBuilder()
        .setColor('#39FF14')
        .setTitle('🔥 Tus Rachas Activas')
        .setDescription(streakList)
        .setFooter({ text: 'Hablen todos los dias para mantener la racha!' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    
    if (subcommand === 'usuario') {
      const targetUser = interaction.options.getUser('usuario');
      const userStreaks = await getUserStreaks(interaction.guildId, targetUser.id);
      
      if (userStreaks.length === 0) {
        return interaction.reply({ 
          content: `📊 **${targetUser.username}** no tiene rachas activas`, 
          flags: 64 
        });
      }
      
      const streakList = userStreaks.map(s => {
        return `<@${s.partnerId}>: **${s.streakCount} dias** 🔥`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#39FF14')
        .setTitle(`🔥 Rachas de ${targetUser.username}`)
        .setDescription(streakList)
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `${userStreaks.length} racha(s) activa(s)` });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'estadisticas') {
      const stats = await getStreakStats(interaction.guildId, interaction.user.id);
      
      if (!stats) {
        return interaction.reply({ content: '❌ No se pudieron obtener las estadisticas', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`📊 Estadisticas de Rachas - ${interaction.user.username}`)
        .addFields(
          { name: '🔥 Rachas Activas', value: `${stats.activeCount}`, inline: true },
          { name: '💔 Rachas Rotas', value: `${stats.brokenCount}`, inline: true },
          { name: '📈 Racha Mas Larga', value: `${stats.longestStreak} dias`, inline: true },
          { name: '📅 Total Dias Acumulados', value: `${stats.totalDays} dias`, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'ranking') {
      const leaderboard = await getStreakLeaderboard(interaction.guildId, 10);
      
      if (leaderboard.length === 0) {
        return interaction.reply({ 
          content: '📊 No hay rachas activas en el servidor', 
          flags: 64 
        });
      }
      
      const medals = ['🥇', '🥈', '🥉'];
      
      const rankingList = leaderboard.map((s, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${s.user1Id}> & <@${s.user2Id}>: **${s.streakCount} dias** 🔥`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Ranking de Rachas')
        .setDescription(rankingList)
        .setFooter({ text: 'Las mejores rachas del servidor' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'terminar') {
      const targetUser = interaction.options.getUser('usuario');
      
      const streak = await getStreakBetween(interaction.guildId, interaction.user.id, targetUser.id);
      
      if (!streak || streak.status !== 'active') {
        return interaction.reply({ 
          content: '❌ No tienes una racha activa con ese usuario', 
          flags: 64 
        });
      }
      
      const confirmBtn = new ButtonBuilder()
        .setCustomId(`streak_end_confirm_${interaction.user.id}_${targetUser.id}`)
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger);
      
      const cancelBtn = new ButtonBuilder()
        .setCustomId(`streak_end_cancel`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary);
      
      const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);
      
      const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('⚠️ Terminar Racha')
        .setDescription(`Estas seguro de que quieres terminar la racha con <@${targetUser.id}>?\n\n**Racha actual:** ${streak.streakCount} dias 🔥\n\nEsta accion no se puede deshacer.`);
      
      return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }
  }
};
