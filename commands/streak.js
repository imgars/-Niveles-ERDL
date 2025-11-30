import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getStreakBetween, saveStreakToMongo, getUserStreaks } from '../utils/mongoSync.js';

export const data = new SlashCommandBuilder()
  .setName('racha')
  .setDescription('Gestiona tus rachas')
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
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'crear') {
    const targetUser = interaction.options.getUser('usuario');
    
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes crear una racha contigo mismo', ephemeral: true });
    }
    
    if (targetUser.bot) {
      return interaction.reply({ content: '❌ No puedes crear una racha con un bot', ephemeral: true });
    }
    
    const existingStreak = await getStreakBetween(interaction.guildId, interaction.user.id, targetUser.id);
    if (existingStreak && existingStreak.status === 'active') {
      return interaction.reply({ content: `⚠️ Ya tienen una racha activa de ${existingStreak.streakCount} días`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FF10F0')
      .setTitle('🔥 ¡Propuesta de Racha!')
      .setDescription(`${interaction.user.username} quiere crear una racha contigo`)
      .addFields(
        { name: '¿Qué es una racha?', value: 'Si ambos se mandan un mensaje al día, la racha crece. Si un día no hablan, se pierde.' },
        { name: 'Propuesto por', value: interaction.user.username }
      )
      .setThumbnail(interaction.user.displayAvatarURL());
    
    const acceptBtn = new ButtonBuilder()
      .setCustomId(`accept_streak_${interaction.user.id}`)
      .setLabel('Aceptar')
      .setStyle(ButtonStyle.Success);
    
    const rejectBtn = new ButtonBuilder()
      .setCustomId('reject_streak')
      .setLabel('Rechazar')
      .setStyle(ButtonStyle.Danger);
    
    const row = new ActionRowBuilder().addComponents(acceptBtn, rejectBtn);
    
    await interaction.reply({ 
      content: targetUser.toString(),
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });
  }
  
  if (subcommand === 'ver') {
    const userStreaks = await getUserStreaks(interaction.guildId, interaction.user.id);
    
    if (userStreaks.length === 0) {
      return interaction.reply({ content: '📊 No tienes rachas activas', ephemeral: true });
    }
    
    const streakList = userStreaks.map(s => {
      const otherUserId = s.user1Id === interaction.user.id ? s.user2Id : s.user1Id;
      const lastDate = new Date(s.lastMessageDate);
      return `<@${otherUserId}>: **${s.streakCount} días** 🔥 (última: ${lastDate.toLocaleDateString('es-ES')})`;
    }).join('\n');
    
    const embed = new EmbedBuilder()
      .setColor('#39FF14')
      .setTitle('🔥 Tus Rachas Activas')
      .setDescription(streakList || 'No tienes rachas activas')
      .setFooter({ text: 'Mensajea a tu compañero todos los días para mantener la racha' });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (subcommand === 'usuario') {
    const targetUser = interaction.options.getUser('usuario');
    const userStreaks = await getUserStreaks(interaction.guildId, targetUser.id);
    
    if (userStreaks.length === 0) {
      return interaction.reply({ content: `📊 ${targetUser.username} no tiene rachas activas`, ephemeral: true });
    }
    
    const streakList = userStreaks.map(s => {
      const otherUserId = s.user1Id === targetUser.id ? s.user2Id : s.user1Id;
      const lastDate = new Date(s.lastMessageDate);
      return `<@${otherUserId}>: **${s.streakCount} días** 🔥 (última: ${lastDate.toLocaleDateString('es-ES')})`;
    }).join('\n');
    
    const embed = new EmbedBuilder()
      .setColor('#39FF14')
      .setTitle(`🔥 Rachas de ${targetUser.username}`)
      .setDescription(streakList)
      .setThumbnail(targetUser.displayAvatarURL());
    
    return interaction.reply({ embeds: [embed] });
  }
}
