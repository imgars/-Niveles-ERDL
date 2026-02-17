import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banxp')
    .setDescription('[Staff] Banea a un usuario o canal de ganar XP')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Banear usuario de ganar XP')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario a banear')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('duracion')
            .setDescription('Duración en minutos (0 = permanente)')
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Banear canal de dar XP')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal a banear')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'user') {
      const user = interaction.options.getUser('usuario');
      const duration = interaction.options.getInteger('duracion');
      const durationMs = duration > 0 ? duration * 60 * 1000 : null;
      
      db.banUser(user.id, durationMs);
      
      return interaction.reply({
        embeds: [{
          color: 0xF04747,
          title: '🚫 Usuario Baneado de XP',
          description: `<@${user.id}> no podrá ganar XP`,
          fields: [{ name: 'Duración', value: duration > 0 ? `${duration} minutos` : 'Permanente' }]
        }]
      });
    }
    
    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('canal');
      
      db.banChannel(channel.id);
      
      return interaction.reply({
        embeds: [{
          color: 0xF04747,
          title: '🚫 Canal Baneado de XP',
          description: `No se podrá ganar XP en <#${channel.id}>`
        }]
      });
    }
  }
};
