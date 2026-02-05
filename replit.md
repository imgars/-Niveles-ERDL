# -Niveles

## Recent Changes
- **Persistencia de Nacionalidades en MongoDB (Febrero 2026):**
  - Las nacionalidades ahora se guardan en MongoDB en lugar de solo archivo JSON.
  - Las funciones `getUserNationality`, `assignRandomNationality`, y `travelToCountry` ahora son async.
  - Cuando MongoDB está conectado, los datos se guardan ahí y sobreviven a reinicios de Render.
  - Si MongoDB falla, el sistema usa JSON local como fallback.
  - Requiere variable de entorno: `MONGODB_URI` con credenciales válidas.

- **Balance Update (Febrero 2026):**
  - Cooldowns actualizados: Casino 30-60s, Trabajo 1min, Robo 30s, Robo Banco 2min.
  - Sistema de límite de banco: Base 10k, expansiones comprables (+5k, +10k, +20k).
  - Precios de consumibles ajustados: Bebida 3k, Trébol 6k, Escudo 15k.
  - Probabilidad de robo reducida 10%: Usuario 15%, Banco 5%.
  - Escudo Anti-Robo ahora activa correctamente la protección de seguro.
  - Panel de estadísticas movido antes del leaderboard en el dashboard web.
  - Ruleta Rusa: timeout de 30s por turno, si no disparas pierde el DOBLE (6 niveles, 600 LC).

- **Comando /gamecard con IA (Enero 2026):**
  - Reconstruido completamente el comando `/gamecard` con generación de imágenes por IA.
  - Dos subcomandos: `/gamecard profile` (tarjeta de perfil) y `/gamecard battle` (tarjeta de batalla).
  - Soporte para 8 videojuegos: Roblox, Minecraft, Brawl Stars, Geometry Dash, Fortnite, Clash Royale/CoC, Genshin Impact, Valorant.
  - Opción de petición personalizada para que la IA genere exactamente lo que el usuario quiere.
  - Usa Gemini AI (Replit AI Integrations) para generar las imágenes.
  - Manejo de errores mejorado con reintentos para rate limits.
  - Requiere variables de entorno: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`.

- **Panel Admin Completo v2 (Enero 2026):**
  - Sistema de cuentas de administrador (Gars y Mazin).
  - Logs en tiempo real: XP, niveles, Lagcoins, trabajo, casino, robos, misiones, items.
  - Gestion de usuarios: busqueda por nombre/ID, ver detalles completos.
  - Modificacion de usuarios: agregar/quitar/establecer/resetear XP, nivel, Lagcoins (cartera y banco).
  - Historial de actividad por usuario con filtros.
  - Auto-refresh de logs cada 5 segundos.
  - Dashboard con estadisticas en tiempo real del bot.
  - Sistema XP: muestra XP total, promedio, maximo, top 10 usuarios.
  - Niveles: distribucion de usuarios por nivel, top 10 por nivel.
  - Roles: muestra roles asignados por nivel y roles especiales.
  - Misiones: estadisticas semanales de misiones completadas.
  - Power-ups: boosts globales, de usuario y de canal activos.
  - Estadisticas: metricas completas del sistema.
  - Configuracion: visualizacion de la configuracion del bot y toggle de mantenimiento.
- **Economy Rebalancing (Jan 2026):** 
  - Nerfed all job earnings by 40-50% to control inflation.
  - Increased shop prices (e.g., 100 XP now costs 3000 Lagcoins).
  - Increased all power-up prices significantly.
  - Rebalanced casino games with higher house edges and lower multipliers.
  - Fixed Slots Jackpot bug and capped it at x6 reward.
- **Reequilibrio de la Economía (Enero 2026):**
  - Se redujeron las ganancias de todos los trabajos en un 40-50% para controlar la inflación.
  - Se incrementaron los precios de la tienda (ej. 100 XP ahora cuesta 3000 Lagcoins).
  - Se incrementaron significativamente los precios de todos los power-ups.
  - Se reequilibraron los juegos del casino con mayor ventaja para la casa y menores multiplicadores.
  - Se corrigió el error del Jackpot en las Slots y se limitó a una recompensa x6.
  - Se nerfeó el sistema de robos: probabilidad base reducida al 25%, robo máximo del 10% y multas incrementadas.
- **Restauración de Nacionalidades (Enero 2026):**
  - Se revirtieron los multiplicadores de nacionalidad y salarios a sus valores originales según la preferencia del usuario.

## Overview
This project is a comprehensive Discord bot featuring a leveling and XP system, a virtual economy (Lagcoins), a casino with various games, minigames, power-ups, anti-theft insurance, nationality assignments, auctions, user streaks, and customizable PIXEL ART rank cards. The bot is designed for deployment on Render from GitHub, ensuring persistence and scalability. It aims to provide an engaging and interactive experience for Discord communities through gamification and social features.

## User Preferences
I prefer simple language. I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture
The bot is built with Node.js and uses a command-based structure for Discord interactions. Data persistence is handled via MongoDB for production deployments (Render) with a JSON fallback for development (Replit).

**UI/UX Decisions:**
- **PIXEL ART Theme:** A consistent pixel art style is applied to rank cards and leaderboards, with 9 distinct themes (Pixel, Ocean, Zelda, Pokemon, Geometry Dash, Night, Roblox, Minecraft, FNAF) unlocked based on user level or special conditions.
- **Interactive Menus:** Commands like `/work` utilize interactive menus for better user experience.
- **Web Dashboard:** A public web dashboard (`public/index.html`) provides additional information and leaderboards, including paginated results and user lookup modals.

**Technical Implementations:**
- **Leveling System:** Progressive XP formula with cooldowns and automatic role rewards at specific levels.
- **Economy System:** Features Lagcoins as virtual currency, banking, 24+ jobs, a shop with 50+ items, a theft system with insurance, daily streaks, and weekly taxes.
- **Power-Ups:** 12 different power-ups across 4 categories (work, casino, theft, XP boosts) with temporary durations.
- **Anti-Robo Insurance:** Four tiers of protection (50% to 100%) against theft.
- **Nationalities:** Over 30 countries with varying probabilities, work multipliers, and a travel system requiring passports and visas for developed nations.
- **Casino & Minigames:** A variety of casino games (Roulette, Slots, Blackjack, Coinflip, Dice, Horse Racing, Poker, Duels) and minigames (Trivia, Hangman, Rock-Paper-Scissors, Russian Roulette).
- **Boost System:** Accumulable boosts (XP, economy) with automatic boosts for VIPs/Boosters and a nocturnal boost.
- **Card Generation:** Dynamic generation of pixel art profile cards and game-specific cards (Minecraft, Brawl Stars, Roblox).

**Feature Specifications:**
- **Cooldowns:** Comprehensive `/cooldowns` command to view all active cooldowns.
- **Gifting System:** `/gift` command to transfer items, Lagcoins, or XP between users.
- **Tax System:** Weekly progressive tax system based on total wealth, with penalties for non-payment.

**System Design Choices:**
- **Modularity:** Project structure uses `commands/`, `utils/`, `data/` directories for better organization.
- **Deployment:** Optimized for Render deployment, with specific instructions for configuring environment variables.
- **Database Synchronization:** `mongoSync.js` handles synchronization with MongoDB, `database.js` for JSON persistence.

## External Dependencies
- **Discord API:** Core integration for bot functionality.
- **MongoDB:** Primary database for persistent data storage in production.
- **Render:** Cloud platform for hosting the bot.
- **GitHub:** Version control and deployment source for Render.