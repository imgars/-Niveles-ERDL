import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import db from '../utils/database.js';
import { CONFIG } from '../config.js';
import { getXPProgress, getSimplifiedBoostsText, getBoostTextForCard } from '../utils/xpSystem.js';
import { generateRankCard, getCardTheme, getThemeButtonColor } from '../utils/cardGenerator.js';
import { getNightBoostStatus } from '../utils/timeBoost.js';

const buttonStyleMap = {
  'Primary': ButtonStyle.Primary,
  'Secondary': ButtonStyle.Secondary,
  'Success': ButtonStyle.Success,
  'Danger': ButtonStyle.Danger
};

function formatBoostDetails(boosts, member, nightBoost) {
  const lines = [];
  
  if (member.roles.cache.has(CONFIG.BOOSTER_ROLE_ID)) {
    lines.push(`💎 **Booster:** +200%`);
  }
  if (member.roles.cache.has(CONFIG.VIP_ROLE_ID)) {
    lines.push(`⭐ **VIP:** +200%`);
  }
  
  if (nightBoost && nightBoost.active) {
    lines.push(`🌙 **Nocturno:** +25% (18:00-06:00 VE)`);
  }
  
  if (boosts && boosts.length > 0) {
    for (const boost of boosts) {
      let percentage;
      if (boost.multiplier >= 100) {
        percentage = Math.round(boost.multiplier - 100);
      } else if (boost.multiplier >= 1 && boost.multiplier < 100) {
        percentage = Math.round((boost.multiplier - 1) * 100);
      } else {
        percentage = Math.round(boost.multiplier * 100);
      }
      
      let timeLeft = '';
      
      if (boost.expiresAt) {
        const now = Date.now();
        const expiresAt = new Date(boost.expiresAt).getTime();
        const diff = expiresAt - now;
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            timeLeft = ` (${hours}h ${minutes}m restantes)`;
          } else {
            timeLeft = ` (${minutes}m restantes)`;
          }
        }
      } else {
        timeLeft = ' (Permanente)';
      }
      
      let boostType = '🚀';
      if (boost.userId) boostType = '👤';
      else if (boost.channelId) boostType = '📢';
      else boostType = '🌍';
      
      lines.push(`${boostType} **Boost:** +${percentage}%${timeLeft}`);
    }
  }
  
  return lines.length > 0 ? lines.join('\n') : null;
}

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

      const userData = db.getUser(interaction.guild.id, targetUser.id) || { level: 0, totalXp: 0 };
      const progress = getXPProgress(userData.totalXp || 0, userData.level || 0);
      const boosts = db.getActiveBoosts(targetUser.id, interaction.channelId) || [];
      
      let nightBoost = { active: false };
      try {
        nightBoost = getNightBoostStatus();
      } catch (e) {}
      
      const boostsText = getSimplifiedBoostsText(boosts);
      const boostCardText = getBoostTextForCard(boosts);
      
      const boostDetails = formatBoostDetails(boosts, member, nightBoost);

      const theme = await getCardTheme(member, userData.level || 0, userData.selectedCardTheme, userData.purchasedCards || []);
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
        
        const replyOptions = { 
          files: [attachment], 
          components: [row] 
        };
        
        if (boostDetails) {
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🚀 Boosts Activos')
            .setDescription(boostDetails);
          replyOptions.embeds = [embed];
        }

        return await interaction.reply(replyOptions);
      } catch (error) {
        console.error('Error generating rank card:', error);

        const rewardBtn = new ButtonBuilder()
          .setCustomId('earn_rewards')
          .setLabel('🎮 Gana Recompensas')
          .setStyle(buttonStyle);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`📊 Nivel de ${targetUser.username}`)
          .addFields(
            { name: 'Nivel', value: `${userData.level || 0}`, inline: true },
            { name: 'XP', value: `${Math.floor(progress.current)} / ${Math.floor(progress.needed)}`, inline: true },
            { name: 'Progreso', value: `${Math.floor(progress.percentage)}%`, inline: true }
          );

        if (boostDetails) {
          embed.setDescription(boostDetails);
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
