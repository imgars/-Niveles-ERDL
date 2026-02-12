import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy, removeUserLagcoins } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

const TAX_RATES = {
  weekly: 0.02,
  brackets: [
    { min: 0, max: 1000, rate: 0 },
    { min: 1001, max: 5000, rate: 0.01 },
    { min: 5001, max: 20000, rate: 0.02 },
    { min: 20001, max: 50000, rate: 0.03 },
    { min: 50001, max: 100000, rate: 0.04 },
    { min: 100001, max: Infinity, rate: 0.05 }
  ]
};

function calculateTax(totalWealth) {
  for (const bracket of TAX_RATES.brackets) {
    if (totalWealth >= bracket.min && totalWealth <= bracket.max) {
      return Math.floor(totalWealth * bracket.rate);
    }
  }
  return 0;
}

function getTaxBracket(totalWealth) {
  for (const bracket of TAX_RATES.brackets) {
    if (totalWealth >= bracket.min && totalWealth <= bracket.max) {
      return bracket;
    }
  }
  return TAX_RATES.brackets[0];
}

export default {
  data: new SlashCommandBuilder()
    .setName('impuestos')
    .setDescription('Sistema de impuestos semanales')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Ver información sobre impuestos')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('pagar')
        .setDescription('Pagar tus impuestos semanales')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('estado')
        .setDescription('Ver tu estado de impuestos')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'info') {
      const bracketsText = TAX_RATES.brackets.map(b => {
        const maxText = b.max === Infinity ? '+' : `-${b.max.toLocaleString()}`;
        return `${b.min.toLocaleString()}${maxText} LC: **${(b.rate * 100).toFixed(0)}%**`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💸 Sistema de Impuestos')
        .setDescription('Los impuestos semanales se calculan según tu riqueza total (cartera + banco).')
        .addFields(
          { name: '📊 Tramos Fiscales', value: bracketsText, inline: false },
          { name: '⏰ Frecuencia', value: 'Semanales (cada 7 días)', inline: true },
          { name: '⚠️ Penalización', value: 'No pagar acumula deuda', inline: true }
        )
        .setFooter({ text: 'Los usuarios con menos de 1000 LC no pagan impuestos' });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    await interaction.deferReply();
    
    try {
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      const totalWealth = (economy.lagcoins || 0) + (economy.bankBalance || 0);
      
      if (subcommand === 'estado') {
        const lastTaxPayment = economy.lastTaxPayment || 0;
        const nextTaxDue = lastTaxPayment + (7 * 24 * 60 * 60 * 1000);
        const now = Date.now();
        
        const taxAmount = calculateTax(totalWealth);
        const bracket = getTaxBracket(totalWealth);
        const taxDebt = economy.taxDebt || 0;
        
        const isDue = now >= nextTaxDue;
        const daysRemaining = isDue ? 0 : Math.ceil((nextTaxDue - now) / (24 * 60 * 60 * 1000));
        
        const embed = new EmbedBuilder()
          .setColor(isDue || taxDebt > 0 ? '#FF0000' : '#00FF00')
          .setTitle('📋 Tu Estado Fiscal')
          .addFields(
            { name: '💰 Riqueza Total', value: `${totalWealth.toLocaleString()} LC`, inline: true },
            { name: '📊 Tramo', value: `${(bracket.rate * 100).toFixed(0)}%`, inline: true },
            { name: '💸 Impuesto Actual', value: `${taxAmount.toLocaleString()} LC`, inline: true },
            { name: '⏰ Próximo Pago', value: isDue ? '⚠️ AHORA' : `En ${daysRemaining} días`, inline: true },
            { name: '🔴 Deuda Acumulada', value: `${taxDebt.toLocaleString()} LC`, inline: true }
          );
        
        if (isDue) {
          embed.setDescription('⚠️ **Tienes impuestos pendientes por pagar.**\nUsa `/impuestos pagar` para evitar acumular deuda.');
        }
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      if (subcommand === 'pagar') {
        const taxAmount = calculateTax(totalWealth);
        const taxDebt = economy.taxDebt || 0;
        const totalToPay = taxAmount + taxDebt;
        
        if (totalToPay === 0) {
          return interaction.editReply('✅ No tienes impuestos pendientes. ¡Estás al día!');
        }
        
        const cartera = economy.lagcoins || 0;
        const banco = economy.bankBalance || 0;
        
        if (cartera + banco < totalToPay) {
          economy.taxDebt = (economy.taxDebt || 0) + taxAmount;
          await saveUserEconomy(interaction.guildId, interaction.user.id, economy);
          
          return interaction.editReply({
            embeds: [{
              color: 0xFF0000,
              title: '❌ Fondos Insuficientes',
              description: `No tienes suficientes Lagcoins para pagar (cartera + banco).\n\n**Impuesto:** ${taxAmount.toLocaleString()} LC\n**Tienes total:** ${(cartera + banco).toLocaleString()} LC\n\n⚠️ Se ha añadido a tu deuda fiscal.`,
              fields: [{ name: '🔴 Nueva Deuda', value: `${economy.taxDebt.toLocaleString()} LC`, inline: true }]
            }]
          });
        }
        
        let remaining = totalToPay;
        let fromCartera = Math.min(cartera, remaining);
        remaining -= fromCartera;
        let fromBanco = remaining;
        
        if (fromCartera > 0) {
          await removeUserLagcoins(interaction.guildId, interaction.user.id, fromCartera, 'taxes');
        }
        if (fromBanco > 0) {
          economy.bankBalance = banco - fromBanco;
          await saveUserEconomy(interaction.guildId, interaction.user.id, economy);
        }
        
        const updatedEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
        updatedEconomy.lastTaxPayment = Date.now();
        updatedEconomy.taxDebt = 0;
        updatedEconomy.totalTaxesPaid = (updatedEconomy.totalTaxesPaid || 0) + totalToPay;
        await saveUserEconomy(interaction.guildId, interaction.user.id, updatedEconomy);
        
        logActivity({
          type: LOG_TYPES.TAX_PAID,
          userId: interaction.user.id,
          username: interaction.user.username,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name,
          command: 'impuestos pagar',
          amount: -totalToPay,
          balanceAfter: updatedEconomy.lagcoins,
          importance: totalToPay > 5000 ? 'medium' : 'low',
          result: 'success',
          details: { impuesto: taxAmount, deuda: taxDebt, totalPagado: totalToPay }
        });

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Impuestos Pagados')
          .setDescription('Has pagado tus impuestos correctamente.')
          .addFields(
            { name: '💸 Pagado', value: `${totalToPay.toLocaleString()} LC`, inline: true },
            { name: '💰 Nuevo Saldo', value: `${updatedEconomy.lagcoins.toLocaleString()} LC`, inline: true },
            { name: '⏰ Próximo Pago', value: 'En 7 días', inline: true }
          )
          .setFooter({ text: 'Gracias por contribuir a la economía' });
        
        return interaction.editReply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Error en impuestos:', error);
      return interaction.editReply('❌ Error al procesar impuestos.');
    }
  }
};
