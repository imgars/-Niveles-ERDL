import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { 
  staffAddCoins, 
  staffRemoveCoins, 
  staffSetCoins, 
  staffGiveItem, 
  staffRemoveItem,
  getUserEconomy,
  ITEMS,
  activatePowerup,
  activateInsurance,
  deactivateInsurance,
  activateAdminBoost,
  deactivateAdminBoost,
  getAdminBoost,
  assignRandomNationality,
  travelToCountry,
  COUNTRIES
} from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('staffeconomy')
    .setDescription('(Staff) Comandos de administración de economía')
    .addSubcommand(subcommand =>
      subcommand
        .setName('daritem')
        .setDescription('Dar un item a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('item')
            .setDescription('ID del item')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quitaritem')
        .setDescription('Quitar un item a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('item')
            .setDescription('ID del item')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('darpowerup')
        .setDescription('Dar un power-up a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo de power-up')
            .setRequired(true)
            .addChoices(
              { name: 'Boost de Trabajo', value: 'work_boost' },
              { name: 'Suerte de Casino', value: 'casino_luck' },
              { name: 'Éxito de Robo', value: 'rob_success' },
              { name: 'Boost de XP', value: 'xp_boost' }
            )
        )
        .addIntegerOption(option =>
          option.setName('porcentaje')
            .setDescription('Porcentaje del boost (1-500)')
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
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('darseguro')
        .setDescription('Dar seguro anti-robo a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('proteccion')
            .setDescription('Porcentaje de protección (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('duracion')
            .setDescription('Duración en minutos')
            .setMinValue(1)
            .setMaxValue(1440)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quitarseguro')
        .setDescription('Quitar seguro anti-robo a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('darnacionalidad')
        .setDescription('Dar nacionalidad a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('pais')
            .setDescription('País')
            .setRequired(true)
            .addChoices(
              { name: '🇻🇪 Venezuela', value: 'venezuela' },
              { name: '🇲🇽 México', value: 'mexico' },
              { name: '🇺🇸 Estados Unidos', value: 'estados_unidos' },
              { name: '🇯🇵 Japón', value: 'japon' },
              { name: '🇪🇸 España', value: 'espana' },
              { name: '🇬🇧 Reino Unido', value: 'reino_unido' },
              { name: '🇨🇦 Canadá', value: 'canada' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('verusuario')
        .setDescription('Ver toda la información de un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('resetusuario')
        .setDescription('Resetear economía de un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'daritem') {
      const targetUser = interaction.options.getUser('usuario');
      const itemId = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
      
      const item = ITEMS[itemId];
      if (!item) {
        return interaction.reply({ content: '❌ Item no encontrado', flags: 64 });
      }
      
      const result = await staffGiveItem(interaction.guildId, targetUser.id, itemId);
      
      if (!result) {
        return interaction.reply({ content: '❌ Error al dar item', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎁 Item Dado')
        .setDescription(`Se ha dado **${item.emoji} ${item.name}** a ${targetUser}`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'quitaritem') {
      const targetUser = interaction.options.getUser('usuario');
      const itemId = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
      
      const result = await staffRemoveItem(interaction.guildId, targetUser.id, itemId);
      
      if (!result) {
        return interaction.reply({ content: '❌ El usuario no tiene este item', flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🗑️ Item Quitado')
        .setDescription(`Se ha quitado **${itemId}** a ${targetUser}`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'darpowerup') {
      const targetUser = interaction.options.getUser('usuario');
      const tipo = interaction.options.getString('tipo');
      const porcentaje = interaction.options.getInteger('porcentaje');
      const duracion = interaction.options.getInteger('duracion');
      
      activatePowerup(interaction.guildId, targetUser.id, tipo, porcentaje / 100, duracion * 60 * 1000);
      
      const tipoNames = {
        'work_boost': 'Boost de Trabajo',
        'casino_luck': 'Suerte de Casino',
        'rob_success': 'Éxito de Robo',
        'xp_boost': 'Boost de XP'
      };
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚡ Power-Up Dado')
        .setDescription(`Se ha dado **${tipoNames[tipo]}** (+${porcentaje}%) a ${targetUser} por ${duracion} minutos`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'darseguro') {
      const targetUser = interaction.options.getUser('usuario');
      const proteccion = interaction.options.getInteger('proteccion');
      const duracion = interaction.options.getInteger('duracion');
      
      activateInsurance(interaction.guildId, targetUser.id, proteccion / 100, duracion * 60 * 1000);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🛡️ Seguro Dado')
        .setDescription(`Se ha dado **${proteccion}% protección** a ${targetUser} por ${duracion} minutos`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'quitarseguro') {
      const targetUser = interaction.options.getUser('usuario');
      
      deactivateInsurance(interaction.guildId, targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔓 Seguro Quitado')
        .setDescription(`Se ha quitado el seguro de ${targetUser}`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'darnacionalidad') {
      const targetUser = interaction.options.getUser('usuario');
      const pais = interaction.options.getString('pais');
      
      const country = COUNTRIES[pais];
      
      // Forzar nacionalidad
      const result = await travelToCountry(interaction.guildId, targetUser.id, pais);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🌎 Nacionalidad Asignada')
        .setDescription(`Se ha asignado ${country.emoji} **${country.name}** a ${targetUser}`)
        .addFields(
          { name: 'Multiplicador de Trabajo', value: `x${country.jobMultiplier}`, inline: true }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'verusuario') {
      const targetUser = interaction.options.getUser('usuario');
      const economy = await getUserEconomy(interaction.guildId, targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`📊 Info de ${targetUser.username}`)
        .addFields(
          { name: '💰 Lagcoins', value: `${economy.lagcoins || 0}`, inline: true },
          { name: '🏦 Banco', value: `${economy.bankBalance || 0}`, inline: true },
          { name: '💎 Total', value: `${(economy.lagcoins || 0) + (economy.bankBalance || 0)}`, inline: true },
          { name: '📦 Items', value: `${(economy.items || []).length}`, inline: true },
          { name: '🎰 Partidas Casino', value: `${economy.casinoStats?.plays || 0}`, inline: true },
          { name: '🏆 Victorias Casino', value: `${economy.casinoStats?.wins || 0}`, inline: true },
          { name: '💼 Trabajos', value: `${economy.jobStats?.totalJobs || 0}`, inline: true },
          { name: '📈 Total Ganado', value: `${economy.totalEarned || 0}`, inline: true },
          { name: '📉 Total Gastado', value: `${economy.totalSpent || 0}`, inline: true }
        )
        .setTimestamp();
      
      if (economy.items && economy.items.length > 0) {
        const itemsList = economy.items.slice(0, 10).map(i => {
          const item = ITEMS[i];
          return item ? `${item.emoji} ${item.name}` : i;
        }).join(', ');
        embed.addFields({ name: '🎒 Items', value: itemsList });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'resetusuario') {
      const targetUser = interaction.options.getUser('usuario');
      
      await staffSetCoins(interaction.guildId, targetUser.id, 100);
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔄 Usuario Reseteado')
        .setDescription(`Se ha reseteado la economía de ${targetUser} a 100 Lagcoins`)
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
