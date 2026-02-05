import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getUserNationality, assignRandomNationality, travelToCountry, COUNTRIES, getUserEconomy, removeUserLagcoins, ITEMS } from '../utils/economyDB.js';

const TRAVEL_COST_BASE = 500;

export default {
  data: new SlashCommandBuilder()
    .setName('nacionalidad')
    .setDescription('Sistema de nacionalidades')
    .addSubcommand(subcommand =>
      subcommand
        .setName('obtener')
        .setDescription('Obtener tu nacionalidad aleatoria')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver tu nacionalidad actual')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('viajar')
        .setDescription('Viajar a otro país')
        .addStringOption(option =>
          option.setName('destino')
            .setDescription('País de destino')
            .setRequired(true)
            .addChoices(
              { name: '🇻🇪 Venezuela', value: 'venezuela' },
              { name: '🇲🇽 México', value: 'mexico' },
              { name: '🇦🇷 Argentina', value: 'argentina' },
              { name: '🇨🇴 Colombia', value: 'colombia' },
              { name: '🇧🇷 Brasil', value: 'brasil' },
              { name: '🇪🇨 Ecuador', value: 'ecuador' },
              { name: '🇵🇪 Perú', value: 'peru' },
              { name: '🇨🇱 Chile', value: 'chile' },
              { name: '🇺🇾 Uruguay', value: 'uruguay' },
              { name: '🇸🇻 El Salvador', value: 'el_salvador' },
              { name: '🇵🇦 Panamá', value: 'panama' },
              { name: '🇨🇷 Costa Rica', value: 'costa_rica' },
              { name: '🇩🇴 República Dominicana', value: 'republica_dominicana' },
              { name: '🇬🇹 Guatemala', value: 'guatemala' },
              { name: '🇭🇳 Honduras', value: 'honduras' },
              { name: '🇧🇴 Bolivia', value: 'bolivia' },
              { name: '🇵🇾 Paraguay', value: 'paraguay' },
              { name: '🇳🇮 Nicaragua', value: 'nicaragua' },
              { name: '🇨🇺 Cuba', value: 'cuba' },
              { name: '🇪🇸 España', value: 'espana' },
              { name: '🇺🇸 Estados Unidos', value: 'estados_unidos' },
              { name: '🇨🇦 Canadá', value: 'canada' },
              { name: '🇬🇧 Reino Unido', value: 'reino_unido' },
              { name: '🇯🇵 Japón', value: 'japon' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('paises')
        .setDescription('Ver información de todos los países')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'obtener') {
      const existing = await getUserNationality(interaction.guildId, interaction.user.id);
      
      if (existing) {
        const country = COUNTRIES[existing.country];
        return interaction.reply({ 
          content: `❌ Ya tienes nacionalidad: ${country.emoji} **${country.name}**. No puedes cambiarla.`,
          flags: 64 
        });
      }
      
      const nationality = await assignRandomNationality(interaction.guildId, interaction.user.id);
      const country = COUNTRIES[nationality.country];
      
      const rarityText = country.probability <= 0.1 ? '✨ ¡ULTRA RARO!' : 
                         country.probability <= 0.2 ? '⭐ ¡Raro!' : 
                         country.probability <= 0.4 ? '🎯 Poco común' : '📌 Común';
      
      const embed = new EmbedBuilder()
        .setColor(country.probability <= 0.1 ? '#FFD700' : country.probability <= 0.2 ? '#C0C0C0' : '#7289DA')
        .setTitle(`${country.emoji} ¡Bienvenido a ${country.name}!`)
        .setDescription(`Has obtenido la nacionalidad de **${country.name}** ${rarityText}`)
        .addFields(
          { name: '💼 Multiplicador de Trabajo', value: `x${country.jobMultiplier}`, inline: true },
          { name: '💰 Salario Base', value: `${country.minWage} - ${country.minWage + country.maxWageBonus} Lagcoins`, inline: true },
          { name: '📊 Rareza', value: `${Math.round(country.probability * 100)}% de probabilidad`, inline: true }
        )
        .setFooter({ text: 'Compra un pasaporte para viajar a otros países y cambiar tus condiciones de trabajo' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'ver') {
      const nationality = await getUserNationality(interaction.guildId, interaction.user.id);
      
      if (!nationality) {
        return interaction.reply({ 
          content: '❌ Aún no tienes nacionalidad. Usa `/nacionalidad obtener` para obtener una.',
          flags: 64 
        });
      }
      
      const originCountry = COUNTRIES[nationality.country];
      const currentCountry = COUNTRIES[nationality.currentCountry];
      
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`📜 Tu Nacionalidad`)
        .addFields(
          { name: '🏠 País de Origen', value: `${originCountry.emoji} ${originCountry.name}`, inline: true },
          { name: '📍 País Actual', value: `${currentCountry.emoji} ${currentCountry.name}`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '💼 Multiplicador de Trabajo', value: `x${currentCountry.jobMultiplier}`, inline: true },
          { name: '💰 Salario Base', value: `${currentCountry.minWage} - ${currentCountry.minWage + currentCountry.maxWageBonus} Lagcoins`, inline: true }
        );
      
      if (nationality.travelHistory && nationality.travelHistory.length > 0) {
        const lastTrips = nationality.travelHistory.slice(-3).map(t => {
          const c = COUNTRIES[t.country];
          return `${c.emoji} ${c.name}`;
        }).join('\n');
        embed.addFields({ name: '✈️ Últimos Viajes', value: lastTrips, inline: true });
      }
      
      embed.setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'viajar') {
      const nationality = await getUserNationality(interaction.guildId, interaction.user.id);
      
      if (!nationality) {
        return interaction.reply({ 
          content: '❌ Necesitas una nacionalidad primero. Usa `/nacionalidad obtener`.',
          flags: 64 
        });
      }
      
      const economy = await getUserEconomy(interaction.guildId, interaction.user.id);
      
      // Verificar pasaporte
      if (!economy.items || !economy.items.includes('pasaporte')) {
        return interaction.reply({ 
          content: '❌ Necesitas un **🛂 Pasaporte** para viajar. Cómpralo en `/tienda`.',
          flags: 64 
        });
      }
      
      const destino = interaction.options.getString('destino');
      const destinoCountry = COUNTRIES[destino];
      
      if (!destinoCountry) {
        return interaction.reply({ content: '❌ País de destino no válido', flags: 64 });
      }
      
      if (nationality.currentCountry === destino) {
        return interaction.reply({ content: '❌ Ya estás en ese país', flags: 64 });
      }
      
      // Calcular costo del viaje (más caro para países con mejor salario)
      const travelCost = Math.floor(TRAVEL_COST_BASE * (1 + destinoCountry.jobMultiplier));
      
      // Verificar si necesita visa para países de primer mundo
      const needsVisa = destinoCountry.jobMultiplier >= 1.5;
      if (needsVisa && (!economy.items || !economy.items.includes('visa_trabajo'))) {
        return interaction.reply({ 
          content: `❌ Necesitas una **📝 Visa de Trabajo** para viajar a ${destinoCountry.emoji} ${destinoCountry.name}. Cómprala en \`/tienda\`.`,
          flags: 64 
        });
      }
      
      if ((economy.lagcoins || 0) < travelCost) {
        return interaction.reply({ 
          content: `❌ El viaje a ${destinoCountry.emoji} ${destinoCountry.name} cuesta **${travelCost} Lagcoins**. Tienes **${economy.lagcoins || 0}**.`,
          flags: 64 
        });
      }
      
      // Descontar costo y viajar
      await removeUserLagcoins(interaction.guildId, interaction.user.id, travelCost, 'travel');
      const result = await travelToCountry(interaction.guildId, interaction.user.id, destino);
      
      if (result.error) {
        return interaction.reply({ content: `❌ Error al viajar: ${result.error}`, flags: 64 });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`✈️ ¡Bienvenido a ${destinoCountry.name}!`)
        .setDescription(`Has viajado a ${destinoCountry.emoji} **${destinoCountry.name}**`)
        .addFields(
          { name: '💰 Costo del Viaje', value: `${travelCost} Lagcoins`, inline: true },
          { name: '💼 Nuevo Multiplicador', value: `x${destinoCountry.jobMultiplier}`, inline: true },
          { name: '💵 Nuevo Salario Base', value: `${destinoCountry.minWage} - ${destinoCountry.minWage + destinoCountry.maxWageBonus} Lagcoins`, inline: true }
        )
        .setFooter({ text: 'Ahora ganarás más/menos dependiendo del país' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    if (subcommand === 'paises') {
      const latam = Object.entries(COUNTRIES)
        .filter(([_, c]) => c.probability >= 0.2)
        .sort((a, b) => b[1].jobMultiplier - a[1].jobMultiplier)
        .map(([_, c]) => `${c.emoji} **${c.name}** - x${c.jobMultiplier} (${Math.round(c.probability * 100)}%)`)
        .join('\n');
      
      const developed = Object.entries(COUNTRIES)
        .filter(([_, c]) => c.probability < 0.2)
        .sort((a, b) => b[1].jobMultiplier - a[1].jobMultiplier)
        .map(([_, c]) => `${c.emoji} **${c.name}** - x${c.jobMultiplier} (${Math.round(c.probability * 100)}%)`)
        .join('\n');
      
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('🌎 Países Disponibles')
        .setDescription('Cada país tiene diferentes multiplicadores de trabajo y probabilidades de obtención.')
        .addFields(
          { name: '🌎 Latinoamérica y Otros', value: latam || 'Ninguno' },
          { name: '✨ Países Desarrollados (Requieren Visa)', value: developed || 'Ninguno' }
        )
        .setFooter({ text: 'Usa /nacionalidad obtener para obtener tu nacionalidad' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
