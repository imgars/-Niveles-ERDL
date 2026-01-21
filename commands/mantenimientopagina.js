import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mantenimientopagina')
        .setDescription('Activa o desactiva el modo mantenimiento de la página web')
        .addBooleanOption(option => 
            option.setName('estado')
                .setDescription('Verdadero para activar, falso para desactivar')
                .setRequired(true)),
    async execute(interaction) {
        // Verificar si es administrador o staff
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'No tienes permisos para usar este comando.', ephemeral: true });
        }

        const estado = interaction.options.getBoolean('estado');
        
        // Inicializar settings si no existen
        if (!db.settings) db.settings = {};
        db.settings.maintenanceMode = estado;
        
        // Guardar cambios
        db.saveSettings();

        const embed = new EmbedBuilder()
            .setColor(estado ? 0xFF0000 : 0x00FF00)
            .setTitle('🛠️ Modo Mantenimiento')
            .setDescription(`El modo mantenimiento de la página web ha sido **${estado ? 'ACTIVADO' : 'DESACTIVADO'}**.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
