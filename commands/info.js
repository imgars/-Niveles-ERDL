import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';
import { getNightBoostStatus } from '../utils/timeBoost.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Muestra información general del bot con acciones rápidas'),

  async execute(interaction) {
    const allUsers = db.getAllUsers(interaction.guild.id);
    const totalXP = allUsers.reduce((sum, user) => sum + (user.totalXp || 0), 0);
    const maxLevel = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.level || 0)) : 0;
    const activeBoosts = db.boosts.global.length;
    const nightStatus = getNightBoostStatus();

    const embed = new EmbedBuilder()
      .setColor(0x00CED1)
      .setTitle('📊 Información del Bot - Niveles')
      .setDescription('Bot completo de niveles, economía y minijuegos para Discord')
      .addFields(
        { name: '👥 Usuarios', value: `${allUsers.length}`, inline: true },
        { name: '⭐ Nivel Más Alto', value: `${maxLevel}`, inline: true },
        { name: '✨ XP Total', value: `${totalXP.toLocaleString()}`, inline: true },
        { name: '🚀 Boosts Globales', value: `${activeBoosts}`, inline: true },
        { name: '🌙 Boost Nocturno', value: nightStatus.active ? '✅ Activo' : '❌ Inactivo', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { 
          name: '🎮 Características', 
          value: '• Sistema de Niveles y XP\n• Economía con Lagcoins\n• 5 Juegos de Casino\n• Minijuegos para ganar XP\n• Misiones Semanales\n• Sistema de Rachas\n• 9 Temas de Tarjetas\n• 24 Trabajos Diferentes',
          inline: false 
        },
        { 
          name: '📋 Comandos Principales', 
          value: '`/level` - Ver tu nivel\n`/balance` - Ver tus Lagcoins\n`/work` - Trabajar fácil\n`/cooldowns` - Ver cooldowns\n`/help` - Ver todos los comandos',
          inline: false 
        }
      )
      .setFooter({ text: 'Usa los botones para acciones rápidas' })
      .setTimestamp();

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('info_level')
          .setLabel('Ver mi Nivel')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⭐'),
        new ButtonBuilder()
          .setCustomId('info_balance')
          .setLabel('Ver Balance')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💰'),
        new ButtonBuilder()
          .setCustomId('info_leaderboard')
          .setLabel('Leaderboard')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚡'),
        new ButtonBuilder()
          .setCustomId('info_work')
          .setLabel('Trabajar')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💼')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('info_casino')
          .setLabel('Casino')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🎰'),
        new ButtonBuilder()
          .setCustomId('info_minigame')
          .setLabel('Minijuego')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setLabel('Dashboard Web')
          .setStyle(ButtonStyle.Link)
          .setURL('https://niveleserdl.onrender.com/#inicio')
          .setEmoji('🌐')
      );

    const response = await interaction.reply({ 
      embeds: [embed], 
      components: [row1, row2] 
    });

    const collector = response.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Estos botones son solo para quien usó el comando.', flags: 64 });
      }

      try {
        switch (i.customId) {
          case 'info_level':
            await i.reply({ content: '⭐ Usa `/level` para ver tu nivel con tarjeta personalizada!', flags: 64 });
            break;
          case 'info_balance':
            await i.reply({ content: '💰 Usa `/balance` para ver tus Lagcoins!', flags: 64 });
            break;
          case 'info_leaderboard':
            await i.reply({ content: '⚡ Usa `/leaderboard` para ver la tabla de clasificación!', flags: 64 });
            break;
          case 'info_work':
            await i.reply({ content: '💼 Usa `/work` para ver trabajos disponibles o `/trabajar` para un trabajo específico!', flags: 64 });
            break;
          case 'info_casino':
            await i.reply({ content: '🎰 Comandos de casino:\n`/casino` - Ruleta\n`/slots` - Tragamonedas\n`/blackjack` - 21\n`/coinflip` - Moneda\n`/dice` - Dados', flags: 64 });
            break;
          case 'info_minigame':
            await i.reply({ content: '🎮 Usa `/minigame trivia` para jugar trivia y ganar XP!\nTambién: `/minigame rps` y `/ahorcado`', flags: 64 });
            break;
        }
      } catch (error) {
        console.error('Error handling info button:', error);
      }
    });
  }
};
