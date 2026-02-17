import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { calculateLevel } from '../utils/xpSystem.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('[Staff] Gestiona la XP de usuarios')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Añade XP a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad de XP')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Quita XP a un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad de XP')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Resetea la XP de un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('usuario');
    const userData = db.getUser(interaction.guild.id, targetUser.id);
    const oldLevel = userData.level;
    
    if (subcommand === 'add') {
      const amount = interaction.options.getInteger('cantidad');
      userData.totalXp += amount;
      userData.level = calculateLevel(userData.totalXp);
      db.saveUser(interaction.guild.id, targetUser.id, userData);
      
      return interaction.reply({
        embeds: [{
          color: 0x43B581,
          title: '✅ XP Añadida',
          description: `Se han añadido **${amount} XP** a <@${targetUser.id}>`,
          fields: [
            { name: 'XP Total', value: `${Math.floor(userData.totalXp)}`, inline: true },
            { name: 'Nivel', value: `${userData.level}`, inline: true }
          ]
        }]
      });
    }
    
    if (subcommand === 'remove') {
      const amount = interaction.options.getInteger('cantidad');
      userData.totalXp = Math.max(0, userData.totalXp - amount);
      userData.level = calculateLevel(userData.totalXp);
      db.saveUser(interaction.guild.id, targetUser.id, userData);
      
      return interaction.reply({
        embeds: [{
          color: 0xF04747,
          title: '✅ XP Quitada',
          description: `Se han quitado **${amount} XP** a <@${targetUser.id}>`,
          fields: [
            { name: 'XP Total', value: `${Math.floor(userData.totalXp)}`, inline: true },
            { name: 'Nivel', value: `${userData.level}`, inline: true }
          ]
        }]
      });
    }
    
    if (subcommand === 'reset') {
      userData.totalXp = 0;
      userData.level = 0;
      db.saveUser(interaction.guild.id, targetUser.id, userData);
      
      return interaction.reply({
        embeds: [{
          color: 0xF04747,
          title: '✅ XP Reseteada',
          description: `La XP de <@${targetUser.id}> ha sido reseteada a 0`
        }]
      });
    }
  }
};
