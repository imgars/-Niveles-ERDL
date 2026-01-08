import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { playCasino, getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('casino_juegos')
    .setDescription('🎰 Casino con múltiples juegos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('elegir')
        .setDescription('Elige qué juego jugar')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tragaperras')
        .setDescription('Juega a las tragaperras')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(10)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('dados')
        .setDescription('Lanza los dados y adivina')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(10)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ruleta')
        .setDescription('Ruleta americana (rojo/negro/verde)')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(10)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Defer reply para evitar timeout en operaciones largas
    if (subcommand !== 'elegir') { // Changed from 'juegos' to 'elegir' as per structure
      await interaction.deferReply();
    }

    if (subcommand === 'elegir') {
      const select = new StringSelectMenuBuilder()
        .setCustomId('casino_select')
        .setPlaceholder('Elige un juego...')
        .addOptions(
          { label: '🎰 Tragaperras', value: 'tragaperras', emoji: '🎰' },
          { label: '🎲 Dados', value: 'dados', emoji: '🎲' },
          { label: '🎡 Ruleta', value: 'ruleta', emoji: '🎡' },
          { label: '🃏 Póker', value: 'poker', emoji: '🃏' }
        );

      const row = new ActionRowBuilder().addComponents(select);

      const embed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('🎰 CASINO PRINCIPAL 🎰')
        .setDescription('Elige un juego para jugar')
        .addFields(
          { name: '🎰 Tragaperras', value: 'Alinea 3 símbolos iguales\nPremio: x1.5 a x5 tu apuesta' },
          { name: '🎲 Dados', value: 'Adivina la suma de 2 dados\nPremio: x2 tu apuesta si aciertas' },
          { name: '🎡 Ruleta', value: 'Elige color: Rojo (1.9x) Negro (1.9x) Verde (x3-x4!)\nPremio: Depende del color' },
          { name: '🃏 Póker', value: 'Juega póker simple contra la máquina\nPremio: x3 tu apuesta si ganas' }
        );

      return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    if (subcommand === 'tragaperras') {
      try {
        const bet = interaction.options.getInteger('apuesta');
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        if (!economy || economy.lagcoins < bet) {
          return interaction.editReply({ content: '❌ No tienes suficientes Lagcoins', flags: 64 });
        }

        const symbols = ['🍎', '🍊', '🍇', '🎯', '💎'];
        const roll = [symbols[Math.floor(Math.random() * symbols.length)],
                      symbols[Math.floor(Math.random() * symbols.length)],
                      symbols[Math.floor(Math.random() * symbols.length)]];

        let multiplier = 0;
        if (roll[0] === roll[1] && roll[1] === roll[2]) {
          multiplier = 5;
        } else if (roll[0] === roll[1] || roll[1] === roll[2]) {
          multiplier = 1.5;
        }

        const won = multiplier > 0;
        const winnings = won ? Math.floor(bet * multiplier) - bet : -bet;
        economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);

        if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
        economy.casinoStats.plays++;
        if (won) {
          economy.casinoStats.wins++;
          economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
        } else {
          economy.casinoStats.totalLost = (economy.casinoStats.totalLost || 0) + bet;
        }

        // Guardar economía sin push manual de transacciones
        const savedEconomy = await saveUserEconomy(interaction.guildId, interaction.user.id, {
          ...economy,
          lagcoins: economy.lagcoins
        });

        const embed = new EmbedBuilder()
          .setColor(won ? '#00FF00' : '#FF0000')
          .setTitle('🎰 TRAGAPERRAS 🎰')
          .setDescription(`${roll.join(' ')}\n\n${won ? '✨ ¡GANASTE!' : '❌ Perdiste'}`)
          .addFields(
            { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
            { name: 'Multiplicador', value: `x${multiplier || '0'}`, inline: true },
            { name: 'Ganancia/Pérdida', value: `${winnings > 0 ? '+' : ''}${winnings} Lagcoins`, inline: true },
            { name: 'Nuevo Saldo', value: `💰 ${savedEconomy.lagcoins} Lagcoins`, inline: false }
          );

        return interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error en tragaperras:', error);
        return interaction.editReply({ content: '❌ Error en el juego', flags: 64 });
      }
    }

    if (subcommand === 'dados') {
      try {
        const bet = interaction.options.getInteger('apuesta');
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        if (!economy || economy.lagcoins < bet) {
          return interaction.editReply({ content: '❌ No tienes suficientes Lagcoins', flags: 64 });
        }

        const dado1 = Math.floor(Math.random() * 6) + 1;
        const dado2 = Math.floor(Math.random() * 6) + 1;
        const suma = dado1 + dado2;

        const gana = suma === 7 || suma === 11;
        const winnings = gana ? bet * 2 : -bet;
        economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);

        if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
        economy.casinoStats.plays++;
        if (gana) {
          economy.casinoStats.wins++;
          economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
        } else {
          economy.casinoStats.totalLost = (economy.casinoStats.totalLost || 0) + bet;
        }

        // Guardar economía sin push manual de transacciones
        const savedEconomy = await saveUserEconomy(interaction.guildId, interaction.user.id, {
          ...economy,
          lagcoins: economy.lagcoins
        });

        const embed = new EmbedBuilder()
          .setColor(gana ? '#00FF00' : '#FF0000')
          .setTitle('🎲 DADOS 🎲')
          .setDescription(`🎲 ${dado1} + 🎲 ${dado2} = **${suma}**\n\n${gana ? '✨ ¡GANASTE!' : '❌ Perdiste'}`)
          .addFields(
            { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
            { name: 'Resultado', value: gana ? 'SUMA GANADORA 🎉' : 'Suma perdedora', inline: true },
            { name: 'Ganancia', value: `${gana ? '+' : ''}${winnings} Lagcoins`, inline: true },
            { name: 'Nuevo Saldo', value: `💰 ${savedEconomy.lagcoins} Lagcoins`, inline: false }
          );

        return interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error en dados:', error);
        return interaction.editReply({ content: '❌ Error en el juego', flags: 64 });
      }
    }

    if (subcommand === 'ruleta') {
      try {
        const bet = interaction.options.getInteger('apuesta');
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        if (!economy || economy.lagcoins < bet) {
          return interaction.editReply({ content: '❌ No tienes suficientes Lagcoins', flags: 64 });
        }

        const colors = ['Rojo', 'Negro', 'Rojo', 'Negro', 'Rojo', 'Negro', 'Rojo', 'Negro', 'Verde'];
        const colorRandom = colors[Math.floor(Math.random() * colors.length)];
        const colorEmoji = { 'Rojo': '🔴', 'Negro': '⚫', 'Verde': '🟢' };

        let multiplier = 0;
        if (colorRandom === 'Rojo' || colorRandom === 'Negro') multiplier = 1.9;
        if (colorRandom === 'Verde') {
          // x3 base, con 10% de probabilidad de x4
          multiplier = Math.random() < 0.1 ? 4 : 3;
        }

        const won = multiplier > 0;
        const winnings = Math.floor(bet * multiplier) - bet;
        economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);

        if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
        economy.casinoStats.plays++;
        if (won) {
          economy.casinoStats.wins++;
          economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
        }

        // Guardar economía sin push manual de transacciones
        const savedEconomy = await saveUserEconomy(interaction.guildId, interaction.user.id, {
          ...economy,
          lagcoins: economy.lagcoins
        });

        const embed = new EmbedBuilder()
          .setColor(colorRandom === 'Rojo' ? '#FF0000' : colorRandom === 'Negro' ? '#000000' : '#00FF00')
          .setTitle('🎡 RULETA 🎡')
          .setDescription(`${colorEmoji[colorRandom]} ${colorRandom} ${colorEmoji[colorRandom]}\n\n✨ ¡${multiplier > 2 ? 'JACKPOT' : 'GANASTE'}!`)
          .addFields(
            { name: 'Apuesta', value: `${bet} Lagcoins`, inline: true },
            { name: 'Multiplicador', value: `x${multiplier}`, inline: true },
            { name: 'Ganancia', value: `+${winnings} Lagcoins`, inline: true },
            { name: 'Nuevo Saldo', value: `💰 ${savedEconomy.lagcoins} Lagcoins`, inline: false }
          );

        return interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error en ruleta:', error);
        return interaction.editReply({ content: '❌ Error en el juego', flags: 64 });
      }
    }
  }
};