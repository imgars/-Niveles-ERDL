import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isMongoConnected, saveUserToMongo } from '../utils/mongoSync.js';

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Establece tu estado como AFK')
    .addStringOption(option => 
      option.setName('motivo')
        .setDescription('El motivo de tu AFK')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    if (interaction.replied || interaction.deferred) return;
    const reason = interaction.options.getString('motivo') || 'No especificado';
    const userData = db.getUser(interaction.guild.id, interaction.user.id);
    
    userData.afk = {
      status: true,
      reason: reason,
      timestamp: Date.now()
    };
    
    db.saveUser(interaction.guild.id, interaction.user.id, userData);
    
    // Cambiar nombre a [AFK]
    if (interaction.member && interaction.member.manageable) {
      const oldNickname = interaction.member.nickname || interaction.user.username;
      if (!oldNickname.startsWith('[AFK] ')) {
        interaction.member.setNickname(`[AFK] ${oldNickname}`).catch(console.error);
      }
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00) // Amarillo
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('Estado ausente establecido.')
      .setDescription(`**Motivo:** ${reason}\n\n-# Avisaré a quienes te mencionan ⭐`)
      .setThumbnail(interaction.user.displayAvatarURL());
      
    return interaction.reply({ embeds: [embed] });
  }
};
