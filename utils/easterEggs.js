import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';
import { getUserEconomy, saveUserEconomy, activatePowerup } from './economyDB.js';
import db from './database.js';

const DATA_DIR = './data';
const EASTER_EGGS_FILE = path.join(DATA_DIR, 'eastereggs.json');

// Imágenes de bolívares venezolanos (URLs públicas)
const BOLIVARES_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Billete_de_100_Bol%C3%ADvares_Soberanos.jpg/1200px-Billete_de_100_Bol%C3%ADvares_Soberanos.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Billete_de_500_Bol%C3%ADvares.jpg/1200px-Billete_de_500_Bol%C3%ADvares.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Billete_de_1000_bolivares.jpg/1200px-Billete_de_1000_bolivares.jpg'
];

// Imágenes de arepas (URLs públicas)
const AREPA_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Cachapa_con_queso_de_mano.jpg/1200px-Cachapa_con_queso_de_mano.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Arepa_de_pabellon.jpg/1200px-Arepa_de_pabellon.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Arepa.jpg/1200px-Arepa.jpg'
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
  
  // Easter eggs con recompensa solo se pueden usar una vez
  if (hasReward) {
    return { canUse: false, reason: 'already_claimed' };
  }
  
  // Easter eggs sin recompensa tienen cooldown de 12 horas
  const cooldown = 12 * 60 * 60 * 1000; // 12 horas
  const timeSinceLastUse = now - data[key].lastUsed;
  
  if (timeSinceLastUse < cooldown) {
    const remainingHours = Math.ceil((cooldown - timeSinceLastUse) / (60 * 60 * 1000));
    return { canUse: false, reason: 'cooldown', remaining: remainingHours };
  }
  
  return { canUse: true };
}

export function markEasterEggUsed(userId, eggName) {
  const data = loadEasterEggsFile();
  const key = `${userId}-${eggName}`;
  
  data[key] = {
    lastUsed: Date.now(),
    count: (data[key]?.count || 0) + 1
  };
  
  saveEasterEggsFile(data);
}

export async function handleEasterEgg(message, client) {
  const content = message.content.toLowerCase().trim();
  
  // !Lagcoin - Muestra imagen de bolívares
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
      content: '💵 **¡Bolívares Venezolanos!**',
      files: [randomImage]
    }).catch(() => {
      return message.reply('💵 **¡Bolívares Venezolanos!** (Imagen no disponible)');
    });
  }
  
  // !Mzingerkai - Añade 777 XP
  if (content === '!mzingerkai') {
    const check = canUseEasterEgg(message.author.id, 'mzingerkai', true);
    if (!check.canUse) {
      return message.reply('❌ Ya has reclamado esta recompensa.');
    }
    
    markEasterEggUsed(message.author.id, 'mzingerkai');
    
    // Añadir XP al usuario
    const key = `${message.guild.id}-${message.author.id}`;
    if (!db.users[key]) {
      db.users[key] = { xp: 0, level: 0, totalXp: 0, guildId: message.guild.id, oderId: message.author.id };
    }
    db.users[key].xp += 777;
    db.users[key].totalXp = (db.users[key].totalXp || 0) + 777;
    db.save();
    
    return message.reply('🎰 **¡MZINGERKAI!** Has recibido **+777 XP** de niveles. ¡Número de la suerte!');
  }
  
  // !SirgioBOT - Muestra imagen especial
  if (content === '!sirgiobot') {
    const check = canUseEasterEgg(message.author.id, 'sirgiobot', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'sirgiobot');
    
    // Buscar la imagen adjunta
    const imagePath = './attached_assets/image_1764818670370.png';
    if (fs.existsSync(imagePath)) {
      const attachment = new AttachmentBuilder(imagePath, { name: 'sirgiobot.png' });
      return message.reply({ files: [attachment] });
    } else {
      return message.reply('😎 **SirgioBOT** te saluda!');
    }
  }
  
  // !Arepa - Muestra imagen de arepa
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
      content: '🫓 **¡Arepas Venezolanas!** ¡Que rico!',
      files: [randomImage]
    }).catch(() => {
      return message.reply('🫓 **¡Arepas Venezolanas!** ¡Que rico! (Imagen no disponible)');
    });
  }
  
  // !Dinnerbone - Imagen del usuario de cabeza
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
      
      // Voltear imagen de cabeza
      ctx.translate(128, 128);
      ctx.rotate(Math.PI);
      ctx.drawImage(avatar, -128, -128, 256, 256);
      
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'dinnerbone.png' });
      
      return message.reply({ 
        content: '🙃 **¡Dinnerbone!**',
        files: [attachment] 
      });
    } catch (error) {
      console.error('Error en dinnerbone:', error);
      return message.reply('🙃 **¡Dinnerbone!** (Error al generar imagen)');
    }
  }
  
  // !casin0 - Boost de suerte del 500% por 30 minutos
  if (content === '!casin0') {
    const check = canUseEasterEgg(message.author.id, 'casin0', true);
    if (!check.canUse) {
      return message.reply('❌ Ya has reclamado esta recompensa.');
    }
    
    markEasterEggUsed(message.author.id, 'casin0');
    
    // Activar power-up de suerte extrema
    activatePowerup(message.guild.id, message.author.id, 'casino_luck', 5.0, 30 * 60 * 1000);
    
    return message.reply('🎰🔥 **¡CASIN0!** Has recibido un boost de suerte del **500%** en el casino por **30 minutos**. ¡Corre a apostar!');
  }
  
  // !gars - Mensaje de créditos
  if (content === '!gars') {
    const check = canUseEasterEgg(message.author.id, 'gars', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'gars');
    return message.reply('💻 **-Niveles programado por Imgars**');
  }
  
  // !timeoutt - Mensaje especial
  if (content === '!timeoutt') {
    const check = canUseEasterEgg(message.author.id, 'timeoutt', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'timeoutt');
    return message.reply('😢 **No deberías auto mutearte :(**');
  }
  
  // !pelotocino - Créditos idea misiones
  if (content === '!pelotocino') {
    const check = canUseEasterEgg(message.author.id, 'pelotocino', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'pelotocino');
    return message.reply('💡 **Idea del Sistema de misiones por pelotocino**');
  }
  
  // !uno - Responde "Dos"
  if (content === '!uno') {
    const check = canUseEasterEgg(message.author.id, 'uno', false);
    if (!check.canUse) {
      if (check.reason === 'cooldown') {
        return message.reply(`⏳ Debes esperar **${check.remaining} horas** para usar esto de nuevo.`);
      }
    }
    
    markEasterEggUsed(message.author.id, 'uno');
    return message.reply('🔢 **Dos**');
  }
  
  return null;
}
