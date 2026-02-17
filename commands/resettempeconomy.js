import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import { isMongoConnected } from '../utils/mongoSync.js';
import fs from 'fs';
import path from 'path';

const STAFF_ROLE_ID = '1212891335929897030';

export default {
  data: new SlashCommandBuilder()
    .setName('resettempeconomy')
    .setDescription('[Staff] Elimina TODOS los datos de economia y casino de todos los usuarios'),
  
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ 
        content: '❌ No tienes permisos para usar este comando. Solo el staff puede usarlo.', 
        flags: 64 
      });
    }
    
    const warningEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ ADVERTENCIA CRITICA ⚠️')
      .setDescription('**Estas a punto de ELIMINAR PERMANENTEMENTE todos los datos de economia del servidor.**')
      .addFields(
        { name: '🗑️ Se eliminara:', value: '• Lagcoins de todos los usuarios\n• Saldos bancarios\n• Inventarios completos\n• Estadisticas de casino\n• Historial de transacciones\n• Power-ups activos\n• Nacionalidades\n• Seguros', inline: false },
        { name: '⚠️ Consecuencias:', value: '• **TODOS** los usuarios perderan su dinero\n• **TODOS** los items comprados se perderan\n• Esta accion **NO SE PUEDE DESHACER**', inline: false },
        { name: '❓ Confirmar', value: 'Escribe el codigo de confirmacion y presiona el boton para continuar.', inline: false }
      )
      .setFooter({ text: 'Esta accion es permanente e irreversible' })
      .setTimestamp();
    
    const confirmCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`economy_reset_confirm_${confirmCode}_${interaction.user.id}`)
      .setLabel(`Confirmar (Codigo: ${confirmCode})`)
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️');
    
    const cancelBtn = new ButtonBuilder()
      .setCustomId('economy_reset_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌');
    
    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);
    
    const response = await interaction.reply({
      embeds: [warningEmbed],
      components: [row],
      flags: 64,
      fetchReply: true
    });
    
    const collector = response.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Solo quien ejecuto el comando puede confirmar.', flags: 64 });
      }
      
      if (i.customId === 'economy_reset_cancel') {
        await i.update({
          embeds: [{
            color: 0x7289DA,
            title: '✅ Cancelado',
            description: 'El reset de economia ha sido cancelado. No se elimino ningun dato.'
          }],
          components: []
        });
        collector.stop();
        return;
      }
      
      if (i.customId.startsWith('economy_reset_confirm_')) {
        await i.update({
          embeds: [{
            color: 0xFFFF00,
            title: '⏳ Procesando...',
            description: 'Eliminando todos los datos de economia. Por favor espera...'
          }],
          components: []
        });
        
        let deletedMongo = 0;
        let deletedLocal = 0;
        
        try {
          if (isMongoConnected()) {
            const Economy = mongoose.model('Economy');
            const result = await Economy.deleteMany({ guildId: interaction.guildId });
            deletedMongo = result.deletedCount;
          }
        } catch (error) {
          console.error('Error eliminando economia de MongoDB:', error);
        }
        
        try {
          const economyFile = path.join('./data', 'economy.json');
          if (fs.existsSync(economyFile)) {
            const economyData = JSON.parse(fs.readFileSync(economyFile, 'utf8'));
            const keysToDelete = Object.keys(economyData).filter(key => key.startsWith(interaction.guildId));
            deletedLocal = keysToDelete.length;
            
            keysToDelete.forEach(key => delete economyData[key]);
            fs.writeFileSync(economyFile, JSON.stringify(economyData, null, 2));
          }
        } catch (error) {
          console.error('Error eliminando economia local:', error);
        }
        
        try {
          const powerupsFile = path.join('./data', 'powerups.json');
          if (fs.existsSync(powerupsFile)) {
            const powerupsData = JSON.parse(fs.readFileSync(powerupsFile, 'utf8'));
            const keysToDelete = Object.keys(powerupsData).filter(key => key.startsWith(interaction.guildId));
            keysToDelete.forEach(key => delete powerupsData[key]);
            fs.writeFileSync(powerupsFile, JSON.stringify(powerupsData, null, 2));
          }
        } catch (error) {
          console.error('Error eliminando powerups:', error);
        }
        
        try {
          const nationalitiesFile = path.join('./data', 'nationalities.json');
          if (fs.existsSync(nationalitiesFile)) {
            const natData = JSON.parse(fs.readFileSync(nationalitiesFile, 'utf8'));
            const keysToDelete = Object.keys(natData).filter(key => key.startsWith(interaction.guildId));
            keysToDelete.forEach(key => delete natData[key]);
            fs.writeFileSync(nationalitiesFile, JSON.stringify(natData, null, 2));
          }
        } catch (error) {
          console.error('Error eliminando nacionalidades:', error);
        }
        
        try {
          const insuranceFile = path.join('./data', 'insurance.json');
          if (fs.existsSync(insuranceFile)) {
            const insData = JSON.parse(fs.readFileSync(insuranceFile, 'utf8'));
            const keysToDelete = Object.keys(insData).filter(key => key.startsWith(interaction.guildId));
            keysToDelete.forEach(key => delete insData[key]);
            fs.writeFileSync(insuranceFile, JSON.stringify(insData, null, 2));
          }
        } catch (error) {
          console.error('Error eliminando seguros:', error);
        }
        
        try {
          const cooldownsFile = path.join('./data', 'casino_cooldowns.json');
          if (fs.existsSync(cooldownsFile)) {
            fs.writeFileSync(cooldownsFile, JSON.stringify({}, null, 2));
          }
        } catch (error) {
          console.error('Error eliminando cooldowns:', error);
        }
        
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Reset Completado')
          .setDescription('Todos los datos de economia han sido eliminados exitosamente.')
          .addFields(
            { name: '📊 Registros Eliminados', value: `MongoDB: ${deletedMongo}\nLocal: ${deletedLocal}`, inline: true },
            { name: '👤 Ejecutado por', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setFooter({ text: 'Nueva temporada de economia iniciada' })
          .setTimestamp();
        
        await i.editReply({ embeds: [successEmbed], components: [] });
        
        try {
          const logChannel = await interaction.guild.channels.fetch('1441276918916710501');
          if (logChannel) {
            await logChannel.send({
              embeds: [{
                color: 0xFF0000,
                title: '🗑️ Reset de Economia Ejecutado',
                description: `<@${interaction.user.id}> ha reseteado toda la economia del servidor.`,
                fields: [
                  { name: 'Registros eliminados', value: `${deletedMongo + deletedLocal} en total` }
                ],
                timestamp: new Date().toISOString()
              }]
            });
          }
        } catch (e) {
          console.error('Error enviando log:', e);
        }
        
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
