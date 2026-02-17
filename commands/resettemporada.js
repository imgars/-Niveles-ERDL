import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';
import { isMongoConnected } from '../utils/mongoSync.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resettemporada')
    .setDescription('[Staff] Resetea todos los niveles y XP del servidor'),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', flags: 64 });
    }
    
    const warningEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ Advertencia - Reset de Temporada')
      .setDescription('**Estas a punto de resetear TODA la XP y niveles del servidor.**')
      .addFields(
        { name: '🗑️ Se eliminara:', value: '• XP de todos los usuarios\n• Niveles de todos los usuarios\n• Datos de la temporada anterior en MongoDB', inline: false },
        { name: '⚠️ Nota:', value: 'Esta accion es **irreversible** y afectara a **todos** los usuarios del servidor.', inline: false }
      )
      .setFooter({ text: 'Tienes 30 segundos para confirmar' })
      .setTimestamp();
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_season_reset')
          .setLabel('Confirmar Reset')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId('cancel_season_reset')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );
    
    const response = await interaction.reply({
      embeds: [warningEmbed],
      components: [row],
      flags: 64,
      fetchReply: true
    });
    
    const collector = response.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Solo quien ejecuto el comando puede confirmar.', flags: 64 });
      }
      
      if (i.customId === 'confirm_season_reset') {
        await i.update({
          embeds: [{
            color: 0xFFFF00,
            title: '⏳ Procesando...',
            description: 'Eliminando datos de la temporada. Por favor espera...'
          }],
          components: []
        });
        
        let mongoDeleted = 0;
        let localDeleted = 0;
        
        try {
          if (isMongoConnected()) {
            const User = mongoose.model('User');
            const result = await User.deleteMany({ guildId: interaction.guildId });
            mongoDeleted = result.deletedCount;
            console.log(`✅ Eliminados ${mongoDeleted} usuarios de MongoDB para nueva temporada`);
          }
        } catch (error) {
          console.error('Error eliminando usuarios de MongoDB:', error);
        }
        
        try {
          if (isMongoConnected()) {
            const Boost = mongoose.model('Boost');
            await Boost.deleteMany({});
            console.log('✅ Boosts eliminados de MongoDB');
          }
        } catch (error) {
          console.error('Error eliminando boosts:', error);
        }
        
        try {
          if (isMongoConnected()) {
            const Mission = mongoose.model('Mission');
            const missionResult = await Mission.deleteMany({ guildId: interaction.guildId });
            console.log(`✅ Eliminadas ${missionResult.deletedCount} misiones de MongoDB`);
          }
        } catch (error) {
          console.error('Error eliminando misiones:', error);
        }
        
        localDeleted = db.resetAllUsers(interaction.guildId);
        
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Temporada Reseteada')
          .setDescription('Todos los niveles y XP han sido reseteados exitosamente.')
          .addFields(
            { name: '📊 Datos Eliminados', value: `MongoDB: ${mongoDeleted} usuarios\nLocal: ${localDeleted || 'todos'} usuarios`, inline: true },
            { name: '👤 Ejecutado por', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setFooter({ text: 'Nueva temporada iniciada!' })
          .setTimestamp();
        
        await i.editReply({ embeds: [successEmbed], components: [] });
        
        try {
          const logChannel = await interaction.guild.channels.fetch('1441276918916710501');
          if (logChannel) {
            await logChannel.send({
              embeds: [{
                color: 0x00FF00,
                title: '🔄 Nueva Temporada Iniciada',
                description: `<@${interaction.user.id}> ha reseteado la temporada.\n\nTodos los niveles y XP han sido reiniciados.`,
                timestamp: new Date().toISOString()
              }]
            });
          }
        } catch (e) {
          console.error('Error enviando log:', e);
        }
        
        collector.stop();
      }
      
      if (i.customId === 'cancel_season_reset') {
        await i.update({
          embeds: [{
            color: 0x7289DA,
            title: '✅ Cancelado',
            description: 'El reset de temporada ha sido cancelado. No se elimino ningun dato.'
          }],
          components: []
        });
        
        collector.stop();
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [{
            color: 0x7289DA,
            title: '⏱️ Tiempo Agotado',
            description: 'No se confirmo a tiempo. No se elimino ningun dato.'
          }],
          components: []
        }).catch(() => {});
      }
    });
  }
};
