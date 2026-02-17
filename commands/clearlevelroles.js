import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CONFIG } from '../config.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearlevelroles')
    .setDescription('[Staff] Quita TODOS los roles de nivel a TODOS los usuarios'),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_clear_roles')
          .setLabel('Confirmar Limpieza')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_clear_roles')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const response = await interaction.reply({
      embeds: [{
        color: 0xFF0000,
        title: '⚠️ Advertencia Peligrosa',
        description: '**¿Estás seguro de que quieres quitar TODOS los roles de nivel a TODOS los usuarios?**\n\nEsta acción quitará todos los roles de recompensa configurados.\n**Esta acción es irreversible.**'
      }],
      components: [row],
      ephemeral: true
    });
    
    const collector = response.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Solo quien ejecutó el comando puede confirmar.', ephemeral: true });
      }
      
      if (i.customId === 'confirm_clear_roles') {
        await i.update({
          embeds: [{
            color: 0xFFD700,
            title: '⏳ Procesando...',
            description: 'Quitando roles de todos los miembros...'
          }],
          components: []
        });
        
        let removedCount = 0;
        const levelRoleIds = Object.values(CONFIG.LEVEL_ROLES);
        
        try {
          const members = await interaction.guild.members.fetch();
          
          for (const member of members.values()) {
            for (const roleId of levelRoleIds) {
              if (member.roles.cache.has(roleId)) {
                try {
                  await member.roles.remove(roleId);
                  removedCount++;
                } catch (error) {
                  console.error(`Error removing role from ${member.user.tag}:`, error);
                }
              }
            }
          }
          
          await i.editReply({
            embeds: [{
              color: 0x43B581,
              title: '✅ Roles Limpiados',
              description: `Se han quitado **${removedCount} roles** de nivel de todos los usuarios.`
            }],
            components: []
          });
        } catch (error) {
          console.error('Error clearing roles:', error);
          await i.editReply({
            embeds: [{
              color: 0xF04747,
              title: '❌ Error',
              description: 'Hubo un error al quitar los roles.'
            }],
            components: []
          });
        }
        
        collector.stop();
      }
      
      if (i.customId === 'cancel_clear_roles') {
        await i.update({
          embeds: [{
            color: 0x7289DA,
            title: 'Cancelado',
            description: 'La limpieza de roles ha sido cancelada.'
          }],
          components: []
        });
        
        collector.stop();
      }
    });
  }
};
