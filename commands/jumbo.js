import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('jumbo')
    .setDescription('Muestra un emoji en formato grande')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('El emoji a mostrar en grande')
        .setRequired(true)
    ),

  async execute(interaction) {
    const emojiInput = interaction.options.getString('emoji');
    
    const customEmojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
    
    if (customEmojiMatch) {
      const isAnimated = emojiInput.startsWith('<a:');
      const emojiName = customEmojiMatch[1];
      const emojiId = customEmojiMatch[2];
      const extension = isAnimated ? 'gif' : 'png';
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=256`;
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${emojiName}`)
        .setImage(emojiUrl);
      
      return interaction.reply({ embeds: [embed] });
    }
    
    const unicodeEmojiMatch = emojiInput.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu);
    
    if (unicodeEmojiMatch && unicodeEmojiMatch.length > 0) {
      const emoji = unicodeEmojiMatch[0];
      const codePoints = [...emoji].map(char => char.codePointAt(0).toString(16)).join('-');
      const emojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codePoints}.png`;
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Emoji')
        .setImage(emojiUrl)
        .setFooter({ text: `Emoji: ${emoji}` });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    return interaction.reply({ 
      content: '❌ No se pudo detectar un emoji válido. Por favor, ingresa un emoji (personalizado o unicode).', 
      flags: 64 
    });
  }
};
