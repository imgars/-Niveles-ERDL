import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getActiveAuctions, getAuction, createAuction, placeBid, endAuction, ITEMS, getUserEconomy } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('subasta')
    .setDescription('Sistema de subastas')
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('Crear una nueva subasta')
        .addStringOption(option =>
          option.setName('item')
            .setDescription('Item a subastar')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('precio_inicial')
            .setDescription('Precio inicial de la subasta')
            .setMinValue(100)
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('duracion')
            .setDescription('Duración en minutos (máx 1440)')
            .setMinValue(5)
            .setMaxValue(1440)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ofertar')
        .setDescription('Hacer una oferta en una subasta')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID de la subasta')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad a ofertar')
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver subastas activas')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Ver información de una subasta específica')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID de la subasta')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('terminar')
        .setDescription('(Staff) Terminar una subasta manualmente')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ID de la subasta')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'crear') {
      const itemId = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
      const startingBid = interaction.options.getInteger('precio_inicial');
      const duration = interaction.options.getInteger('duracion');
      
      const item = ITEMS[itemId];
      if (!item) {
        // Buscar por nombre
        const foundItem = Object.entries(ITEMS).find(([_, i]) => 
          i.name.toLowerCase().includes(interaction.options.getString('item').toLowerCase())
        );
        if (!foundItem) {
          return interaction.reply({ content: '❌ Item no encontrado. Usa el ID o nombre exacto del item.', flags: 64 });
        }
      }
      
      const result = await createAuction(
        interaction.guildId,
        interaction.user.id,
        itemId,
        startingBid,
        duration
      );
      
      if (result.error) {
        const errorMessages = {
          'item_not_found': '❌ Item no encontrado',
          'item_not_owned': '❌ No tienes este item en tu inventario'
        };
        return interaction.reply({ content: errorMessages[result.error] || `❌ Error: ${result.error}`, flags: 64 });
      }

      logActivity({
        type: LOG_TYPES.AUCTION_CREATE,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'subasta crear',
        commandOptions: { item: itemId, precio_inicial: startingBid, duracion: duration },
        importance: 'medium',
        result: 'success',
        details: { item: result.auction.itemName, precioInicial: startingBid, duracion: duration }
      });
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🔨 ¡Nueva Subasta Creada!')
        .setDescription(`Has puesto en subasta: **${result.auction.itemEmoji} ${result.auction.itemName}**`)
        .addFields(
          { name: '🏷️ ID de Subasta', value: `\`${result.auction.id}\``, inline: true },
          { name: '💰 Precio Inicial', value: `${startingBid} Lagcoins`, inline: true },
          { name: '⏱️ Duración', value: `${duration} minutos`, inline: true }
        )
        .setFooter({ text: 'Los usuarios pueden ofertar con /subasta ofertar' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'ofertar') {
      const auctionId = interaction.options.getString('id');
      const bidAmount = interaction.options.getInteger('cantidad');
      
      const result = await placeBid(
        interaction.guildId,
        auctionId,
        interaction.user.id,
        bidAmount
      );
      
      if (result.error) {
        const errorMessages = {
          'auction_not_found': '❌ Subasta no encontrada',
          'auction_ended': '❌ Esta subasta ya ha terminado',
          'cannot_bid_own': '❌ No puedes ofertar en tu propia subasta',
          'bid_too_low': `❌ Tu oferta debe ser mayor a ${result.currentBid} Lagcoins`,
          'insufficient_funds': '❌ No tienes suficientes Lagcoins'
        };
        return interaction.reply({ content: errorMessages[result.error] || `❌ Error: ${result.error}`, flags: 64 });
      }

      logActivity({
        type: LOG_TYPES.AUCTION_BID,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: 'subasta ofertar',
        commandOptions: { id: auctionId, cantidad: bidAmount },
        amount: -bidAmount,
        importance: 'medium',
        result: 'success',
        details: { subasta: auctionId, item: result.auction.itemName, oferta: bidAmount }
      });
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ ¡Oferta Realizada!')
        .setDescription(`Has ofertado **${bidAmount} Lagcoins** por **${result.auction.itemEmoji} ${result.auction.itemName}**`)
        .addFields(
          { name: '🏷️ ID de Subasta', value: `\`${result.auction.id}\``, inline: true },
          { name: '💰 Tu Oferta', value: `${bidAmount} Lagcoins`, inline: true }
        )
        .setFooter({ text: 'Si alguien supera tu oferta, recuperarás tus Lagcoins' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'ver') {
      const auctions = getActiveAuctions();
      
      if (auctions.length === 0) {
        return interaction.reply({ content: '📦 No hay subastas activas en este momento.', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🔨 Subastas Activas')
        .setDescription(`Hay **${auctions.length}** subastas activas`)
        .setTimestamp();
      
      for (const auction of auctions.slice(0, 10)) {
        const remainingMs = auction.endTime - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        embed.addFields({
          name: `${auction.itemEmoji} ${auction.itemName}`,
          value: `ID: \`${auction.id}\`\n💰 Oferta actual: ${auction.currentBid} Lagcoins\n⏱️ Termina en: ${remainingMinutes} min`,
          inline: true
        });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'info') {
      const auctionId = interaction.options.getString('id');
      const auction = getAuction(auctionId);
      
      if (!auction) {
        return interaction.reply({ content: '❌ Subasta no encontrada', flags: 64 });
      }
      
      const remainingMs = auction.endTime - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      const status = auction.ended ? '🔴 Terminada' : remainingMs > 0 ? '🟢 Activa' : '🟡 Finalizando';
      
      const embed = new EmbedBuilder()
        .setColor(auction.ended ? '#FF0000' : '#FFD700')
        .setTitle(`🔨 Subasta: ${auction.itemEmoji} ${auction.itemName}`)
        .addFields(
          { name: '🏷️ ID', value: `\`${auction.id}\``, inline: true },
          { name: '📊 Estado', value: status, inline: true },
          { name: '⏱️ Tiempo Restante', value: auction.ended ? 'Terminada' : `${remainingMinutes} min`, inline: true },
          { name: '💰 Oferta Actual', value: `${auction.currentBid} Lagcoins`, inline: true },
          { name: '👤 Mejor Ofertante', value: auction.highestBidderId ? `<@${auction.highestBidderId}>` : 'Nadie aún', inline: true },
          { name: '📋 Total de Ofertas', value: `${auction.bids.length}`, inline: true }
        )
        .setTimestamp();
      
      if (auction.bids.length > 0) {
        const lastBids = auction.bids.slice(-5).reverse()
          .map(b => `<@${b.userId}>: ${b.amount} Lagcoins`)
          .join('\n');
        embed.addFields({ name: '📜 Últimas Ofertas', value: lastBids });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'terminar') {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Solo el staff puede terminar subastas manualmente', flags: 64 });
      }
      
      const auctionId = interaction.options.getString('id');
      const result = await endAuction(auctionId);
      
      if (!result) {
        return interaction.reply({ content: '❌ Subasta no encontrada o ya terminada', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔨 ¡Subasta Terminada!')
        .setDescription(`La subasta de **${result.itemEmoji} ${result.itemName}** ha terminado`)
        .addFields(
          { name: '👑 Ganador', value: result.highestBidderId ? `<@${result.highestBidderId}>` : 'Sin ofertas', inline: true },
          { name: '💰 Precio Final', value: `${result.currentBid} Lagcoins`, inline: true }
        )
        .setFooter({ text: `Terminada por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
