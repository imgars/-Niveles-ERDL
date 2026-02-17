import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { isStaff } from '../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('[Staff] Crea un embed personalizado'),
  
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }
    
    const modal = new ModalBuilder()
      .setCustomId('embed_modal')
      .setTitle('Crear Embed Personalizado');
    
    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('Título')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Descripción')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    
    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('Color (hex sin #, ej: FF0000)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue('7289DA');
    
    const imageInput = new TextInputBuilder()
      .setCustomId('embed_image')
      .setLabel('URL de Imagen (opcional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
    const footerInput = new TextInputBuilder()
      .setCustomId('embed_footer')
      .setLabel('Footer (opcional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(imageInput),
      new ActionRowBuilder().addComponents(footerInput)
    );
    
    await interaction.showModal(modal);
    
    const filter = (i) => i.customId === 'embed_modal' && i.user.id === interaction.user.id;
    
    try {
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 300000 });
      
      const title = modalInteraction.fields.getTextInputValue('embed_title') || null;
      const description = modalInteraction.fields.getTextInputValue('embed_description');
      const colorHex = modalInteraction.fields.getTextInputValue('embed_color') || '7289DA';
      const image = modalInteraction.fields.getTextInputValue('embed_image') || null;
      const footer = modalInteraction.fields.getTextInputValue('embed_footer') || null;
      
      const color = parseInt(colorHex, 16);
      
      const embed = {
        color: color,
        description: description
      };
      
      if (title) embed.title = title;
      if (image) embed.image = { url: image };
      if (footer) embed.footer = { text: footer };
      
      await modalInteraction.reply({
        embeds: [embed]
      });
    } catch (error) {
      console.error('Error creating embed:', error);
    }
  }
};
