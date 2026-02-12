import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';
import { logActivity, LOG_TYPES } from '../utils/activityLogger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Divórciarte de tu pareja actual'),

  async execute(interaction) {
    const userEconomy = await getUserEconomy(interaction.guildId, interaction.user.id);
    console.log(`[Divorce] User ${interaction.user.id} marriedTo: ${userEconomy.marriedTo}`);

    if (!userEconomy.marriedTo) {
      return interaction.reply({ content: '❌ No estás casado/a con nadie', flags: 64 });
    }

    const partnerId = userEconomy.marriedTo;
    const partnerEconomy = await getUserEconomy(interaction.guildId, partnerId);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`divorce_confirm_${interaction.user.id}`)
          .setLabel('💔 Confirmar Divorcio')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`divorce_cancel_${interaction.user.id}`)
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    const totalCoins = (userEconomy.lagcoins || 0) + (partnerEconomy.lagcoins || 0);
    const splitAmount = Math.floor(totalCoins / 2);

    const embed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle('💔 Confirmar Divorcio')
      .setDescription(`¿Estás seguro/a de que quieres divorciarte de <@${partnerId}>?`)
      .addFields(
        { name: '💰 Lagcoins Totales', value: `${totalCoins}`, inline: true },
        { name: '📊 Cada uno recibirá', value: `${splitAmount}`, inline: true }
      )
      .setImage('https://media.tenor.com/MbdLmMq8r8wAAAAC/anime-sad.gif')
      .setFooter({ text: 'Esta acción no se puede deshacer' });

    logActivity({
      type: LOG_TYPES.DIVORCE,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
      command: 'divorce',
      importance: 'medium',
      result: 'success',
      details: { pareja: partnerId, estado: 'solicitud' }
    });

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};
