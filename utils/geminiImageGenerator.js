import { GoogleGenAI } from '@google/genai';

function checkEnvVars() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    return {
      valid: false,
      message: 'Las variables de entorno de Gemini AI no están configuradas. Contacta al administrador del bot.'
    };
  }
  return { valid: true };
}

let ai = null;

function getAIClient() {
  if (!ai) {
    const envCheck = checkEnvVars();
    if (!envCheck.valid) {
      throw new Error(envCheck.message);
    }
    
    ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
  }
  return ai;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateGameImage(game, playerName, cardType, customRequest = '', retries = 2) {
  const envCheck = checkEnvVars();
  if (!envCheck.valid) {
    throw new Error(envCheck.message);
  }

  const gameStyles = {
    roblox: 'Roblox blocky 3D character style, colorful, playful, LEGO-like aesthetic',
    minecraft: 'Minecraft pixelated voxel style, blocky textures, 8-bit inspired',
    brawlstars: 'Brawl Stars cartoon style, vibrant colors, bold outlines, dynamic action pose',
    geometrydash: 'Geometry Dash neon style, geometric shapes, glowing effects, rhythm game aesthetic',
    fortnite: 'Fortnite cartoon style, vibrant colors, battle royale theme',
    clash: 'Clash of Clans/Royale style, cartoon medieval fantasy, vibrant colors',
    genshin: 'Genshin Impact anime style, beautiful fantasy world, elemental effects',
    valorant: 'Valorant tactical style, futuristic agents, sleek design'
  };

  const cardTypeDescriptions = {
    profile: 'profile card showing character stats, level, achievements, centered portrait composition',
    battle: 'epic battle card showing character in action pose, dynamic combat scene, power effects, dramatic lighting'
  };

  const gameStyle = gameStyles[game.toLowerCase()] || 'video game character style';
  const cardDesc = cardTypeDescriptions[cardType] || cardTypeDescriptions.profile;

  let prompt = `Create a ${cardType} gaming card image for a player named "${playerName}". 
Style: ${gameStyle}. 
Card type: ${cardDesc}.
The card should look like a collectible trading card with decorative borders, the player name displayed prominently, and game-themed visual elements.
High quality, detailed, professional gaming card design.`;

  if (customRequest && customRequest.trim()) {
    prompt += `\nAdditional request: ${customRequest}`;
  }

  let lastError = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const client = getAIClient();
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error("La IA no generó una respuesta válida. Intenta de nuevo.");
      }

      const candidate = response.candidates[0];
      
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("La respuesta de la IA está incompleta. Intenta de nuevo.");
      }

      const imagePart = candidate.content.parts.find(part => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        throw new Error("La IA no generó una imagen. Intenta con una petición diferente.");
      }

      return Buffer.from(imagePart.inlineData.data, 'base64');
      
    } catch (error) {
      lastError = error;
      
      const errorMsg = error.message || '';
      const isRateLimit = errorMsg.includes('429') || 
                          errorMsg.toLowerCase().includes('rate') || 
                          errorMsg.toLowerCase().includes('quota') ||
                          errorMsg.toLowerCase().includes('limit');
      
      if (isRateLimit && attempt < retries) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        await sleep(waitTime);
        continue;
      }
      
      if (!isRateLimit) {
        break;
      }
    }
  }

  console.error('Error generating image with Gemini:', lastError);
  throw lastError;
}

export const SUPPORTED_GAMES = [
  { name: 'Roblox', value: 'roblox' },
  { name: 'Minecraft', value: 'minecraft' },
  { name: 'Brawl Stars', value: 'brawlstars' },
  { name: 'Geometry Dash', value: 'geometrydash' },
  { name: 'Fortnite', value: 'fortnite' },
  { name: 'Clash Royale/CoC', value: 'clash' },
  { name: 'Genshin Impact', value: 'genshin' },
  { name: 'Valorant', value: 'valorant' }
];

export function isGeminiConfigured() {
  return checkEnvVars().valid;
}
