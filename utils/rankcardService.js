/**
 * Servicio de Rankcards Personalizables
 * Gestiona validación de roles VIP/Booster, cálculo de costos en Lagcoins
 * y verificación de identidad para el editor web.
 */
import crypto from 'crypto';
import { CONFIG } from '../config.js';

// Costos en Lagcoins
export const RANKCARD_BASE_COST = 7500;
export const RANKCARD_IMAGE_EXTRA_COST = 500;
export const RANKCARD_PREMIUM_FONT_COST = 1000;

// Paleta Neón (solo VIP/Booster)
export const NEON_COLORS = [
  '#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF6600',
  '#FF1493', '#00CED1', '#7FFF00', '#FFD700', '#FF4500'
];

// Tipografías estándar (todos)
export const STANDARD_FONTS = [
  { id: 'arial', name: 'Arial', premium: false },
  { id: 'sans-serif', name: 'Sans Serif', premium: false }
];

// Tipografías premium (solo VIP/Booster)
export const PREMIUM_FONTS = [
  { id: 'press-start', name: 'Press Start 2P', premium: true },
  { id: 'monospace', name: 'Monospace Pixel', premium: true },
  { id: 'impact', name: 'Impact', premium: true }
];

// Máximo de imágenes para usuarios estándar
const STANDARD_MAX_IMAGES = 1;
// Máximo de imágenes para VIP/Booster
const VIP_MAX_IMAGES = 5;

// Secret para tokens (usar env en producción)
const TOKEN_SECRET = process.env.RANKCARD_TOKEN_SECRET || process.env.MONGODB_URI || 'rankcard-secret-key';
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Verifica si un usuario tiene rol VIP o Booster en el servidor
 * @param {import('discord.js').GuildMember} member
 * @returns {{ isVIP: boolean, isBooster: boolean }}
 */
export function checkVIPBoosterRoles(member) {
  if (!member || !member.roles) {
    return { isVIP: false, isBooster: false };
  }
  const roles = member.roles.cache;
  return {
    isVIP: roles.has(CONFIG.VIP_ROLE_ID),
    isBooster: roles.has(CONFIG.BOOSTER_ROLE_ID)
  };
}

/**
 * Determina si el usuario tiene beneficios VIP (paleta Neón, tipografías premium, múltiples imágenes)
 */
export function hasVIPBenefits(isVIP, isBooster) {
  return isVIP || isBooster;
}

/**
 * Valida la configuración de rankcard contra los permisos del usuario.
 * Previene inyección de beneficios VIP.
 * @param {Object} config - Configuración enviada por el cliente
 * @param {{ isVIP: boolean, isBooster: boolean }} roles
 * @returns {{ valid: boolean, sanitized: Object, error?: string }}
 */
