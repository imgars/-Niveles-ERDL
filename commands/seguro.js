import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserInsurance, activateInsurance, deactivateInsurance, ITEMS, buyItem, getUserEconomy } from '../utils/economyDB.js';
import { CONFIG } from '../config.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

const INSURANCE_COOLDOWN = 7200000; // 2 horas entre activaciones

export default {
  data: new SlashCommandBuilder()
    .setName('seguro')
    .setDescription('Sistema de seguro anti-robos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('activar')
        .setDescription('Activar un seguro anti-robos')
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo de seguro a activar')
            .setRequired(true)
            .addChoices(
              { name: '🔒 Básico (50% protección, 2h) - 800 Lagcoins', value: 'seguro_basico' },
              { name: '🔒🔒 Avanzado (75% protección, 2h) - 2,000 Lagcoins', value: 'seguro_avanzado' },
              { name: '🔐 Premium (90% protección, 1h) - 5,000 Lagcoins', value: 'seguro_premium' },
              { name: '🛡️✨ Total (100% protección, 15min) - 15,000 Lagcoins', value: 'seguro_total' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('desactivar')
        .setDescription('Desactivar tu seguro anti-robos activo')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('estado')
        .setDescription('Ver el estado de tu seguro anti-robos')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'activar') {
      const tipo = interaction.options.getString('tipo');
      const item = ITEMS[tipo];
      
      if (!item || !item.effect) {
        return interaction.reply({ content: '❌ Tipo de seguro no válido', flags: 64 });
      }
      
      // Verificar si ya tiene un seguro activo
      const currentInsurance = getUserInsurance(interaction.guildId, interaction.user.id);
      if (currentInsurance) {
        const remainingMs = currentInsurance.expiresAt - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return interaction.reply({ 
          content: `❌ Ya tienes un seguro activo (${Math.round(currentInsurance.protection * 100)}% de protección). Te quedan **${remainingMinutes} minutos**.`,
          flags: 64 
        });
      }
      
      // Verificar fondos
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      if ((economy.lagcoins || 0) < item.price) {
        return interaction.reply({ 
          content: `❌ No tienes suficientes Lagcoins. Necesitas **${item.price}** pero tienes **${economy.lagcoins || 0}**`,
          flags: 64 
        });
      }
      
      // Comprar y activar el seguro
      const result = await buyItem(interaction.guildId, interaction.user.id, tipo);
      
      if (result.error) {
        return interaction.reply({ content: `❌ Error al activar el seguro: ${result.error}`, flags: 64 });
      }
      
      const durationMinutes = Math.round(item.effect.duration / 60000);
      const protectionPercent = Math.round(item.effect.value * 100);

      logActivity({
        type: LOG_TYPES.INSURANCE_BUY,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'seguro activar',
        commandOptions: { tipo },
        amount: -item.price,
        balanceAfter: result.economy.lagcoins,
        importance: 'medium',
        result: 'success',
        details: { proteccion: `${protectionPercent}%`, duracion: `${durationMinutes}min` }
      });
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🛡️ ¡Seguro Anti-Robos Activado!')
        .setDescription(`Has activado el **${item.name}**`)
        .addFields(
          { name: '🔒 Protección', value: `${protectionPercent}%`, inline: true },
          { name: '⏱️ Duración', value: `${durationMinutes} minutos`, inline: true },
          { name: '💰 Costo', value: `${item.price} Lagcoins`, inline: true },
          { name: '💵 Nuevo Saldo', value: `${result.economy.lagcoins} Lagcoins`, inline: true }
        )
        .setFooter({ text: `Cuando expire, recibirás un aviso en el canal de notificaciones` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'desactivar') {
      const currentInsurance = getUserInsurance(interaction.guildId, interaction.user.id);
      
      if (!currentInsurance) {
        return interaction.reply({ content: '❌ No tienes ningún seguro activo', flags: 64 });
      }
      
      deactivateInsurance(interaction.guildId, interaction.user.id);
      
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor('#FF6600')
            .setTitle('🔓 Seguro Desactivado')
            .setDescription('Tu seguro anti-robos ha sido desactivado.')
            .setFooter({ text: 'No recibirás reembolso por el tiempo restante' })
            .setTimestamp()
        ]
      });
    }
    
    if (subcommand === 'estado') {
      const currentInsurance = getUserInsurance(interaction.guildId, interaction.user.id);
      
      if (!currentInsurance) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🔓 Sin Seguro Activo')
          .setDescription('No tienes ningún seguro anti-robos activo.')
          .addFields(
            { name: '💡 Consejo', value: 'Usa `/seguro activar` para proteger tus Lagcoins de robos.' }
          )
          .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
      }
      
      const remainingMs = currentInsurance.expiresAt - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      const protectionPercent = Math.round(currentInsurance.protection * 100);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🛡️ Estado del Seguro')
        .addFields(
          { name: '🔒 Protección', value: `${protectionPercent}%`, inline: true },
          { name: '⏱️ Tiempo Restante', value: `${remainingMinutes} minutos`, inline: true }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
