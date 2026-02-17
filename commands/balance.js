import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Ver tu saldo de Lagcoins')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver saldo')
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const economy = await getUserEconomy(interaction.guildId, targetUser.id);

    if (!economy) {
      return interaction.reply({ content: '❌ Error al obtener saldo', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`💰 Saldo de ${targetUser.username}`)
      .addFields(
        { name: 'Cartera', value: `💵 ${economy.lagcoins} Lagcoins` },
        { name: 'Banco', value: `🏦 ${economy.bankBalance || 0} Lagcoins` },
        { name: 'Total', value: `💎 ${(economy.lagcoins || 0) + (economy.bankBalance || 0)} Lagcoins` }
      )
      .setThumbnail(targetUser.displayAvatarURL());

    return interaction.reply({ embeds: [embed] });
  }
};
