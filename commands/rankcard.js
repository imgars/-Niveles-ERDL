import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import db from '../utils/database.js';
import { getAvailableThemes, getCardTheme, getThemeButtonStyle } from '../utils/cardGenerator.js';
import { createVerificationToken } from '../utils/rankcardService.js';
import { isStaff } from '../utils/helpers.js';

const THEME_NAMES = {
  pixel: '🎮 Pixel Art',
  ocean: '🌊 Océano',
  zelda: '⚔️ Zelda',
  pokemon: '🔴 Pokémon',
  geometrydash: '⚡ Geometry Dash',
  night: '🌙 Noche Estrellada',
  roblox: '🟦 Roblox',
  minecraft: '⛏️ Minecraft',
  fnaf: '🐻 FNAF'
};

export default {
  data: new SlashCommandBuilder()
    .setName('rankcard')
    .setDescription('Gestiona tu tarjeta de rango')
    .addSubcommand(subcommand =>
      subcommand
        .setName('select')
        .setDescription('Selecciona el tema de tu tarjeta')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('link')
        .setDescription('Solo staff: genera enlace para el editor web de rankcards (7500 Lagcoins base)')
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'link') {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member || !isStaff(member)) {
          return interaction.reply({
            content: '❌ Solo el **staff** puede usar este comando. Pide un enlace a un administrador.',
            flags: 64
          });
        }
        const token = createVerificationToken(interaction.user.id, interaction.guild.id);
        const baseUrl = process.env.WEB_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
        const editorUrl = `${baseUrl}/rankcard-editor.html?token=${token}`;

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🎨 Editor de Rankcard Personalizada')
          .setDescription('Usa el enlace abajo para diseñar tu rankcard en la web. **Válido por 15 minutos.**')
          .addFields(
            { name: '💰 Precio Base', value: '7,500 Lagcoins', inline: true },
            { name: '📷 Imagen Extra', value: '+500 LC c/u', inline: true },
            { name: '✒️ Tipografía Premium', value: '+1,000 LC (VIP/Booster)', inline: true },
            { name: '🔗 Enlace', value: `[Abrir Editor](${editorUrl})`, inline: false },
            { name: '⚠️ Importante', value: 'Este enlace es privado. Solo tú debes usarlo. Te he enviado una copia por DM.', inline: false }
          )
          .setFooter({ text: 'Usa /level para ver tu tarjeta actual' });

        await interaction.reply({ embeds: [embed], flags: 64 });

        try {
          const dmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎨 Tu enlace de editor de Rankcard')
            .setDescription(`[Haz clic aquí para abrir el editor](${editorUrl})`)
            .setFooter({ text: 'Expira en 15 minutos' });
          await interaction.user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          await interaction.followUp({ content: '❌ No pude enviarte el DM. Abre el enlace del mensaje anterior (tu perfil debe aceptar DMs).', flags: 64 });
        }
        return;
      }
      
      if (subcommand === 'select') {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const userData = db.getUser(interaction.guild.id, interaction.user.id);
        const purchasedCards = userData.purchasedCards || [];
        const available = await getAvailableThemes(member, userData.level, purchasedCards);

        if (available.length === 1) {
          return interaction.reply({
            content: `❌ Solo tienes 1 tema disponible: ${THEME_NAMES[available[0]]}`,
            flags: 64
          });
        }

        const select = new StringSelectMenuBuilder()
          .setCustomId('rankcard_theme_select')
          .setPlaceholder('Elige tu tema de tarjeta')
          .addOptions(
            available.map(theme =>
              new StringSelectMenuOptionBuilder()
                .setLabel(THEME_NAMES[theme] || theme)
                .setValue(theme)
                .setDescription(`Cambia a tema ${THEME_NAMES[theme]}`)
                .setDefault(userData.selectedCardTheme === theme)
            )
          );

        const row = new ActionRowBuilder().addComponents(select);

        const embed = new EmbedBuilder()
          .setColor('#FF10F0')
          .setTitle('🎨 Selecciona tu Tarjeta de Rango')
          .setDescription(`Tienes ${available.length} temas disponibles`)
          .addFields(
            { name: 'Seleccionado', value: `${THEME_NAMES[userData.selectedCardTheme || 'automático']}` }
          );

        return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
      }
    } catch (error) {
      console.error('Error in rankcard command:', error);
      return interaction.reply({ content: `❌ Error: ${error.message}`, flags: 64 });
    }
  }
};
