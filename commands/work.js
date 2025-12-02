import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy, addUserLagcoins, saveUserEconomy } from '../utils/economyDB.js';

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja para ganar Lagcoins'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
    if (!economy) {
      return interaction.editReply('❌ Error al obtener tu cuenta');
    }

    const now = Date.now();
    const lastWork = economy.lastWorkTime ? new Date(economy.lastWorkTime).getTime() : 0;
    const cooldown = 60 * 1000; // 1 minuto

    if (now - lastWork < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000);
      return interaction.editReply(`⏳ Vuelve en ${remaining} segundos`);
    }

    const jobs = [
      { name: 'Repartidor', earnings: 50 },
      { name: 'Programador', earnings: 100 },
      { name: 'Streamer', earnings: 75 },
      { name: 'Músico', earnings: 60 },
      { name: 'Diseñador', earnings: 80 }
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const bonus = Math.floor(Math.random() * 20) + job.earnings;

    const updated = await addUserLagcoins(interaction.guildId, interaction.user.id, bonus, 'work');
    await saveUserEconomy(interaction.guildId, interaction.user.id, { lastWorkTime: new Date() });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💼 ¡Trabajo Completado!')
      .setDescription(`Trabajaste como **${job.name}** y ganaste **${bonus} Lagcoins**`)
      .addFields({ name: 'Saldo Total', value: `💰 ${updated.lagcoins} Lagcoins` })
      .setFooter({ text: 'Vuelve en 1 minuto' });

    return interaction.editReply({ embeds: [embed] });
  }
};
