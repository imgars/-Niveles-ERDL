import { CONFIG } from '../config.js';

export function isStaff(member) {
  return member.roles.cache.has(CONFIG.STAFF_ROLE_ID);
}

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function createEmbed(options) {
  return {
    color: options.color || 0x7289DA,
    title: options.title,
    description: options.description,
    fields: options.fields || [],
    footer: options.footer,
    timestamp: options.timestamp ? new Date() : undefined,
    image: options.image,
    thumbnail: options.thumbnail
  };
}

export function createProgressBar(percentage, length = 20) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
