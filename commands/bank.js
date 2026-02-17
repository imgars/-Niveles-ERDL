import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getUserEconomy, bankDeposit, bankWithdraw, saveUserEconomy, removeUserLagcoins } from '../utils/economyDB.js';

const BANK_UPGRADES = {
  upgrade_5k: { cost: 15000, extraSpace: 5000, name: '+5k Espacio' },
  upgrade_10k: { cost: 30000, extraSpace: 10000, name: '+10k Espacio' },
  upgrade_20k: { cost: 50000, extraSpace: 20000, name: '+20k Espacio' }
};

const BASE_BANK_LIMIT = 10000;

function getUserBankLimit(economy) {
  const upgrades = economy.bankUpgrades || [];
  let limit = BASE_BANK_LIMIT;
  for (const upgradeId of upgrades) {
    if (BANK_UPGRADES[upgradeId]) {
      limit += BANK_UPGRADES[upgradeId].extraSpace;
    }
  }
  return limit;
}

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Gestiona tu dinero en el banco')
    .addSubcommand(subcommand =>
      subcommand
        .setName('depositar')
        .setDescription('Deposita Lagcoins en el banco')
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad a depositar')
            .setMinValue(1)
            .setMaxValue(999999999999)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('retirar')
        .setDescription('Retira Lagcoins del banco')
        .addIntegerOption(option =>
          option.setName('cantidad')
            .setDescription('Cantidad a retirar')
            .setMinValue(1)
            .setMaxValue(999999999999)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ve tu saldo del banco')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('expandir')
        .setDescription('Compra más espacio en el banco')
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    if (!economy) {
      return interaction.editReply({ content: '❌ Error al obtener tu cuenta' });
    }

    const bankLimit = getUserBankLimit(economy);
    const currentBankBalance = economy.bankBalance || 0;

    if (subcommand === 'depositar') {
      const amount = interaction.options.getInteger('cantidad');
      if (amount <= 0) return interaction.editReply({ content: '❌ La cantidad debe ser mayor a 0' });

      if (currentBankBalance + amount > bankLimit) {
        const availableSpace = bankLimit - currentBankBalance;
        return interaction.editReply({ 
          content: `❌ No puedes depositar tanto. Tu límite de banco es **${bankLimit} Lagcoins**.\n💰 Espacio disponible: **${availableSpace} Lagcoins**\n\n💡 Usa \`/bank expandir\` para comprar más espacio.` 
        });
      }

      const result = await bankDeposit(interaction.guildId, interaction.user.id, amount);
      if (!result) {
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        return interaction.editReply({ content: `❌ No tienes suficientes Lagcoins. Tienes: ${economy?.lagcoins || 0}` });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Depósito Realizado!')
        .setDescription(`Depositaste **${amount} Lagcoins** en tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${result.lagcoins}`, inline: true },
          { name: 'Banco', value: `🏦 ${result.bankBalance}/${bankLimit}`, inline: true }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'retirar') {
      const amount = interaction.options.getInteger('cantidad');
      if (amount <= 0) return interaction.editReply({ content: '❌ La cantidad debe ser mayor a 0' });

      const result = await bankWithdraw(interaction.guildId, interaction.user.id, amount);
      if (!result) {
        const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
        return interaction.editReply({ content: `❌ No tienes suficientes Lagcoins en el banco. Tienes: ${economy?.bankBalance || 0}` });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 ¡Retiro Realizado!')
        .setDescription(`Retiraste **${amount} Lagcoins** de tu banco`)
        .addFields(
          { name: 'Cartera', value: `💵 ${result.lagcoins}`, inline: true },
          { name: 'Banco', value: `🏦 ${result.bankBalance}/${bankLimit}`, inline: true }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'ver') {
      const upgrades = economy.bankUpgrades || [];
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏦 Tu Cuenta Bancaria')
        .addFields(
          { name: 'Cartera', value: `💵 ${economy.lagcoins} Lagcoins`, inline: true },
          { name: 'Banco', value: `🏦 ${currentBankBalance}/${bankLimit} Lagcoins`, inline: true },
          { name: 'Total', value: `💎 ${economy.lagcoins + currentBankBalance} Lagcoins` },
          { name: '📦 Expansiones', value: upgrades.length > 0 ? upgrades.map(u => BANK_UPGRADES[u]?.name || u).join(', ') : 'Ninguna' }
        )
        .setFooter({ text: '💡 Usa /bank expandir para aumentar tu límite' });

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'expandir') {
      const upgrades = economy.bankUpgrades || [];
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏦 Expandir Banco')
        .setDescription(`Tu límite actual: **${bankLimit} Lagcoins**\nTu saldo: **${economy.lagcoins} Lagcoins**\n\nSelecciona una expansión para comprar:`)
        .addFields(
          { name: '📦 +5k Espacio', value: `💰 15,000 Lagcoins\n${upgrades.includes('upgrade_5k') ? '✅ Ya comprado' : '❌ No comprado'}`, inline: true },
          { name: '📦 +10k Espacio', value: `💰 30,000 Lagcoins\n${upgrades.includes('upgrade_10k') ? '✅ Ya comprado' : '❌ No comprado'}`, inline: true },
          { name: '📦 +20k Espacio', value: `💰 50,000 Lagcoins\n${upgrades.includes('upgrade_20k') ? '✅ Ya comprado' : '❌ No comprado'}`, inline: true }
        );

      const availableUpgrades = Object.entries(BANK_UPGRADES)
        .filter(([id, _]) => !upgrades.includes(id))
        .map(([id, upgrade]) => ({
          label: `${upgrade.name} - ${upgrade.cost.toLocaleString()} LC`,
          description: economy.lagcoins >= upgrade.cost ? 'Puedes comprarlo' : 'No tienes suficientes Lagcoins',
          value: id
        }));

      if (availableUpgrades.length === 0) {
        embed.setDescription(`Tu límite actual: **${bankLimit} Lagcoins**\n\n✅ ¡Ya tienes todas las expansiones disponibles!`);
        return interaction.editReply({ embeds: [embed] });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('bank_upgrade')
        .setPlaceholder('Selecciona una expansión')
        .addOptions(availableUpgrades);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      return interaction.editReply({ embeds: [embed], components: [row] });
    }
  }
};

export async function handleBankUpgrade(interaction) {
  const upgradeId = interaction.values[0];
  const upgrade = BANK_UPGRADES[upgradeId];

  if (!upgrade) {
    return interaction.reply({ content: '❌ Expansión no válida', flags: 64 });
  }

  const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
  
  if (!economy.bankUpgrades) economy.bankUpgrades = [];
  
  if (economy.bankUpgrades.includes(upgradeId)) {
    return interaction.reply({ content: '❌ Ya tienes esta expansión', flags: 64 });
  }

  if ((economy.lagcoins || 0) < upgrade.cost) {
    return interaction.reply({ content: `❌ No tienes suficientes Lagcoins. Necesitas **${upgrade.cost.toLocaleString()}** pero tienes **${economy.lagcoins.toLocaleString()}**`, flags: 64 });
  }

  economy.lagcoins -= upgrade.cost;
  economy.bankUpgrades.push(upgradeId);
  
  await saveUserEconomy(interaction.guildId, interaction.user.id, economy);

  const newLimit = getUserBankLimit(economy);

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ ¡Expansión Comprada!')
    .setDescription(`Compraste **${upgrade.name}**`)
    .addFields(
      { name: 'Nuevo Límite', value: `🏦 ${newLimit.toLocaleString()} Lagcoins`, inline: true },
      { name: 'Saldo Restante', value: `💵 ${economy.lagcoins.toLocaleString()} Lagcoins`, inline: true }
    );

  return interaction.reply({ embeds: [embed] });
}
