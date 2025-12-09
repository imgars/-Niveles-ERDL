import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('(Staff) Hacer ping a cualquier rol incluyendo @everyone')
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('El rol a mencionar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('Mensaje opcional para acompañar el ping')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Solo el staff puede usar este comando', 
        flags: 64 
      });
    }

    const role = interaction.options.getRole('rol');
    const mensaje = interaction.options.getString('mensaje') || '';
    
    const isEveryone = role.id === interaction.guild.id;
    
    let content;
    if (isEveryone) {
      content = `@everyone ${mensaje}`.trim();
    } else {
      content = `<@&${role.id}> ${mensaje}`.trim();
    }

    await interaction.reply({ 
      content: '✅ Ping enviado', 
      flags: 64 
    });

    await interaction.channel.send({
      content: content,
      allowedMentions: { 
        roles: [role.id],
        parse: isEveryone ? ['everyone'] : []
      }
    });
  }
};