export function validateRankcardConfig(config, { isVIP, isBooster }) {
  const hasVIP = hasVIPBenefits(isVIP, isBooster);
  const sanitized = {
    backgroundColor: '#36393F',
    accentColor: '#5865F2',
    textColor: '#FFFFFF',
    barColor: '#5865F2',
    useNeonPalette: false,
    fontId: 'arial',
    baseImages: [],
    logos: []
  };

  // Validar colores - si no es VIP, rechazar paleta Neón
  if (config.useNeonPalette && !hasVIP) {
    return { valid: false, error: 'La paleta Neón requiere rol VIP o Booster' };
  }
  sanitized.useNeonPalette = hasVIP && !!config.useNeonPalette;

  // Colores básicos (hex válido)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (config.backgroundColor && hexRegex.test(config.backgroundColor)) {
    sanitized.backgroundColor = config.backgroundColor;
  }
  if (config.accentColor && hexRegex.test(config.accentColor)) {
    sanitized.accentColor = config.accentColor;
  }
  if (config.textColor && hexRegex.test(config.textColor)) {
    sanitized.textColor = config.textColor;
  }
  if (config.barColor && hexRegex.test(config.barColor)) {
    sanitized.barColor = config.barColor;
  }

  // Si usa Neón, validar que el color esté en la paleta
  if (sanitized.useNeonPalette && config.accentColor) {
    if (!NEON_COLORS.includes(config.accentColor.toUpperCase())) {
      sanitized.accentColor = NEON_COLORS[0];
    }
  }

  // Validar tipografía
  const allFonts = [...STANDARD_FONTS, ...PREMIUM_FONTS];
  const selectedFont = allFonts.find(f => f.id === config.fontId);
  if (selectedFont) {
    if (selectedFont.premium && !hasVIP) {
      return { valid: false, error: 'Tipografía premium requiere rol VIP o Booster' };
    }
    sanitized.fontId = config.fontId;
  }

  // Validar imágenes - límite según rol
  const maxImages = hasVIP ? VIP_MAX_IMAGES : STANDARD_MAX_IMAGES;
  const baseImages = Array.isArray(config.baseImages) ? config.baseImages : [];
  const logos = Array.isArray(config.logos) ? config.logos : [];

  if (baseImages.length + logos.length > maxImages) {
    return {
      valid: false,
      error: `Máximo ${maxImages} imagen(es) para tu plan. VIP/Booster: ${VIP_MAX_IMAGES}`
    };
  }

  // Sanitizar URLs de imágenes (solo URLs permitidas)
  const validUrl = (url) => {
    if (typeof url !== 'string') return false;
    try {
      const u = new URL(url);
      return ['https:', 'http:'].includes(u.protocol) && u.hostname.endsWith('cdn.discordapp.com');
    } catch {
      return false;
    }
  };

  sanitized.baseImages = baseImages
    .filter(img => img && img.url && validUrl(img.url))
    .slice(0, maxImages)
    .map(img => ({
      url: img.url,
      x: Math.max(0, Math.min(800, Number(img.x) || 0)),
      y: Math.max(0, Math.min(250, Number(img.y) || 0)),
      width: Math.max(20, Math.min(200, Number(img.width) || 100)),
      height: Math.max(20, Math.min(200, Number(img.height) || 100))
    }));

  sanitized.logos = logos
    .filter(img => img && img.url && validUrl(img.url))
    .slice(0, maxImages - sanitized.baseImages.length)
    .map(img => ({
      url: img.url,
      x: Math.max(0, Math.min(800, Number(img.x) || 0)),
      y: Math.max(0, Math.min(250, Number(img.y) || 0)),
      width: Math.max(20, Math.min(150, Number(img.width) || 50)),
      height: Math.max(20, Math.min(150, Number(img.height) || 50))
    }));

  return { valid: true, sanitized };
}

/**
 * Calcula el costo total en Lagcoins de una configuración de rankcard
 */
export function calculateRankcardCost(config, { isVIP, isBooster }) {
  let total = RANKCARD_BASE_COST;
  const hasVIP = hasVIPBenefits(isVIP, isBooster);

  // Imágenes adicionales (la primera base no cuenta como extra)
  const totalImages = (config.baseImages?.length || 0) + (config.logos?.length || 0);
  const extraImages = Math.max(0, totalImages - 1);
  total += extraImages * RANKCARD_IMAGE_EXTRA_COST;

  // Tipografía premium
  const font = PREMIUM_FONTS.find(f => f.id === config.fontId);
  if (font && font.premium && hasVIP) {
    total += RANKCARD_PREMIUM_FONT_COST;
  }

  return total;
}

/**
 * Genera un token de verificación temporal para el editor web
 */
export function createVerificationToken(userId, guildId) {
  const payload = JSON.stringify({
    userId,
    guildId,
    exp: Date.now() + TOKEN_EXPIRY_MS
  });
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
}

/**
 * Verifica un token y devuelve los datos del usuario
 * @returns {{ userId: string, guildId: string } | null}
 */
export function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { payload, signature } = decoded;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');
    if (signature !== expectedSig) return null;

    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;
    return { userId: data.userId, guildId: data.guildId };
  } catch {
    return null;
  }
}
