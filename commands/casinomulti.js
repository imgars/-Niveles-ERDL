import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserEconomy, saveUserEconomy, getUserActivePowerups, getAdminBoost, COUNTRIES } from '../utils/economyDB.js';

const activeGames = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('casinomulti')
    .setDescription('Juegos de casino multijugador')
    .addSubcommand(subcommand =>
      subcommand
        .setName('carreras')
        .setDescription('Apostar en carreras de caballos')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(50)
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('caballo')
            .setDescription('Número de caballo (1-6)')
            .setMinValue(1)
            .setMaxValue(6)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('duelo')
        .setDescription('Desafiar a otro usuario a un duelo de dados')
        .addUserOption(option =>
          option.setName('oponente')
            .setDescription('Usuario a desafiar')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(100)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('poker')
        .setDescription('Iniciar una mesa de poker simplificado')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Apuesta inicial')
            .setMinValue(100)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ruleta')
        .setDescription('Ruleta multijugador - espera a otros jugadores')
        .addIntegerOption(option =>
          option.setName('apuesta')
            .setDescription('Cantidad a apostar')
            .setMinValue(50)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo de apuesta')
            .setRequired(true)
            .addChoices(
              { name: '🔴 Rojo (x2)', value: 'rojo' },
              { name: '⚫ Negro (x2)', value: 'negro' },
              { name: '🟢 Verde/0 (x3-x4)', value: 'verde' },
              { name: '1️⃣ Par (x2)', value: 'par' },
              { name: '2️⃣ Impar (x2)', value: 'impar' },
              { name: '⬆️ Alto 19-36 (x2)', value: 'alto' },
              { name: '⬇️ Bajo 1-18 (x2)', value: 'bajo' }
            )
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'carreras') {
      return handleHorseRace(interaction);
    }
    
    if (subcommand === 'duelo') {
      return handleDuelo(interaction);
    }
    
    if (subcommand === 'poker') {
      return handlePoker(interaction);
    }
    
    if (subcommand === 'ruleta') {
      return handleRuleta(interaction);
    }
  }
};

async function handleHorseRace(interaction) {
  const bet = interaction.options.getInteger('apuesta');
  const horseNumber = interaction.options.getInteger('caballo');
  
  const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
  
  if ((economy.lagcoins || 0) < bet) {
    return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Tienes ${economy.lagcoins || 0}`, flags: 64 });
  }
  
  await interaction.deferReply();
  
  // Calcular suerte
  let luckBonus = 0;
  const activePowerups = getUserActivePowerups(interaction.guildId, interaction.user.id);
  for (const powerup of activePowerups) {
    if (powerup.type === 'casino_luck' || powerup.type === 'luck_boost') {
      luckBonus += powerup.value;
    }
  }
  
  const adminBoost = getAdminBoost();
  if (adminBoost && adminBoost.systems.casino) {
    luckBonus += adminBoost.percentage;
  }
  
  const horses = ['🏇', '🐎', '🦄', '🐴', '🎠', '🏇'];
  const horseNames = ['Rayo', 'Tormenta', 'Unicornio', 'Veloz', 'Carrusel', 'Campeón'];
  const odds = [1.2, 1.3, 1.5, 1.2, 1.4, 1.2];
  
  // Simulación de carrera con nerf de probabilidad para el usuario
  const userHorseBonus = luckBonus * 0.1; 
  
  for (let round = 0; round < 5; round++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    for (let i = 0; i < 6; i++) {
      let advance = Math.floor(Math.random() * 4);
      if (i === horseNumber - 1) {
        // Nerf: El caballo del usuario es más lento por defecto
        advance = Math.max(0, advance - 1);
        advance += Math.floor(userHorseBonus);
      } else {
        // Los otros caballos tienen un boost ligero
        if (Math.random() < 0.3) advance += 1;
      }
      positions[i] += advance;
    }
    
    const track = positions.map((pos, i) => {
      const trackLine = '▬'.repeat(Math.min(pos, 15)) + horses[i] + '▬'.repeat(Math.max(0, 15 - pos));
      return `${i + 1}. ${trackLine}`;
    }).join('\n');
    
    embed.setDescription(`Apostaste **${bet} Lagcoins** al caballo #${horseNumber}\n\n\`\`\`\n${track}\n\`\`\`\nRonda ${round + 1}/5`);
    await interaction.editReply({ embeds: [embed] });
  }
  
  // Determinar ganador
  const maxPos = Math.max(...positions);
  const winnerIndex = positions.indexOf(maxPos);
  const won = winnerIndex === horseNumber - 1;
  
  const multiplier = won ? odds[horseNumber - 1] : 0;
  const winnings = won ? Math.floor(bet * multiplier) - bet : -bet;
  
  economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);
  if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
  economy.casinoStats.plays++;
  if (won) {
    economy.casinoStats.wins++;
    economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
    economy.totalEarned = (economy.totalEarned || 0) + winnings;
  } else {
    economy.casinoStats.totalLost = (economy.casinoStats.totalLost || 0) + bet;
  }
  
  await saveUserEconomy(interaction.guildId, interaction.user.id, economy);
  
  embed.setColor(won ? '#00FF00' : '#FF0000');
  embed.setDescription(`${won ? '🎉 ¡GANASTE!' : '😢 Perdiste...'}\n\n**Ganador:** ${horses[winnerIndex]} ${horseNames[winnerIndex]} (#${winnerIndex + 1})\n**Tu caballo:** ${horses[horseNumber-1]} ${horseNames[horseNumber-1]} (#${horseNumber})\n\n**Resultado:** ${won ? '+' : ''}${winnings} Lagcoins\n**Nuevo saldo:** ${economy.lagcoins} Lagcoins`);
  
  return interaction.editReply({ embeds: [embed] });
}

