import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { generateGameImage, SUPPORTED_GAMES, isGeminiConfigured } from '../utils/geminiImageGenerator.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gamecard')
    .setDescription('Genera tarjetas de videojuegos con IA')
    .addSubcommand(subcommand =>
      subcommand
        .setName('profile')
        .setDescription('Genera una tarjeta de perfil de videojuego')
        .addStringOption(option =>
          option.setName('juego')
            .setDescription('Elige el videojuego')
            .setRequired(true)
            .addChoices(...SUPPORTED_GAMES)
        )
        .addStringOption(option =>
          option.setName('nombre')
            .setDescription('Nombre del jugador/personaje')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('peticion')
            .setDescription('Petición personalizada (opcional) - ej: "con armadura dorada"')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('battle')
        .setDescription('Genera una tarjeta de batalla épica')
        .addStringOption(option =>
          option.setName('juego')
            .setDescription('Elige el videojuego')
            .setRequired(true)
            .addChoices(...SUPPORTED_GAMES)
        )
        .addStringOption(option =>
          option.setName('nombre')
            .setDescription('Nombre del jugador/personaje')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('peticion')
            .setDescription('Petición personalizada (opcional) - ej: "peleando contra un dragón"')
            .setRequired(false)
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const juego = interaction.options.getString('juego');
    const nombre = interaction.options.getString('nombre');
    const peticion = interaction.options.getString('peticion') || '';

    if (!isGeminiConfigured()) {
      return interaction.reply({
        embeds: [{
          color: 0xFF0000,
          title: '❌ Servicio no disponible',
          description: 'El servicio de generación de imágenes con IA no está configurado. Contacta al administrador del bot.'
        }],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const gameNames = {
      roblox: 'Roblox',
      minecraft: 'Minecraft',
      brawlstars: 'Brawl Stars',
      geometrydash: 'Geometry Dash',
      fortnite: 'Fortnite',
      clash: 'Clash Royale/CoC',
      genshin: 'Genshin Impact',
      valorant: 'Valorant'
    };

    const gameEmojis = {
      roblox: '🟦',
      minecraft: '⛏️',
      brawlstars: '⭐',
      geometrydash: '⚡',
      fortnite: '🎯',
      clash: '⚔️',
      genshin: '🌸',
      valorant: '🔫'
    };

    const cardTypeNames = {
      profile: 'Perfil',
      battle: 'Batalla'
    };

    try {
      await interaction.editReply({
        embeds: [{
          color: 0x9B59B6,
          title: '🎨 Generando tu tarjeta...',
          description: `Creando tarjeta de **${cardTypeNames[subcommand]}** para **${nombre}**\n\n🎮 Juego: ${gameEmojis[juego]} ${gameNames[juego]}\n${peticion ? `✨ Petición: ${peticion}` : ''}\n\n⏳ Esto puede tomar unos segundos...`,
        }]
      });

      const imageBuffer = await generateGameImage(juego, nombre, subcommand, peticion);
      const attachment = new AttachmentBuilder(imageBuffer, { name: `${subcommand}_card_${nombre}.png` });

      logActivity({
        type: LOG_TYPES.GAMECARD_GENERATE,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
        command: `gamecard ${subcommand}`,
        importance: 'low',
        result: 'success',
        details: { juego: gameNames[juego], nombre, tipo: subcommand, peticion: peticion || '' }
      });

      const embed = new EmbedBuilder()
        .setColor(subcommand === 'battle' ? 0xFF4444 : 0x44FF44)
        .setTitle(`${gameEmojis[juego]} Tarjeta de ${cardTypeNames[subcommand]}: ${nombre}`)
        .setDescription(`🎮 **Juego:** ${gameNames[juego]}\n${peticion ? `✨ **Petición:** ${peticion}` : ''}`)
        .setImage(`attachment://${subcommand}_card_${nombre}.png`)
        .setFooter({ text: `Generado con IA por Niveles Bot • /gamecard ${subcommand}` })
        .setTimestamp();

      return interaction.editReply({
        embeds: [embed],
        files: [attachment]
      });
    } catch (error) {
      console.error('Error en gamecard:', error);
      
      let errorMessage = '❌ Error al generar la tarjeta.';
      if (error.message?.includes('quota') || error.message?.includes('rate')) {
        errorMessage = '❌ Se ha alcanzado el límite de generación. Intenta de nuevo en unos minutos.';
      } else if (error.message?.includes('API')) {
        errorMessage = '❌ Error de conexión con el servicio de IA. Intenta de nuevo.';
      }
      
      return interaction.editReply({
        embeds: [{
          color: 0xFF0000,
          title: '❌ Error',
          description: `${errorMessage}\n\nDetalles: ${error.message || 'Error desconocido'}`
        }]
      });
    }
  }
};
