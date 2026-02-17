import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Información sobre el sistema de Lagcoins'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 Sistema de Economía - Lagcoins')
      .setDescription('Gana dinero y compra cosas increíbles')
      .addFields(
        { name: '💼 Comandos de Trabajo', value: '`/work` - Gana 50-120 Lagcoins\n`/balance` - Ver saldo' },
        { name: '💸 Trading', value: '`/trade @usuario cantidad` - Envía dinero a otros usuarios\n`/rob @usuario` - ¡Intenta robar! (50% de éxito)' },
        { name: '🏦 Banco', value: '`/bank depositar cantidad` - Guarda dinero\n`/bank retirar cantidad` - Saca dinero\n`/bank ver` - Ver saldo' },
        { name: '🛍️ Tienda', value: '`/shop` - Compra XP, niveles y boosts con Lagcoins' },
        { name: '💡 Consejos', value: 'Trabaja regularmente\nHaz trading con amigos\nGuarda en el banco\n¡Invierte en tu personaje!' }
      )
      .setFooter({ text: 'Comienza con 100 Lagcoins' });

    return interaction.reply({ embeds: [embed] });
  }
};
