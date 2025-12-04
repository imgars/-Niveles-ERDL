import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { activateAdminBoost, deactivateAdminBoost, getAdminBoost } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comandos de administración')
    .addSubcommand(subcommand =>
      subcommand
        .setName('abuse')
        .setDescription('(Staff) Impulsar TODOS los sistemas del bot')
        .addIntegerOption(option =>
          option.setName('porcentaje')
            .setDescription('Porcentaje de boost (1-500%)')
            .setMinValue(1)
            .setMaxValue(500)
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('duracion')
            .setDescription('Duración en minutos')
            .setMinValue(1)
            .setMaxValue(1440)
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('economia')
            .setDescription('Incluir sistema de economía')
        )
        .addBooleanOption(option =>
          option.setName('casino')
            .setDescription('Incluir sistema de casino')
        )
        .addBooleanOption(option =>
          option.setName('niveles')
            .setDescription('Incluir sistema de niveles')
        )
        .addBooleanOption(option =>
          option.setName('trabajo')
            .setDescription('Incluir sistema de trabajo')
        )
        .addBooleanOption(option =>
          option.setName('robo')
            .setDescription('Incluir sistema de robo')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Ver el estado del boost de admin activo')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stop')
        .setDescription('(Staff) Detener el boost de admin activo')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'abuse') {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
      }
      
      const percentage = interaction.options.getInteger('porcentaje');
      const duration = interaction.options.getInteger('duracion');
      const economy = interaction.options.getBoolean('economia') ?? true;
      const casino = interaction.options.getBoolean('casino') ?? true;
      const levels = interaction.options.getBoolean('niveles') ?? true;
      const work = interaction.options.getBoolean('trabajo') ?? true;
      const rob = interaction.options.getBoolean('robo') ?? true;
      
      const boost = activateAdminBoost(percentage, duration, {
        economy,
        casino,
        levels,
        work,
        rob
      });
      
      const systems = [];
      if (boost.systems.economy) systems.push('💰 Economía');
      if (boost.systems.casino) systems.push('🎰 Casino');
      if (boost.systems.levels) systems.push('⭐ Niveles');
      if (boost.systems.work) systems.push('💼 Trabajo');
      if (boost.systems.rob) systems.push('🥷 Robo');
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔥 ¡ADMIN ABUSE ACTIVADO!')
        .setDescription(`¡Se ha activado un boost masivo del **${percentage}%** por **${duration} minutos**!`)
        .addFields(
          { name: '📊 Porcentaje', value: `+${percentage}%`, inline: true },
          { name: '⏱️ Duración', value: `${duration} minutos`, inline: true },
          { name: '🎯 Sistemas Afectados', value: systems.join('\n') || 'Ninguno' }
        )
        .setFooter({ text: `Activado por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'status') {
      const boost = getAdminBoost();
      
      if (!boost) {
        return interaction.reply({ content: '❌ No hay ningún boost de admin activo', flags: 64 });
      }
      
      const remainingMs = boost.expiresAt - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      
      const systems = [];
      if (boost.systems.economy) systems.push('💰 Economía');
      if (boost.systems.casino) systems.push('🎰 Casino');
      if (boost.systems.levels) systems.push('⭐ Niveles');
      if (boost.systems.work) systems.push('💼 Trabajo');
      if (boost.systems.rob) systems.push('🥷 Robo');
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 Estado del Admin Abuse')
        .addFields(
          { name: '📊 Porcentaje', value: `+${Math.round(boost.percentage * 100)}%`, inline: true },
          { name: '⏱️ Tiempo Restante', value: `${remainingMinutes} minutos`, inline: true },
          { name: '🎯 Sistemas Afectados', value: systems.join('\n') || 'Ninguno' }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'stop') {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
      }
      
      const boost = getAdminBoost();
      if (!boost) {
        return interaction.reply({ content: '❌ No hay ningún boost de admin activo', flags: 64 });
      }
      
      deactivateAdminBoost();
      
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Admin Abuse Desactivado')
            .setDescription('El boost de admin ha sido desactivado.')
            .setFooter({ text: `Desactivado por: ${interaction.user.tag}` })
            .setTimestamp()
        ]
      });
    }
  }
};
