import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra los comandos disponibles')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría de comandos')
        .setRequired(false)
        .addChoices(
          { name: '📊 Niveles', value: 'levels' },
          { name: '💰 Economía', value: 'economy' },
          { name: '🎰 Casino', value: 'casino' },
          { name: '🎮 Minijuegos', value: 'minigames' },
          { name: '🎯 Misiones', value: 'missions' },
          { name: '⚙️ Staff', value: 'staff' }
        )
    ),
  
  async execute(interaction) {
    const category = interaction.options.getString('categoria');
    
    if (category === 'staff') {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ No tienes permisos para ver los comandos de staff.', ephemeral: true });
      }
      
      const staffEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('⚙️ Comandos de Staff')
        .setDescription('Lista de comandos disponibles para el staff')
        .addFields(
          { name: '📊 Gestión de Niveles', value: '`/addlevel` - Añadir niveles\n`/removelevel` - Quitar niveles\n`/setlevel` - Establecer nivel\n`/xp` - Gestionar XP\n`/banxp` - Banear de XP\n`/unbanxp` - Desbanear de XP', inline: true },
          { name: '🚀 Boosts', value: '`/boost add` - Añadir boost\n`/globalboost` - Boost global\n`/removeglobalboost` - Quitar global', inline: true },
          { name: '💰 Economía', value: '`/addcoins` - Añadir Lagcoins\n`/removecoins` - Quitar Lagcoins\n`/setcoins` - Establecer Lagcoins\n`/giveitem` - Dar item\n`/removeitem` - Quitar item', inline: true },
          { name: '⚙️ Sistemas', value: '`/sistema toggle` - Activar/Desactivar sistemas\n`/sistema status` - Ver estado de sistemas', inline: true },
          { name: '🛠️ Otros', value: '`/resettemporada` - Resetear XP del servidor\n`/clearlevelroles` - Quitar roles de nivel\n`/embed` - Crear embed\n`/mensaje` - Enviar mensaje', inline: true }
        )
        .setFooter({ text: 'Solo visible para el staff' });
      
      return interaction.reply({ embeds: [staffEmbed], ephemeral: true });
    }
    
    if (category === 'levels') {
      const embed = new EmbedBuilder()
        .setColor(0x43B581)
        .setTitle('📊 Comandos de Niveles')
        .addFields(
          { name: '/level [usuario]', value: 'Ver nivel y XP con tarjeta personalizada', inline: false },
          { name: '/nivel [usuario]', value: 'Alias de /level', inline: false },
          { name: '/rank [usuario]', value: 'Alias de /level', inline: false },
          { name: '/leaderboard', value: 'Ver tabla de clasificación', inline: false },
          { name: '/lb', value: 'Alias de /leaderboard', inline: false },
          { name: '/rewards list', value: 'Ver recompensas por nivel', inline: false },
          { name: '/boost list', value: 'Ver boosts activos', inline: false },
          { name: '/rankcard', value: 'Personalizar tu tarjeta de nivel', inline: false }
        );
      return interaction.reply({ embeds: [embed] });
    }
    
    if (category === 'economy') {
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('💰 Comandos de Economía')
        .addFields(
          { name: '/balance [usuario]', value: 'Ver saldo de Lagcoins', inline: true },
          { name: '/profile [usuario]', value: 'Ver perfil completo', inline: true },
          { name: '/estadisticas', value: 'Ver estadísticas detalladas', inline: true },
          { name: '/daily', value: 'Recompensa diaria (con rachas)', inline: true },
          { name: '/trabajar [trabajo]', value: 'Trabajar para ganar Lagcoins', inline: true },
          { name: '/tienda [categoria]', value: 'Comprar items y herramientas', inline: true },
          { name: '/inventario', value: 'Ver tu inventario', inline: true },
          { name: '/depositar <cantidad>', value: 'Depositar en el banco', inline: true },
          { name: '/retirar <cantidad>', value: 'Retirar del banco', inline: true },
          { name: '/robar <usuario>', value: 'Intentar robar a otro usuario', inline: true },
          { name: '/trade <usuario>', value: 'Intercambiar Lagcoins', inline: true },
          { name: '/lbeconomia', value: 'Leaderboard de economía', inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }
    
    if (category === 'casino') {
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🎰 Comandos de Casino')
        .setDescription('Apuesta tus Lagcoins en juegos de azar')
        .addFields(
          { name: '/casino <apuesta>', value: 'Ruleta clásica - multiplica hasta x3', inline: false },
          { name: '/slots <apuesta>', value: 'Tragamonedas - jackpot x10', inline: false },
          { name: '/blackjack <apuesta>', value: 'Juega al 21 contra el dealer', inline: false },
          { name: '/coinflip <apuesta> <cara/cruz>', value: 'Lanza una moneda - 50/50', inline: false },
          { name: '/dice <apuesta> <prediccion>', value: 'Dados - alto/bajo/exacto/dobles', inline: false }
        )
        .setFooter({ text: '⚠️ Juega con responsabilidad' });
      return interaction.reply({ embeds: [embed] });
    }
    
    if (category === 'minigames') {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🎮 Minijuegos de XP')
        .setDescription('Juega para ganar XP y recompensas')
        .addFields(
          { name: '/minigame trivia', value: 'Responde 5 preguntas - gana boost o niveles', inline: false },
          { name: '/minigame rps @usuario', value: 'Piedra, Papel o Tijeras (mejor de 5)', inline: false },
          { name: '/minigame roulette @usuario', value: '⚠️ Ruleta Rusa - riesgoso!', inline: false },
          { name: '/minigame hangman', value: 'Ahorcado en solitario (3 rondas)', inline: false },
          { name: '/minigame ahorcados @usuario', value: 'Ahorcado multijugador', inline: false }
        )
        .setFooter({ text: '💡 También puedes acceder desde el botón "Gana Recompensas" en /level' });
      return interaction.reply({ embeds: [embed] });
    }
    
    if (category === 'missions') {
      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🎯 Comandos de Misiones')
        .addFields(
          { name: '/mision', value: 'Ver tus misiones semanales', inline: false },
          { name: '/streak ver', value: 'Ver tus rachas activas', inline: false },
          { name: '/streak proponer @usuario', value: 'Proponer una racha con alguien', inline: false },
          { name: '/streak terminar @usuario', value: 'Terminar una racha', inline: false }
        )
        .setFooter({ text: '🔥 Las misiones se resetean cada semana' });
      return interaction.reply({ embeds: [embed] });
    }
    
    const mainEmbed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setTitle('📋 Comandos del Bot - Niveles')
      .setDescription('Selecciona una categoría para ver los comandos disponibles')
      .addFields(
        { name: '📊 Niveles', value: '`/level` `/leaderboard` `/boost`', inline: true },
        { name: '💰 Economía', value: '`/balance` `/trabajar` `/tienda`', inline: true },
        { name: '🎰 Casino', value: '`/slots` `/blackjack` `/dice`', inline: true },
        { name: '🎮 Minijuegos', value: '`/minigame` trivia, rps, roulette', inline: true },
        { name: '🎯 Misiones', value: '`/mision` `/streak`', inline: true },
        { name: 'ℹ️ Info', value: '`/info` `/help`', inline: true }
      )
      .setFooter({ text: 'Usa /help categoria para ver más detalles' });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_category_select')
          .setPlaceholder('Selecciona una categoría')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('📊 Niveles')
              .setDescription('Comandos de niveles y XP')
              .setValue('levels'),
            new StringSelectMenuOptionBuilder()
              .setLabel('💰 Economía')
              .setDescription('Comandos de Lagcoins')
              .setValue('economy'),
            new StringSelectMenuOptionBuilder()
              .setLabel('🎰 Casino')
              .setDescription('Juegos de apuestas')
              .setValue('casino'),
            new StringSelectMenuOptionBuilder()
              .setLabel('🎮 Minijuegos')
              .setDescription('Minijuegos para ganar XP')
              .setValue('minigames'),
            new StringSelectMenuOptionBuilder()
              .setLabel('🎯 Misiones')
              .setDescription('Misiones y rachas')
              .setValue('missions')
          )
      );
    
    if (isStaff(interaction.member)) {
      row.components[0].addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('⚙️ Staff')
          .setDescription('Comandos de administración')
          .setValue('staff')
      );
    }
    
    return interaction.reply({ embeds: [mainEmbed], components: [row] });
  }
};
