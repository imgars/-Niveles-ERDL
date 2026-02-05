import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy, transferUserLagcoins, ITEMS } from '../utils/economyDB.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gift')
    .setDescription('Regala items, boosts o lagcoins a otro usuario')
    .addSubcommand(subcommand =>
      subcommand
        .setName('item')
        .setDescription('Regalar un item de tu inventario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario al que regalar')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('item')
            .setDescription('ID del item a regalar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('lagcoins')
        .setDescription('Regalar Lagcoins')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario al que regalar')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad de Lagcoins')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999999999999)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('xp')
        .setDescription('Regalar XP de tu experiencia')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario al que regalar')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad de XP')
            .setRequired(true)
            .setMinValue(10)
            .setMaxValue(1000)
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('usuario');
    
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes regalarte a ti mismo.', flags: 64 });
    }
    
    if (targetUser.bot) {
      return interaction.reply({ content: '❌ No puedes regalar a bots.', flags: 64 });
    }
    
    await interaction.deferReply();
    
    try {
      if (subcommand === 'item') {
        const itemId = interaction.options.getString('item').toLowerCase();
        const senderEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
        
        if (!senderEconomy.items || !senderEconomy.items.includes(itemId)) {
          return interaction.editReply(`❌ No tienes el item **${itemId}** en tu inventario.`);
        }
        
        const item = ITEMS[itemId];
        if (!item) {
          return interaction.editReply('❌ Item no válido.');
        }
        
        const itemIndex = senderEconomy.items.indexOf(itemId);
        senderEconomy.items.splice(itemIndex, 1);
        await saveUserEconomy(interaction.guildId, interaction.user.id, senderEconomy);
        
        const receiverEconomy = await getUserEconomy(interaction.guildId, targetUser.id);
        if (!receiverEconomy.items) receiverEconomy.items = [];
        receiverEconomy.items.push(itemId);
        await saveUserEconomy(interaction.guildId, targetUser.id, receiverEconomy);
        
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎁 Regalo Enviado')
          .setDescription(`Has regalado **${item.emoji} ${item.name}** a ${targetUser}`)
          .setFooter({ text: 'Generosidad recompensada' })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      if (subcommand === 'lagcoins') {
        const amount = interaction.options.getInteger('cantidad');
        const senderEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
        
        if ((senderEconomy.lagcoins || 0) < amount) {
          return interaction.editReply(`❌ No tienes suficientes Lagcoins. Tienes: ${senderEconomy.lagcoins || 0}`);
        }
        
        const result = await transferUserLagcoins(interaction.guildId, interaction.user.id, targetUser.id, amount);
        
        if (!result) {
          return interaction.editReply('❌ Error al transferir Lagcoins.');
        }
        
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('💰 Lagcoins Regalados')
          .setDescription(`Has regalado **${amount.toLocaleString()} Lagcoins** a ${targetUser}`)
          .addFields(
            { name: 'Tu saldo', value: `${result.from.lagcoins.toLocaleString()} LC`, inline: true },
            { name: 'Su saldo', value: `${result.to.lagcoins.toLocaleString()} LC`, inline: true }
          )
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      if (subcommand === 'xp') {
        const amount = interaction.options.getInteger('cantidad');
        const senderData = db.getUser(interaction.guildId, interaction.user.id);
        
        if (!senderData || (senderData.totalXp || 0) < amount) {
          return interaction.editReply(`❌ No tienes suficiente XP. Tienes: ${senderData?.totalXp || 0}`);
        }
        
        senderData.totalXp = (senderData.totalXp || 0) - amount;
        db.setUser(interaction.guildId, interaction.user.id, senderData);
        
        const receiverData = db.getUser(interaction.guildId, targetUser.id) || { level: 1, totalXp: 0, currentXp: 0 };
        receiverData.totalXp = (receiverData.totalXp || 0) + amount;
        receiverData.currentXp = (receiverData.currentXp || 0) + amount;
        db.setUser(interaction.guildId, targetUser.id, receiverData);
        
        const embed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('⭐ XP Regalado')
          .setDescription(`Has regalado **${amount.toLocaleString()} XP** a ${targetUser}`)
          .addFields(
            { name: 'Tu XP', value: `${senderData.totalXp.toLocaleString()}`, inline: true },
            { name: 'Su XP', value: `${receiverData.totalXp.toLocaleString()}`, inline: true }
          )
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Error en gift:', error);
      return interaction.editReply('❌ Error al procesar el regalo.');
    }
  }
};
