import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import db from '../utils/database.js';
import { getAvailableThemes, getCardTheme, getThemeButtonStyle } from '../utils/cardGenerator.js';

const THEME_NAMES = {
  pixel: '🎮 Pixel Art',
  ocean: '🌊 Océano',
  zelda: '⚔️ Zelda',
  pokemon: '🔴 Pokémon',
  geometrydash: '⚡ Geometry Dash',
  night: '🌙 Noche Estrellada',
  roblox: '🟥 Roblox',
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
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'select') {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const userData = db.getUser(interaction.guild.id, interaction.user.id);
        const available = await getAvailableThemes(member, userData.level);

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
