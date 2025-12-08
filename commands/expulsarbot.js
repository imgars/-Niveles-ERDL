const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const OWNER_ID = "1447415602825400381";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("expulsarbot")
    .setDescription("Expulsa el bot de todos los servidores excepto este.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    // --- VERIFICAR QUE EL USUARIO SEA EL OWNER ---
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ **No tienes permiso** para usar este comando.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "🔄 **Ejecutando proceso...**\nEl bot comenzará a salir de todos los demás servidores.",
      ephemeral: true
    });

    const currentGuild = interaction.guild.id;
    const client = interaction.client;

    let count = 0;

    for (const guild of client.guilds.cache.values()) {
      if (guild.id === currentGuild) continue; // NO salir del servidor donde se ejecutó el comando

      try {
        // Intentar enviar un mensaje al servidor ANTES de salir
        const channel =
          guild.systemChannel ||
          guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has("SendMessages"));

        if (channel) {
          await channel.send("👋 El bot ha sido expulsado automáticamente por decisión del propietario.");
        }

        // Salir del servidor
        await guild.leave();
        count++;
        console.log(`Salió de: ${guild.name} (${guild.id})`);
      } catch (error) {
        console.error(`Error al salir de ${guild.name}:`, error);
      }
    }

    await interaction.followUp({
      content: `✅ **Proceso completado.**\nEl bot salió de **${count} servidores**.\nEste servidor fue preservado.`,
      ephemeral: true
    });
  },
};
