import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { addLevels, calculateLevel } from '../utils/xpSystem.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addlevel')
    .setDescription('[Staff] Añade niveles a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario al que añadir niveles')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de niveles a añadir')
        .setRequired(true)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    const levels = interaction.options.getInteger('cantidad');
    
    const userData = db.getUser(interaction.guild.id, targetUser.id);
    const oldLevel = userData.level;
    
    userData.totalXp = addLevels(userData.totalXp, levels);
    userData.level = calculateLevel(userData.totalXp);
    
    db.saveUser(interaction.guild.id, targetUser.id, userData);
    
    await interaction.reply({
      embeds: [{
        color: 0x43B581,
        title: '✅ Niveles Añadidos',
        description: `Se han añadido **${levels} niveles** a <@${targetUser.id}>`,
        fields: [
          { name: 'Nivel Anterior', value: `${oldLevel}`, inline: true },
          { name: 'Nivel Actual', value: `${userData.level}`, inline: true }
        ]
      }]
    });
  }
};
