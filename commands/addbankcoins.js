import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy } from '../utils/economyDB.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addbankcoins')
    .setDescription('(Staff) Añadir Lagcoins al BANCO de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que añadir Lagcoins al banco')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de Lagcoins a añadir')
        .setMinValue(1)
        .setMaxValue(999999999999)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para añadir Lagcoins'),
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando', flags: 64 });
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');
    const reason = interaction.options.getString('razon') || 'Depósito administrativo';

    try {
      const economy = await getUserEconomy(interaction.guildId, targetUser.id);
      economy.bankBalance = (economy.bankBalance || 0) + amount;
      
      // Registrar transacción si existe el sistema
      if (!economy.transactions) economy.transactions = [];
      economy.transactions.push({
        type: 'staff_add_bank',
        amount: amount,
        reason: reason,
        date: new Date().toISOString()
      });

      await saveUserEconomy(interaction.guildId, targetUser.id, economy);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🏦 Depósito Bancario Administrativo')
        .setDescription(`Se han añadido **${amount} Lagcoins** al banco de ${targetUser}`)
        .addFields(
          { name: 'Usuario', value: `${targetUser.tag}`, inline: true },
          { name: 'Cantidad', value: `+${amount} Lagcoins`, inline: true },
          { name: 'Saldo en Banco', value: `${economy.bankBalance} Lagcoins`, inline: true },
          { name: 'Razón', value: reason }
        )
        .setFooter({ text: `Por: ${interaction.user.tag}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en addbankcoins:', error);
      return interaction.editReply({ content: '❌ Error al añadir Lagcoins al banco' });
    }
  }
};
