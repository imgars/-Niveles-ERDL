import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { getTotalXPForLevel, calculateLevel } from '../utils/xpSystem.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('[Staff] Establece el nivel de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('nivel')
        .setDescription('Nuevo nivel')
        .setRequired(true)
        .setMinValue(0)
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const targetUser = interaction.options.getUser('usuario');
    const newLevel = interaction.options.getInteger('nivel');
    
    const userData = db.getUser(interaction.guild.id, targetUser.id);
    userData.totalXp = getTotalXPForLevel(newLevel);
    userData.level = newLevel;
    
    db.saveUser(interaction.guild.id, targetUser.id, userData);
    
    await interaction.reply({
      embeds: [{
        color: 0x7289DA,
        title: '✅ Nivel Establecido',
        description: `El nivel de <@${targetUser.id}> ha sido establecido a **${newLevel}**`
      }]
    });
  }
};
