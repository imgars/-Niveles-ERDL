import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy, activatePowerup, addUserLagcoins } from './economyDB.js';
import db from './database.js';

const DATA_DIR = './data';
const EASTER_EGGS_FILE = path.join(DATA_DIR, 'eastereggs.json');

const BOLIVARES_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Billete_de_100_Bol%C3%ADvares_Soberanos.jpg/1200px-Billete_de_100_Bol%C3%ADvares_Soberanos.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Billete_de_500_Bol%C3%ADvares.jpg/1200px-Billete_de_500_Bol%C3%ADvares.jpg'
];

const AREPA_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Cachapa_con_queso_de_mano.jpg/1200px-Cachapa_con_queso_de_mano.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Arepa_de_pabellon.jpg/1200px-Arepa_de_pabellon.jpg'
];

const RANDOM_FACTS = [
  'Sabias que el ornitorrinco es uno de los pocos mamiferos venenosos?',
  'La miel nunca caduca. Se han encontrado jarrones de miel de 3000 años aun comestibles!',
  'Los pulpos tienen 3 corazones y sangre azul.',
  'Venus es el unico planeta que gira en sentido contrario a los demas.',
  'Las jirafas solo duermen 30 minutos al dia en intervalos de 5 minutos.',
  'El ojo de un avestruz es mas grande que su cerebro.',
  'Los tiburones existian antes que los arboles.',
  'Cleopatra vivio mas cerca en el tiempo de la Luna que de la construccion de las piramides.',
  'Hay mas estrellas en el universo que granos de arena en la Tierra.',
  'Tu cuerpo produce suficiente calor en 30 minutos para hervir medio litro de agua.'
];

const CHISTES = [
  'Por que los pajaros no usan Facebook? Porque ya tienen Twitter!',
  'Cual es el cafe mas peligroso? El ex-preso!',
  'Que hace una abeja en el gimnasio? Zum-ba!',
  'Como se llama el campeón de buceo japones? Tokofondo!',
  'Que le dice un 0 a un 8? Bonito cinturon!',
  'Por que el libro de matematicas esta triste? Porque tiene muchos problemas!',
  'Que hace un pez en tierra? Nada!',
  'Cual es el animal mas antiguo? La cebra, porque esta en blanco y negro!',
  'Que le dice una iguana a su hermana gemela? Somos iguanitas!',
  'Por que los esqueletos no pelean entre ellos? Porque no tienen agallas!'
];

