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
    const reason = interaction.options.getString('motivo') || 'No especificado';
    const userData = db.getUser(interaction.guild.id, interaction.user.id);
    
    userData.afk = {
      status: true,
      reason: reason,
      timestamp: Date.now()
    };
    
    db.saveUser(interaction.guild.id, interaction.user.id, userData);
    
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00) // Amarillo
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('Estado ausente establecido.')
      .setDescription(`**Motivo:** ${reason}\n\nAvisaré a quienes te mencionen ⭐`)
      .setThumbnail(interaction.user.displayAvatarURL());
      
    return interaction.reply({ embeds: [embed] });
  }
};
