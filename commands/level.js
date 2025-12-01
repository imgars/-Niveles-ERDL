import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/database.js';
import { getXPProgress } from '../utils/xpSystem.js';
import { generateRankCard } from '../utils/cardGenerator.js';

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
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);
    
    const userData = db.getUser(interaction.guild.id, targetUser.id);
    const progress = getXPProgress(userData.totalXp, userData.level);
    
    await interaction.deferReply();
    
    try {
      const cardBuffer = await generateRankCard(member, userData, progress);
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });
      
      const rewardBtn = new ButtonBuilder()
        .setCustomId('earn_rewards')
        .setLabel('🎮 Gana Recompensas')
        .setStyle(ButtonStyle.Primary);
      
      const row = new ActionRowBuilder().addComponents(rewardBtn);
      
      await interaction.editReply({ files: [attachment], components: [row] });
    } catch (error) {
      console.error('Error generating rank card:', error);
      await interaction.editReply({
        embeds: [{
          color: 0x7289DA,
          title: `📊 Nivel de ${targetUser.username}`,
          fields: [
            { name: 'Nivel', value: `${userData.level}`, inline: true },
            { name: 'XP', value: `${Math.floor(progress.current)} / ${Math.floor(progress.needed)}`, inline: true },
            { name: 'Progreso', value: `${Math.floor(progress.percentage)}%`, inline: true }
          ]
        }],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('earn_rewards')
            .setLabel('🎮 Gana Recompensas')
            .setStyle(ButtonStyle.Primary)
        )]
      });
    }
  }
};
