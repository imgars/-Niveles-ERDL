import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserProfile } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Ver tu perfil o el de otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que ver perfil')
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const profile = await getUserProfile(interaction.guildId, targetUser.id);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`📊 Perfil de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '💵 Cartera', value: `${profile.lagcoins} Lagcoins`, inline: true },
        { name: '🏦 Banco', value: `${profile.bankBalance} Lagcoins`, inline: true },
        { name: '💎 Total', value: `${profile.lagcoins + profile.bankBalance} Lagcoins`, inline: true },
        { name: '📈 Total Ganado', value: `${profile.totalEarned} Lagcoins`, inline: true },
        { name: '🎒 Items', value: profile.items.length > 0 ? profile.items.join(', ') : 'Ninguno', inline: true },
        { name: '📅 Miembro Desde', value: new Date(profile.createdAt).toLocaleDateString('es-ES'), inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  }
};
