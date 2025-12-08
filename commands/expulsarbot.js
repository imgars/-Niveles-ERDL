client.on("messageCreate", async (message) => {
  // Ignorar bots
  if (message.author.bot) return;

  // Prefijo
  const prefix = "!";

  // Comando esperado
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================================
  //  COMANDO: !expulsarbot
  // ================================
  if (command === "expulsarbot") {

    // Verificar que solo tú puedas usarlo
    const OWNER_ID = "1447415602825400381";

    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    await message.reply("🔄 Ejecutando proceso, el bot empezará a salir de todos los servidores...");

    const client = message.client;
    const currentGuildID = message.guild.id;

    let total = 0;

    for (const guild of client.guilds.cache.values()) {

      // No salir del servidor donde se ejecutó el comando
      if (guild.id === currentGuildID) continue;

      try {
        // Buscar un canal donde el bot pueda enviar mensaje
        const channel =
          guild.systemChannel ||
          guild.channels.cache.find(
            ch =>
              ch.isTextBased() &&
              ch.permissionsFor(guild.members.me)?.has("SendMessages")
          );

        // Enviar mensaje final antes de irse
        if (channel) {
          await channel.send("👋 El bot fue expulsado automáticamente por decisión del propietario, Jose eres un asco.");
        }

        // Salir del servidor
        await guild.leave();
        total++;

        console.log(`Salió de: ${guild.name} (${guild.id})`);
      } catch (err) {
        console.error(`Error al salir de ${guild.name}:`, err);
      }
    }

    await message.reply(`✅ El bot salió de **${total} servidores**.\nEste servidor fue excluido.`);
  }
});
