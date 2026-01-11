import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removebankcoins')
    .setDescription('(Staff) Quitar Lagcoins del BANCO de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quitar Lagcoins del banco')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de Lagcoins a quitar')
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para quitar Lagcoins'),
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');
    const reason = interaction.options.getString('razon') || 'Retiro administrativo';

    try {
      const economy = await getUserEconomy(interaction.guildId, targetUser.id);
      
      if ((economy.bank || 0) < amount) {
          // Si queremos permitir saldo negativo en banco por staff, lo dejamos así.
          // Si no, podríamos limitarlo:
          // return interaction.editReply({ content: `❌ El usuario solo tiene **${economy.bank || 0} Lagcoins** en el banco.` });
      }

      economy.bank = Math.max(0, (economy.bank || 0) - amount);
      
      if (economy.transactions) {
        economy.transactions.push({
          type: 'staff_remove_bank',
          amount: -amount,
          reason: reason,
          date: new Date()
        });
      }

      await saveUserEconomy(interaction.guildId, targetUser.id, economy);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🏦 Retiro Bancario Administrativo')
        .setDescription(`Se han quitado **${amount} Lagcoins** del banco de ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Cantidad', value: `-${amount} Lagcoins`, inline: true },
          { name: 'Saldo en Banco', value: `${economy.bank} Lagcoins`, inline: true },
          { name: 'Razón', value: reason }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en removebankcoins:', error);
      return interaction.editReply({ content: '❌ Error al quitar Lagcoins del banco' });
    }
  }
};
