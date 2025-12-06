import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';
import { getXPProgress, getSimplifiedBoostsText, getBoostTextForCard } from '../utils/xpSystem.js';
import { generateRankCard, getCardTheme, getThemeButtonColor } from '../utils/cardGenerator.js';

const buttonStyleMap = {
  'Primary': ButtonStyle.Primary,
  'Secondary': ButtonStyle.Secondary,
  'Success': ButtonStyle.Success,
  'Danger': ButtonStyle.Danger
};

export default {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Muestra el nivel y XP de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario a consultar')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id);

      const userData = db.getUser(interaction.guild.id, targetUser.id);
      const progress = getXPProgress(userData.totalXp, userData.level);
      const boosts = db.getActiveBoosts(targetUser.id, interaction.channelId);
      const boostsText = getSimplifiedBoostsText(boosts);
      const boostCardText = getBoostTextForCard(boosts);

      const theme = await getCardTheme(member, userData.level, userData.selectedCardTheme);
      const buttonColor = getThemeButtonColor(theme);
      const buttonStyle = buttonStyleMap[buttonColor] || ButtonStyle.Primary;

      try {
        const cardBuffer = await generateRankCard(member, userData, progress, boostCardText);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

        const rewardBtn = new ButtonBuilder()
          .setCustomId('earn_rewards')
          .setLabel('🎮 Gana Recompensas')
          .setStyle(buttonStyle);

        const row = new ActionRowBuilder().addComponents(rewardBtn);

        return await interaction.reply({ 
          files: [attachment], 
          components: [row] 
        });
      } catch (error) {
        console.error('Error generating rank card:', error);

        const rewardBtn = new ButtonBuilder()
          .setCustomId('earn_rewards')
          .setLabel('🎮 Gana Recompensas')
          .setStyle(buttonStyle);

        const embed = {
          color: 0x5865F2,
          title: `📊 Nivel de ${targetUser.username}`,
          fields: [
            { name: 'Nivel', value: `${userData.level}`, inline: true },
            { name: 'XP', value: `${Math.floor(progress.current)} / ${Math.floor(progress.needed)}`, inline: true },
            { name: 'Progreso', value: `${Math.floor(progress.percentage)}%`, inline: true }
          ]
        };

        if (boostsText) {
          embed.description = boostsText;
        }

        return await interaction.reply({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(rewardBtn)]
        });
      }
    } catch (error) {
      console.error('Error in level command:', error);
      return await interaction.reply({ content: `❌ Error: ${error.message}`, flags: 64 });
    }
  }
};
