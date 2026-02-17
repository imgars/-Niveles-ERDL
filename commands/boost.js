import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isStaff, formatDuration } from '../utils/helpers.js';
import { getNightBoostStatus } from '../utils/timeBoost.js';
import { getAdminBoost } from '../utils/economyDB.js';

function filterActiveBoosts(boosts) {
  const now = Date.now();
  return boosts.filter(b => !b.expiresAt || b.expiresAt > now);
}

export default {
  data: new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Gestiona los boosts de XP')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('[Staff] Añade un boost')
        .addIntegerOption(option =>
          option.setName('multiplicador')
            .setDescription('Valor del multiplicador (100=x1, 150=x1.5, 200=x2)')
            .setRequired(true)
            .setMinValue(101)
        )
        .addIntegerOption(option =>
          option.setName('duracion')
            .setDescription('Duración en minutos (0 = permanente)')
            .setRequired(true)
            .setMinValue(0)
        )
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario a boostear')
            .setRequired(false)
        )
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal a boostear')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Ver lista de boosts activos')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Ver el estado de todos los boosts')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'add') {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', flags: 64 });
      }
      
      const user = interaction.options.getUser('usuario');
      const channel = interaction.options.getChannel('canal');
      const multiplier = interaction.options.getInteger('multiplicador');
      const duration = interaction.options.getInteger('duracion');
      
      if (!user && !channel) {
        return interaction.reply({ content: '❌ Debes especificar un usuario o un canal.', flags: 64 });
      }
      
      const durationMs = duration > 0 ? duration * 60 * 1000 : null;
      const boostPercent = multiplier - 100;
      const description = `Boost de ${boostPercent}%${duration > 0 ? ` por ${duration} minutos` : ' permanente'}`;
      
      if (user) {
        db.addBoost('user', user.id, multiplier, durationMs, description);
        return interaction.reply({
          embeds: [{
            color: 0xFFD700,
            title: '✅ Boost Añadido',
            description: `Boost de **${boostPercent}%** (x${(multiplier/100).toFixed(2)}) añadido a <@${user.id}>`,
            fields: [{ name: 'Duración', value: duration > 0 ? `${duration} minutos` : 'Permanente' }]
          }]
        });
      }
      
      if (channel) {
        db.addBoost('channel', channel.id, multiplier, durationMs, description);
        return interaction.reply({
          embeds: [{
            color: 0xFFD700,
            title: '✅ Boost Añadido',
            description: `Boost de **${boostPercent}%** (x${(multiplier/100).toFixed(2)}) añadido a <#${channel.id}>`,
            fields: [{ name: 'Duración', value: duration > 0 ? `${duration} minutos` : 'Permanente' }]
          }]
        });
      }
    }
    
    if (subcommand === 'list') {
      const now = Date.now();
      const fields = [];
      
      const activeGlobal = filterActiveBoosts(db.boosts.global || []);
      if (activeGlobal.length > 0) {
        const globalList = activeGlobal.map(b => {
          const remaining = b.expiresAt ? ` (${formatDuration(b.expiresAt - now)})` : ' (Permanente)';
          return `• ${b.description}${remaining}`;
        }).join('\n');
        fields.push({ name: '🌍 Boosts Globales', value: globalList });
      }
      
      const userBoosts = [];
      for (const [userId, boosts] of Object.entries(db.boosts.users || {})) {
        const activeBoosts = filterActiveBoosts(boosts);
        for (const boost of activeBoosts) {
          const remaining = boost.expiresAt ? ` (${formatDuration(boost.expiresAt - now)})` : '';
          userBoosts.push(`<@${userId}>: ${boost.description}${remaining}`);
        }
      }
      if (userBoosts.length > 0) {
        fields.push({ name: '👤 Boosts de Usuarios', value: userBoosts.slice(0, 10).join('\n') });
      }
      
      const channelBoosts = [];
      for (const [channelId, boosts] of Object.entries(db.boosts.channels || {})) {
        const activeBoosts = filterActiveBoosts(boosts);
        for (const boost of activeBoosts) {
          const remaining = boost.expiresAt ? ` (${formatDuration(boost.expiresAt - now)})` : '';
          channelBoosts.push(`<#${channelId}>: ${boost.description}${remaining}`);
        }
      }
      if (channelBoosts.length > 0) {
        fields.push({ name: '📺 Boosts de Canales', value: channelBoosts.slice(0, 10).join('\n') });
      }
      
      const nightStatus = getNightBoostStatus();
      if (nightStatus.active) {
        fields.push({
          name: '🌙 Boost Nocturno',
          value: `+${Math.floor(nightStatus.multiplier * 100)}% (Automático 18:00-06:00 VE)`
        });
      }
      
      const adminBoost = getAdminBoost();
      if (adminBoost) {
        const remaining = formatDuration(adminBoost.expiresAt - now);
        fields.push({
          name: '⚡ Boost de Admin',
          value: `+${Math.floor(adminBoost.percentage * 100)}% (${remaining})`
        });
      }
      
      if (fields.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x7289DA)
          .setTitle('📊 Lista de Boosts')
          .setDescription('No hay boosts activos actualmente.\n\n*El boost nocturno se activa automáticamente de 18:00 a 06:00 (Venezuela).*');
        return interaction.reply({ embeds: [embed] });
      }
      
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('📊 Lista de Boosts Activos')
        .setDescription('Todos los boosts activos en el servidor:')
        .addFields(fields)
        .setFooter({ text: 'Los boosts son acumulativos' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'status') {
      const nightStatus = getNightBoostStatus();
      const fields = [];
      
      if (nightStatus.active) {
        fields.push({
          name: '🌙 Boost Nocturno',
          value: `Activo (+${Math.floor(nightStatus.multiplier * 100)}%)\nHorario: Venezuela (18:00 - 06:00)`,
          inline: false
        });
      } else {
        fields.push({
          name: '☀️ Boost Nocturno',
          value: 'Inactivo\nSe activará a las 18:00 (Venezuela)',
          inline: false
        });
      }
      
      const activeGlobal = filterActiveBoosts(db.boosts.global || []);
      if (activeGlobal.length > 0) {
        const globalBoost = activeGlobal[0];
        const remaining = globalBoost.expiresAt ? formatDuration(globalBoost.expiresAt - Date.now()) : 'Permanente';
        fields.push({
          name: '🌍 Boost Global',
          value: `${globalBoost.description}\nDuración restante: ${remaining}`,
          inline: false
        });
      }
      
      const adminBoost = getAdminBoost();
      if (adminBoost) {
        const remaining = formatDuration(adminBoost.expiresAt - Date.now());
        fields.push({
          name: '⚡ Boost de Admin',
          value: `+${Math.floor(adminBoost.percentage * 100)}%\nDuración restante: ${remaining}`,
          inline: false
        });
      }
      
      let totalUserBoosts = 0;
      let totalChannelBoosts = 0;
      
      for (const boosts of Object.values(db.boosts.users || {})) {
        totalUserBoosts += filterActiveBoosts(boosts).length;
      }
      for (const boosts of Object.values(db.boosts.channels || {})) {
        totalChannelBoosts += filterActiveBoosts(boosts).length;
      }
      
      if (totalUserBoosts > 0 || totalChannelBoosts > 0) {
        fields.push({
          name: '📊 Boosts Individuales',
          value: `👤 Usuarios: ${totalUserBoosts}\n📺 Canales: ${totalChannelBoosts}`,
          inline: false
        });
      }
      
      return interaction.reply({
        embeds: [{
          color: 0x7289DA,
          title: '📊 Estado de Boosts',
          description: '**Nota:** Los boosts son acumulativos',
          fields: fields,
          footer: { text: 'Usa /boost list para ver detalles' }
        }]
      });
    }
  }
};
