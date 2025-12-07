import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { CONFIG } from '../config.js';
import db from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboardcard')
    .setDescription('Selecciona el estilo de tu leaderboard elite')
    .addSubcommand(subcommand =>
      subcommand
        .setName('select')
        .setDescription('Elige tu estilo de leaderboard para el top 100+')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'select') {
      await handleSelect(interaction);
    }
  }
};

async function handleSelect(interaction) {
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const userData = db.getUser(interaction.guild.id, interaction.user.id);
  const userLevel = userData.level || 0;
  const isSuperActive = member.roles.cache.has(CONFIG.LEVEL_ROLES[35]);
  
  const availableThemes = [];
  
  if (userLevel >= 100) {
    availableThemes.push(
      { label: '⛏️ Minecraft', value: 'minecraft', description: 'Estilo Minecraft clásico' },
      { label: '🔥 Pokemon', value: 'pokemon', description: 'Estilo Pokemon con colores de fuego' }
    );
  }
  
  if (isSuperActive) {
    availableThemes.push(
      { label: '⚔️ Zelda', value: 'zelda', description: 'Estilo Legend of Zelda' }
    );
  }
  
  if (availableThemes.length === 0) {
    return interaction.reply({
      embeds: [{
        color: 0xFF0000,
        title: '❌ Sin Acceso',
        description: 'No tienes acceso a estilos de leaderboard especiales.\n\n**Requisitos:**\n• **Nivel 100+**: Desbloquea Minecraft y Pokemon\n• **Rol Super Activo (Nivel 35+)**: Desbloquea Zelda',
        footer: { text: '¡Sigue subiendo de nivel para desbloquear más estilos!' }
      }],
      ephemeral: true
    });
  }
  
  const currentTheme = userData.selectedLeaderboardTheme || 'minecraft';
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('leaderboard_theme_select')
    .setPlaceholder('Selecciona un estilo de leaderboard')
    .addOptions(availableThemes);
  
  const row = new ActionRowBuilder().addComponents(selectMenu);
  
  const msg = await interaction.reply({
    embeds: [{
      color: 0x7289DA,
      title: '🎨 Selecciona tu Estilo de Leaderboard',
      description: `Tu estilo actual: **${getThemeName(currentTheme)}**\n\nElige el estilo que quieres usar cuando veas el leaderboard elite (100+):`,
      fields: availableThemes.map(t => ({
        name: t.label,
        value: t.description,
        inline: true
      }))
    }],
    components: [row],
    fetchReply: true
  });
  
  const collector = msg.createMessageComponentCollector({ time: 60000 });
  
  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Este menú no es para ti.', ephemeral: true });
    }
    
    const selectedTheme = i.values[0];
    
    userData.selectedLeaderboardTheme = selectedTheme;
    db.saveUser(interaction.guild.id, interaction.user.id, userData);
    
    await i.update({
      embeds: [{
        color: 0x43B581,
        title: '✅ Estilo Actualizado',
        description: `Tu estilo de leaderboard ha sido cambiado a: **${getThemeName(selectedTheme)}**\n\nUsa \`/leaderboard tipo:elite\` para ver el leaderboard con tu nuevo estilo.`
      }],
      components: []
    });
    
    collector.stop();
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && collected.size === 0) {
      interaction.editReply({
        embeds: [{
          color: 0xF04747,
          title: '⏱️ Tiempo Agotado',
          description: 'No seleccionaste ningún estilo.'
        }],
        components: []
      }).catch(() => {});
    }
  });
}

function getThemeName(theme) {
  const names = {
    minecraft: '⛏️ Minecraft',
    pokemon: '🔥 Pokemon',
    zelda: '⚔️ Zelda'
  };
  return names[theme] || theme;
}
