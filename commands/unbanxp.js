import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unbanxp')
    .setDescription('[Staff] Desbanea a un usuario o canal de ganar XP')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Desbanear usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario a desbanear')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Desbanear canal')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal a desbanear')
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
      db.unbanUser(user.id);
      
      return interaction.reply({
        embeds: [{
          color: 0x43B581,
          title: '✅ Usuario Desbaneado',
          description: `<@${user.id}> puede volver a ganar XP`
        }]
      });
    }
    
    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('canal');
      db.unbanChannel(channel.id);
      
      return interaction.reply({
        embeds: [{
          color: 0x43B581,
          title: '✅ Canal Desbaneado',
          description: `Se puede volver a ganar XP en <#${channel.id}>`
        }]
      });
    }
  }
};
