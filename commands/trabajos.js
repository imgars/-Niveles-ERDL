import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { JOBS, addUserLagcoins, saveUserEconomy, getUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('trabajo')
    .setDescription('Elige un trabajo para ganar Lagcoins')
    .addStringOption(option =>
      option.setName('trabajo')
        .setDescription('Tipo de trabajo')
        .setChoices(
          { name: 'Trabajo Básico - 50-120 Lagcoins', value: 'basico' },
          { name: 'Pescador - 100-250 Lagcoins (Requiere Caña)', value: 'pescar' },
          { name: 'Leñador - 120-300 Lagcoins (Requiere Hacha)', value: 'talar' },
          { name: 'Minero - 150-400 Lagcoins (Requiere Pico)', value: 'minar' },
          { name: 'Albañil - 180-450 Lagcoins (Requiere Pala)', value: 'construir' }
        )
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const jobType = interaction.options.getString('trabajo');
    const job = JOBS[jobType];
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);

    const now = Date.now();
    const lastWork = economy.lastWorkTime ? new Date(economy.lastWorkTime).getTime() : 0;
    const cooldown = 60 * 1000;

    if (now - lastWork < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000);
      return interaction.editReply(`⏳ Vuelve en ${remaining} segundos`);
    }

    // Verificar si tiene los items necesarios
    if (job.itemsNeeded.length > 0) {
      const hasAllItems = job.itemsNeeded.every(item => economy.items && economy.items.includes(item));
      if (!hasAllItems) {
        return interaction.editReply(`❌ Necesitas los items correctos para este trabajo`);
      }
    }

    const earnings = Math.floor(Math.random() * (job.maxEarnings - job.minEarnings + 1)) + job.minEarnings;
    
    await addUserLagcoins(interaction.guildId, interaction.user.id, earnings, `work_${jobType}`);
    await saveUserEconomy(interaction.guildId, interaction.user.id, { lastWorkTime: new Date() });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`💼 ${job.name}`)
      .setDescription(`¡Completaste tu trabajo!`)
      .addFields({ name: 'Ganancias', value: `💰 ${earnings} Lagcoins` })
      .setFooter({ text: 'Vuelve en 1 minuto' });

    return interaction.editReply({ embeds: [embed] });
  }
};