async function handleDuelo(interaction) {
  const opponent = interaction.options.getUser('oponente');
  const bet = interaction.options.getInteger('apuesta');
  
  if (opponent.id === interaction.user.id) {
    return interaction.reply({ content: '❌ No puedes desafiarte a ti mismo', flags: 64 });
  }
  
  if (opponent.bot) {
    return interaction.reply({ content: '❌ No puedes desafiar a un bot', flags: 64 });
  }
  
  const challengerEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
  const opponentEconomy = await getUserEconomy(interaction.guildId, opponent.id);
  
  if ((challengerEconomy.lagcoins || 0) < bet) {
    return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Tienes ${challengerEconomy.lagcoins || 0}`, flags: 64 });
  }
  
  if ((opponentEconomy.lagcoins || 0) < bet) {
    return interaction.reply({ content: `❌ ${opponent.username} no tiene suficientes Lagcoins`, flags: 64 });
  }
  
  const gameId = `duelo_${interaction.user.id}_${opponent.id}_${Date.now()}`;
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_duelo_${gameId}`)
      .setLabel('Aceptar Duelo')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_duelo_${gameId}`)
      .setLabel('Rechazar')
      .setStyle(ButtonStyle.Danger)
  );
  
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚔️ ¡Duelo de Dados!')
    .setDescription(`${interaction.user} desafía a ${opponent} a un duelo de dados\n\n💰 **Apuesta:** ${bet} Lagcoins cada uno\n🏆 **Premio:** ${bet * 2} Lagcoins al ganador\n\n${opponent}, ¿aceptas el desafío?`)
    .setFooter({ text: 'El desafío expira en 60 segundos' });
  
  const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  
  activeGames.set(gameId, {
    challengerId: interaction.user.id,
    opponentId: opponent.id,
    bet,
    guildId: interaction.guildId,
    messageId: message.id
  });
  
  // Timeout para limpiar el juego
  setTimeout(async () => {
    if (activeGames.has(gameId)) {
      activeGames.delete(gameId);
      const expiredEmbed = EmbedBuilder.from(embed)
        .setColor('#888888')
        .setDescription('⏰ El desafío ha expirado');
      await message.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
    }
  }, 60000);
}

async function handlePoker(interaction) {
  const bet = interaction.options.getInteger('apuesta');
  
  const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
  
  if ((economy.lagcoins || 0) < bet) {
    return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Tienes ${economy.lagcoins || 0}`, flags: 64 });
  }
  
  // Poker simplificado: 5 cartas, gana la mejor mano
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value, numValue: values.indexOf(value) + 2 });
    }
  }
  
  // Mezclar
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  const playerHand = deck.slice(0, 5);
  const dealerHand = deck.slice(5, 10);
  
  const evaluateHand = (hand) => {
    const sorted = [...hand].sort((a, b) => b.numValue - a.numValue);
    const valueCounts = {};
    const suitCounts = {};
    
    for (const card of hand) {
      valueCounts[card.numValue] = (valueCounts[card.numValue] || 0) + 1;
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }
    
    const isFlush = Object.values(suitCounts).includes(5);
    const sortedValues = sorted.map(c => c.numValue);
    const isStraight = sortedValues.every((v, i) => i === 0 || v === sortedValues[i-1] - 1);
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    
    if (isFlush && isStraight && sorted[0].numValue === 14) return { rank: 10, name: 'Escalera Real', score: 1000 };
    if (isFlush && isStraight) return { rank: 9, name: 'Escalera de Color', score: 900 + sorted[0].numValue };
    if (counts[0] === 4) return { rank: 8, name: 'Poker', score: 800 };
    if (counts[0] === 3 && counts[1] === 2) return { rank: 7, name: 'Full House', score: 700 };
    if (isFlush) return { rank: 6, name: 'Color', score: 600 + sorted[0].numValue };
    if (isStraight) return { rank: 5, name: 'Escalera', score: 500 + sorted[0].numValue };
    if (counts[0] === 3) return { rank: 4, name: 'Trío', score: 400 };
    if (counts[0] === 2 && counts[1] === 2) return { rank: 3, name: 'Dos Pares', score: 300 };
    if (counts[0] === 2) return { rank: 2, name: 'Par', score: 200 + sorted[0].numValue };
    return { rank: 1, name: 'Carta Alta', score: sorted[0].numValue };
  };
  
  const playerEval = evaluateHand(playerHand);
  const dealerEval = evaluateHand(dealerHand);
  
  const won = playerEval.score > dealerEval.score;
  const tie = playerEval.score === dealerEval.score;
  
  let multiplier = 0;
  if (won) {
    if (playerEval.rank >= 9) multiplier = 5;
    else if (playerEval.rank >= 7) multiplier = 3;
    else if (playerEval.rank >= 5) multiplier = 2;
    else if (playerEval.rank >= 3) multiplier = 1.5;
    else multiplier = 1.2;
  } else if (tie) {
    multiplier = 1;
  }
  
  const winnings = tie ? 0 : (won ? Math.floor(bet * multiplier) - bet : -bet);
  
  economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);
  if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
  economy.casinoStats.plays++;
  if (won) {
    economy.casinoStats.wins++;
    economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
    economy.totalEarned = (economy.totalEarned || 0) + winnings;
  } else if (!tie) {
    economy.casinoStats.totalLost = (economy.casinoStats.totalLost || 0) + bet;
  }
  
  await saveUserEconomy(interaction.guildId, interaction.user.id, economy);
  
  const formatHand = (hand) => hand.map(c => `${c.value}${c.suit}`).join(' ');
  
  const embed = new EmbedBuilder()
    .setColor(won ? '#00FF00' : tie ? '#FFD700' : '#FF0000')
    .setTitle('🃏 Poker - Resultado')
    .addFields(
      { name: '🎴 Tu Mano', value: `${formatHand(playerHand)}\n**${playerEval.name}**`, inline: true },
      { name: '🎴 Casa', value: `${formatHand(dealerHand)}\n**${dealerEval.name}**`, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: '🏆 Resultado', value: won ? `¡GANASTE! +${winnings} Lagcoins` : tie ? 'Empate' : `Perdiste ${bet} Lagcoins`, inline: true },
      { name: '💰 Nuevo Saldo', value: `${economy.lagcoins} Lagcoins`, inline: true }
    );
  
  return interaction.reply({ embeds: [embed] });
}

