import { SlashCommandBuilder } from 'discord.js';
import { CONFIG } from '../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rewards')
    .setDescription('Muestra las recompensas por nivel')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lista todas las recompensas de roles por nivel')
    ),
  
  async execute(interaction) {
    const fields = [];
    
    const roleInfo = {
      1: 'Rol Inicial',
      5: 'Rol Nivel 5',
      10: 'Rol Nivel 10',
      20: 'Rol Nivel 20',
      25: 'Miembro Activo',
      30: 'Rol Nivel 30',
      35: 'Miembro Super Activo',
      40: 'Rol Nivel 40',
      50: 'Rol Nivel 50',
      75: 'Rol Nivel 75',
      100: 'Rol Nivel 100'
    };
    
    for (const [level, roleId] of Object.entries(CONFIG.LEVEL_ROLES)) {
      const role = interaction.guild.roles.cache.get(roleId);
      const roleName = role ? role.name : roleInfo[level];
      
      fields.push({
        name: `🎯 Nivel ${level}`,
        value: role ? `<@&${roleId}>` : `ID: ${roleId}`,
        inline: true
      });
    }
    
    await interaction.reply({
      embeds: [{
        color: 0xFFD700,
        title: '🎁 Recompensas por Nivel',
        description: '¡Alcanza estos niveles para obtener roles especiales!',
        fields: fields,
        footer: { text: 'Sigue ganando XP para desbloquear más recompensas' },
        timestamp: new Date()
      }]
    });
  }
};
