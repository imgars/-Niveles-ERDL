import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../utils/database.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inactividad')
    .setDescription('Gestionar el estado de inactividad de los usuarios')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Poner a un usuario en estado de inactividad')
        .addUserOption(option => option.setName('usuario').setDescription('El usuario a marcar como inactivo').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Quitar el estado de inactividad de un usuario')
        .addUserOption(option => option.setName('usuario').setDescription('El usuario a quitar de inactividad').setRequired(true))
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('usuario');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!member) {
      return interaction.reply({ content: '❌ No se pudo encontrar al miembro en este servidor.', ephemeral: true });
    }

    const userData = db.getUser(interaction.guild.id, targetUser.id);
    const inactiveRoleId = '1455315291532693789';

    if (subcommand === 'set') {
      if (userData.isInactive) {
        return interaction.reply({ content: '❌ Este usuario ya está marcado como inactivo.', ephemeral: true });
      }

      userData.isInactive = true;
      userData.inactivityMessages = 0;
      db.saveUser(interaction.guild.id, targetUser.id, userData);

      // Añadir rol
      if (!member.roles.cache.has(inactiveRoleId)) {
        await member.roles.add(inactiveRoleId).catch(console.error);
      }

      // Cambiar nombre
      if (member.manageable) {
        const oldNickname = member.nickname || targetUser.username;
        if (!oldNickname.startsWith('[Inactivo] ')) {
          await member.setNickname(`[Inactivo] ${oldNickname}`).catch(console.error);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⚠️ Inactividad Establecida')
        .setDescription(`El staff <@${interaction.user.id}> ha marcado a <@${targetUser.id}> como inactivo manualmente.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
      // Intentar log de auditoría
      try {
        const { sendAuditLog } = await import('../index.js');
        if (typeof sendAuditLog === 'function') {
           await sendAuditLog(interaction.client, interaction, 'Inactividad Manual (SET)', `Staff: <@${interaction.user.id}>\nUsuario: <@${targetUser.id}>`);
        }
      } catch (e) {}

    } else if (subcommand === 'remove') {
      if (!userData.isInactive) {
        return interaction.reply({ content: '❌ Este usuario no está marcado como inactivo.', ephemeral: true });
      }

      userData.isInactive = false;
      userData.inactivityMessages = 0;
      db.saveUser(interaction.guild.id, targetUser.id, userData);

      // Quitar rol
      if (member.roles.cache.has(inactiveRoleId)) {
        await member.roles.remove(inactiveRoleId).catch(console.error);
      }

      // Quitar [Inactivo] del nombre
      if (member.manageable) {
        const currentNickname = member.nickname || '';
        if (currentNickname.startsWith('[Inactivo] ')) {
          await member.setNickname(currentNickname.replace('[Inactivo] ', '')).catch(console.error);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Inactividad Quitada')
        .setDescription(`El staff <@${interaction.user.id}> ha quitado el estado de inactividad de <@${targetUser.id}>.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Intentar log de auditoría
      try {
        const { sendAuditLog } = await import('../index.js');
        if (typeof sendAuditLog === 'function') {
           await sendAuditLog(interaction.client, interaction, 'Inactividad Manual (REMOVE)', `Staff: <@${interaction.user.id}>\nUsuario: <@${targetUser.id}>`);
        }
      } catch (e) {}
    }
  },
};