async function handleRuleta(interaction) {
  const bet = interaction.options.getInteger('apuesta');
  const tipo = interaction.options.getString('tipo');
  
  const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
  
  if ((economy.lagcoins || 0) < bet) {
    return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Tienes ${economy.lagcoins || 0}`, flags: 64 });
  }
  
  await interaction.deferReply();
  
  // Calcular suerte
  let luckBonus = 0;
  const activePowerups = getUserActivePowerups(interaction.guildId, interaction.user.id);
  for (const powerup of activePowerups) {
    if (powerup.type === 'casino_luck' || powerup.type === 'luck_boost') {
      luckBonus += powerup.value;
    }
  }
  
  const adminBoost = getAdminBoost();
  if (adminBoost && adminBoost.systems.casino) {
    luckBonus += adminBoost.percentage;
  }
  
  // Números de ruleta (0-36)
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  
  // Animación de ruleta
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎰 Ruleta - Girando...')
    .setDescription('La bola está girando...');
  
  await interaction.editReply({ embeds: [embed] });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Resultado con influencia de suerte
  let result;
  if (luckBonus > 0 && Math.random() < luckBonus * 0.3) {
    // Con suerte, mayor probabilidad de caer en lo que apostó
    if (tipo === 'rojo') result = redNumbers[Math.floor(Math.random() * redNumbers.length)];
    else if (tipo === 'negro') result = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
    else if (tipo === 'verde') result = 0;
    else if (tipo === 'par') result = [2, 4, 6, 8, 10][Math.floor(Math.random() * 5)] * 2;
    else if (tipo === 'impar') result = [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)] * 2 + 1;
    else if (tipo === 'alto') result = Math.floor(Math.random() * 18) + 19;
    else if (tipo === 'bajo') result = Math.floor(Math.random() * 18) + 1;
  } else {
    result = Math.floor(Math.random() * 37);
  }
  
  const isRed = redNumbers.includes(result);
  const isBlack = blackNumbers.includes(result);
  const resultColor = result === 0 ? '🟢' : isRed ? '🔴' : '⚫';
  
  let won = false;
  let multiplier = 0;
  
  switch (tipo) {
    case 'rojo':
      won = isRed;
      multiplier = 1.8;
      break;
    case 'negro':
      won = isBlack;
      multiplier = 1.8;
      break;
    case 'verde':
      won = result === 0;
      // Probabilidad de x3 es muy baja (5%), de lo contrario x2.5
      multiplier = Math.random() < 0.05 ? 3 : 2.2;
      break;
    case 'par':
      won = result !== 0 && result % 2 === 0;
      multiplier = 1.8;
      break;
    case 'impar':
      won = result % 2 === 1;
      multiplier = 1.8;
      break;
    case 'alto':
      won = result >= 19 && result <= 36;
      multiplier = 1.8;
      break;
    case 'bajo':
      won = result >= 1 && result <= 18;
      multiplier = 1.8;
      break;
  }
  
  const winnings = won ? Math.floor(bet * multiplier) - bet : -bet;
  
  economy.lagcoins = Math.max(0, (economy.lagcoins || 0) + winnings);
  if (!economy.casinoStats) economy.casinoStats = { plays: 0, wins: 0, totalWon: 0, totalLost: 0 };
  economy.casinoStats.plays++;
  if (won) {
    economy.casinoStats.wins++;
    economy.casinoStats.totalWon = (economy.casinoStats.totalWon || 0) + winnings;
    economy.totalEarned = (economy.totalEarned || 0) + winnings;
  } else {
    economy.casinoStats.totalLost = (economy.casinoStats.totalLost || 0) + bet;
  }
  
  await saveUserEconomy(interaction.guildId, interaction.user.id, economy);
  
  const tipoNames = {
    'rojo': '🔴 Rojo',
    'negro': '⚫ Negro',
    'verde': '🟢 Verde/0',
    'par': 'Par',
    'impar': 'Impar',
    'alto': 'Alto (19-36)',
    'bajo': 'Bajo (1-18)'
  };
  
  embed.setColor(won ? '#00FF00' : '#FF0000');
  embed.setTitle(`🎰 Ruleta - ${resultColor} ${result}`);
  embed.setDescription(`**Tu apuesta:** ${tipoNames[tipo]} (${bet} Lagcoins)\n\n${won ? '🎉 ¡GANASTE!' : '😢 Perdiste...'}\n\n**Resultado:** ${won ? '+' : ''}${winnings} Lagcoins\n**Nuevo saldo:** ${economy.lagcoins} Lagcoins`);
  
  return interaction.editReply({ embeds: [embed] });
}