function loadEasterEggsFile() {
  try {
    if (fs.existsSync(EASTER_EGGS_FILE)) {
      return JSON.parse(fs.readFileSync(EASTER_EGGS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading easter eggs file:', error);
  }
  return {};
}

function saveEasterEggsFile(data) {
  try {
    fs.writeFileSync(EASTER_EGGS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving easter eggs file:', error);
    return false;
  }
}

export function canUseEasterEgg(userId, eggName, hasReward = false) {
  const data = loadEasterEggsFile();
  const key = `${userId}-${eggName}`;
  const now = Date.now();
  
  if (!data[key]) {
    return { canUse: true };
  }
  
  if (hasReward && data[key].claimed) {
    return { canUse: false, reason: 'already_claimed' };
  }
  
  const cooldown = 12 * 60 * 60 * 1000;
  const timeSinceLastUse = now - data[key].lastUsed;
  
  if (timeSinceLastUse < cooldown) {
    const remainingHours = Math.ceil((cooldown - timeSinceLastUse) / (60 * 60 * 1000));
    return { canUse: false, reason: 'cooldown', remaining: remainingHours };
  }
  
  return { canUse: true };
}

export function markEasterEggUsed(userId, eggName, claimed = false) {
  const data = loadEasterEggsFile();
  const key = `${userId}-${eggName}`;
  
  data[key] = {
    lastUsed: Date.now(),
    count: (data[key]?.count || 0) + 1,
    claimed: claimed || data[key]?.claimed
  };
  
  saveEasterEggsFile(data);
}

export async function handleEasterEgg(message, client) {
  const content = message.content.toLowerCase().trim();
  
  if (content === '!lagcoin') {
    const check = canUseEasterEgg(message.author.id, 'lagcoin', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'lagcoin');
    const randomImage = BOLIVARES_IMAGES[Math.floor(Math.random() * BOLIVARES_IMAGES.length)];
    return message.reply({ 
      content: '💵 **Bolivares Venezolanos!** El orgullo nacional 🇻🇪',
      files: [randomImage]
    }).catch(() => {
      return message.reply('💵 **Bolivares Venezolanos!** 🇻🇪');
    });
  }
  
  if (content === '!mzingerkai') {
    const check = canUseEasterEgg(message.author.id, 'mzingerkai', true);
    if (!check.canUse) {
      return message.reply('❌ Ya has reclamado esta recompensa secreta.');
    }
    
    markEasterEggUsed(message.author.id, 'mzingerkai', true);
    
    const key = `${message.guild.id}-${message.author.id}`;
    if (!db.users[key]) {
      db.users[key] = { xp: 0, level: 0, totalXp: 0, guildId: message.guild.id, oderId: message.author.id };
    }
    db.users[key].xp += 777;
    db.users[key].totalXp = (db.users[key].totalXp || 0) + 777;
    db.save();
    
    return message.reply('🎰 **MZINGERKAI!** Has recibido **+777 XP** de niveles. El numero de la suerte! 🍀');
  }
  
  if (content === '!sirgiobot') {
    const check = canUseEasterEgg(message.author.id, 'sirgiobot', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'sirgiobot');
    return message.reply('😎 **SirgioBOT** te saluda desde las sombras! 👋');
  }
  
  if (content === '!arepa') {
    const check = canUseEasterEgg(message.author.id, 'arepa', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'arepa');
    const randomImage = AREPA_IMAGES[Math.floor(Math.random() * AREPA_IMAGES.length)];
    return message.reply({ 
      content: '🫓 **Arepas Venezolanas!** Que rico! 🤤',
      files: [randomImage]
    }).catch(() => {
      return message.reply('🫓 **Arepas Venezolanas!** Que rico! 🤤');
    });
  }
  
  if (content === '!dinnerbone') {
    const check = canUseEasterEgg(message.author.id, 'dinnerbone', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    try {
      markEasterEggUsed(message.author.id, 'dinnerbone');
      
      const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      
      const canvas = createCanvas(256, 256);
      const ctx = canvas.getContext('2d');
      
      ctx.translate(128, 128);
      ctx.rotate(Math.PI);
      ctx.drawImage(avatar, -128, -128, 256, 256);
      
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'dinnerbone.png' });
      
      return message.reply({ 
        content: '🙃 **Dinnerbone!** *El mundo esta al reves*',
        files: [attachment] 
      });
    } catch (error) {
      console.error('Error en dinnerbone:', error);
      return message.reply('🙃 **Dinnerbone!** *El mundo esta al reves*');
    }
  }
  
  if (content === '!casin0') {
    const check = canUseEasterEgg(message.author.id, 'casin0', true);
    if (!check.canUse) {
      return message.reply('❌ Ya has reclamado este boost secreto.');
    }
    
    markEasterEggUsed(message.author.id, 'casin0', true);
    activatePowerup(message.guild.id, message.author.id, 'casino_luck', 5.0, 30 * 60 * 1000);
    
    return message.reply('🎰🔥 **CASIN0!** Has recibido un boost de suerte del **500%** en el casino por **30 minutos**. Corre a apostar! 💰');
  }
  
  if (content === '!gars') {
    const check = canUseEasterEgg(message.author.id, 'gars', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'gars');
    return message.reply('💻 **-Niveles** programado con ❤️ por **Imgars**');
  }
  
  if (content === '!timeoutt') {
    const check = canUseEasterEgg(message.author.id, 'timeoutt', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'timeoutt');
    return message.reply('😢 **No deberias auto mutearte :(** *Cuida tu salud mental*');
  }
  
  if (content === '!pelotocino') {
    const check = canUseEasterEgg(message.author.id, 'pelotocino', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'pelotocino');
    return message.reply('💡 **Idea del Sistema de misiones** por **pelotocino** 🧠');
  }
  
  if (content === '!uno') {
    const check = canUseEasterEgg(message.author.id, 'uno', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'uno');
    return message.reply('🔢 **Dos** *(y asi sucesivamente)*');
  }
  
  if (content === '!secreto') {
    const check = canUseEasterEgg(message.author.id, 'secreto', true);
    if (!check.canUse) {
      return message.reply('❌ Ya conoces el secreto...');
    }
    
    markEasterEggUsed(message.author.id, 'secreto', true);
    await addUserLagcoins(message.guild.id, message.author.id, 500, 'easter_egg');
    return message.reply('🤫 **Has encontrado un secreto!** +500 Lagcoins por tu curiosidad 💰');
  }
  
  if (content === '!dato') {
    const check = canUseEasterEgg(message.author.id, 'dato', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para otro dato.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'dato');
    const fact = RANDOM_FACTS[Math.floor(Math.random() * RANDOM_FACTS.length)];
    return message.reply(`📚 **Dato Curioso:**\n${fact}`);
  }
  
  if (content === '!chiste') {
    const check = canUseEasterEgg(message.author.id, 'chiste', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para otro chiste.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'chiste');
    const joke = CHISTES[Math.floor(Math.random() * CHISTES.length)];
    return message.reply(`😂 **Chiste del dia:**\n${joke}`);
  }
  
  if (content === '!hola') {
    return message.reply('👋 **Hola!** Como estas? Espero que muy bien 😊');
  }
  
  if (content === '!suerte') {
    const check = canUseEasterEgg(message.author.id, 'suerte', true);
    if (!check.canUse) {
      return message.reply('❌ Ya reclamaste tu suerte hoy. Vuelve mañana!');
    }
    
    const luck = Math.random();
    if (luck > 0.95) {
      markEasterEggUsed(message.author.id, 'suerte', true);
      await addUserLagcoins(message.guild.id, message.author.id, 1000, 'super_luck');
      return message.reply('🍀✨ **SUPER SUERTE!** Has ganado **1000 Lagcoins**! Eres increible!');
    } else if (luck > 0.7) {
      markEasterEggUsed(message.author.id, 'suerte', true);
      await addUserLagcoins(message.guild.id, message.author.id, 100, 'luck');
      return message.reply('🍀 **Buena suerte!** Has ganado **100 Lagcoins**!');
    } else {
      markEasterEggUsed(message.author.id, 'suerte');
      return message.reply('😅 **Hoy no hubo suerte...** Intentalo mañana!');
    }
  }
  
  if (content === '!tesoro') {
    const check = canUseEasterEgg(message.author.id, 'tesoro', true);
    if (!check.canUse) {
      return message.reply('❌ Ya encontraste el tesoro. Solo hay uno por persona.');
    }
    
    markEasterEggUsed(message.author.id, 'tesoro', true);
    
    const key = `${message.guild.id}-${message.author.id}`;
    if (!db.users[key]) {
      db.users[key] = { xp: 0, level: 0, totalXp: 0, guildId: message.guild.id, userId: message.author.id };
    }
    db.users[key].totalXp = (db.users[key].totalXp || 0) + 1500;
    db.save();
    
    await addUserLagcoins(message.guild.id, message.author.id, 750, 'treasure');
    
    return message.reply('🏴‍☠️💎 **HAS ENCONTRADO EL TESORO ESCONDIDO!**\n+1500 XP y +750 Lagcoins! Arrr! 🦜');
  }
  
  if (content === '!pixel') {
    const check = canUseEasterEgg(message.author.id, 'pixel', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para pixelarte de nuevo.`);
      }
    }
    
    try {
      markEasterEggUsed(message.author.id, 'pixel');
      
      const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      
      const canvas = createCanvas(256, 256);
      const ctx = canvas.getContext('2d');
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(avatar, 0, 0, 16, 16);
      ctx.drawImage(canvas, 0, 0, 16, 16, 0, 0, 256, 256);
      
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'pixel.png' });
      
      return message.reply({ 
        content: '🎮 **Pixel Art!** Version retro de ti',
        files: [attachment] 
      });
    } catch (error) {
      console.error('Error en pixel:', error);
      return message.reply('🎮 **Pixel Art!** *Eres un clasico*');
    }
  }
  
  if (content === '!invertir') {
    const check = canUseEasterEgg(message.author.id, 'invertir', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para invertir colores.`);
      }
    }
    
    try {
      markEasterEggUsed(message.author.id, 'invertir');
      
      const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      
      const canvas = createCanvas(256, 256);
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(avatar, 0, 0, 256, 256);
      
      const imageData = ctx.getImageData(0, 0, 256, 256);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'invertido.png' });
      
      return message.reply({ 
        content: '🎨 **Colores Invertidos!** El negativo de ti',
        files: [attachment] 
      });
    } catch (error) {
      console.error('Error en invertir:', error);
      return message.reply('🎨 **Colores Invertidos!** *Tu version alternativa*');
    }
  }
  
  if (content === '!motivacion') {
    const motivaciones = [
      '💪 Cada dia es una nueva oportunidad para ser mejor!',
      '🌟 El exito no es la clave de la felicidad, la felicidad es la clave del exito!',
      '🚀 No esperes el momento perfecto, haz perfecto el momento!',
      '🔥 Los limites solo existen en tu mente!',
      '✨ Cree en ti mismo y todo sera posible!',
      '🎯 El fracaso es el condimento que da sabor al exito!',
      '💎 Eres mas fuerte de lo que crees!',
      '🌈 Despues de la tormenta siempre sale el sol!'
    ];
    
    const msg = motivaciones[Math.floor(Math.random() * motivaciones.length)];
    return message.reply(`**Mensaje motivacional del dia:**\n${msg}`);
  }
  
  if (content === '!8ball') {
    const respuestas = [
      '🎱 Si, definitivamente!',
      '🎱 No lo creo...',
      '🎱 Tal vez, pregunta despues',
      '🎱 Las estrellas dicen que si!',
      '🎱 Mejor no te digo...',
      '🎱 Absolutamente!',
      '🎱 No cuentes con ello',
      '🎱 El futuro es incierto',
      '🎱 Sin duda alguna!',
      '🎱 Concentrate y pregunta de nuevo'
    ];
    
    const response = respuestas[Math.floor(Math.random() * respuestas.length)];
    return message.reply(`**Bola 8 Magica responde:**\n${response}`);
  }
  
  return null;
}
