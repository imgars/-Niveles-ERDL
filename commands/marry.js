import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

const pendingProposals = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Cásate con otro usuario y comparte tu cuenta de economía')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario con quien casarte')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes casarte contigo mismo/a', flags: 64 });
    }

    if (target.bot) {
      return interaction.reply({ content: '❌ No puedes casarte con un bot', flags: 64 });
    }

    const userEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
    const targetEconomy = await getUserEconomy(interaction.guildId, target.id);

    if (userEconomy.marriedTo) {
      return interaction.reply({ content: `❌ Ya estás casado/a con <@${userEconomy.marriedTo}>`, flags: 64 });
    }

    if (targetEconomy.marriedTo) {
      return interaction.reply({ content: `❌ ${target.username} ya está casado/a con otra persona`, flags: 64 });
    }

    const proposalKey = `${interaction.guildId}-${interaction.user.id}-${target.id}`;
    pendingProposals.set(proposalKey, {
      proposer: interaction.user.id,
      target: target.id,
      guildId: interaction.guildId,
      timestamp: Date.now()
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`marry_accept_${proposalKey}`)
          .setLabel('💕 Aceptar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`marry_reject_${proposalKey}`)
          .setLabel('💔 Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle('💍 ¡Propuesta de Matrimonio!')
      .setDescription(`**${interaction.user.username}** le ha propuesto matrimonio a **${target.username}**!\n\n${target.username}, ¿aceptas compartir tu vida (y tu cartera) con ${interaction.user.username}?`)
      .setImage('https://media.tenor.com/uT_xf0P7bKoAAAAC/anime-proposal.gif')
      .addFields({ name: '⚠️ Nota', value: 'Al casarse, ambas cuentas de economía se fusionarán en una sola cartera compartida.' })
      .setFooter({ text: 'La propuesta expira en 60 segundos' });

    const reply = await interaction.reply({ 
      content: `<@${target.id}>`,
      embeds: [embed], 
      components: [row] 
    });

    logActivity({
      type: LOG_TYPES.MARRIAGE,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'marry',
      commandOptions: { usuario: target.id },
      importance: 'medium',
      result: 'success',
      details: { pareja: target.username, estado: 'propuesta' }
    });

    setTimeout(() => {
      if (pendingProposals.has(proposalKey)) {
        pendingProposals.delete(proposalKey);
        interaction.editReply({
          embeds: [embed.setFooter({ text: 'La propuesta ha expirado' })],
          components: []
        }).catch(() => {});
      }
    }, 60000);
  }
};

export { pendingProposals };
