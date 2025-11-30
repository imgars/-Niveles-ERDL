# Discord Leveling Bot - Proyecto

## 📋 Descripción General

Bot de Discord completo con sistema de niveles, XP, minijuegos y tarjetas de rango personalizadas. Este proyecto está listo para ejecutarse en Replit y ser desplegado a Render u otras plataformas de hosting.

## 🎯 Funcionalidades Principales

### Sistema de Niveles y XP
- Fórmula de XP progresiva (niveles 1-5 muy rápidos, hasta nivel 90+ muy lentos)
- Cooldown de 10 segundos entre mensajes
- Ganancia de XP por mensajes, imágenes, videos y reacciones
- Recompensas automáticas de roles en niveles específicos
- Persistencia de datos en JSON (sobrevive reinicios)

### Sistema de Boosts
- Boosts acumulables (se suman entre sí)
- Boost automático de 200% para Boosters y VIPs
- Boost nocturno de 25% (18:00-06:00 Venezuela)
- Boosts personalizados por usuario, canal o globales
- Gestión completa vía comandos

### Minijuegos
- **Trivia**: 5 preguntas, recompensas de boost o niveles
- **Piedra, Papel o Tijeras**: Mejor de 3, con recompensas
- **Ruleta Rusa**: ¡Riesgoso! Ganador +2.5 niveles, perdedor -3 niveles
- **Ahorcado Solo**: 3 rondas, 25% boost o 1 nivel, cooldown 48h
- **Ahorcado Multi**: Host vs Adivinador, +0.5 niveles, cooldown 30min
- Sistema de cooldowns para cada minijuego

### Tarjetas Personalizadas
- Generación dinámica con Canvas
- Temas pixel art según rango del usuario
- Temas especiales para boosters, VIPs y usuario especial

### Dashboard Web (NUEVO)
- Página web con tema retro pixel art (Pokemon, Zelda, Mario)
- Secciones: Inicio, Características, Comandos, Minijuegos, Tarjetas, Leaderboard
- Leaderboard completo con hasta 500 usuarios (más que los 10 de Discord)
- Avatares y nombres de usuario de Discord en el leaderboard
- Sistema de caché de 10 minutos para datos de Discord
- API REST para obtener datos del leaderboard
- Diseño responsive para móviles
- Efectos visuales: scanlines, glitch, animaciones retro

## 🔧 Configuración Actual

### IDs Configurados en `config.js`
```javascript
STAFF_ROLE_ID: '1230949715127042098'
BOOSTER_ROLE_ID: '1423037247606882399'
VIP_ROLE_ID: '1423037247606882399'
SPECIAL_USER_ID: '956700088103747625'
LEVEL_UP_CHANNEL_ID: '1243975130908983356'
NO_XP_CHANNELS: ['1313723272290111559', '1258524941289263254']
```

### Roles de Nivel
- Nivel 1: 1313715879816597514
- Nivel 5: 1313716079998140536
- Nivel 10: 1313716235573264437
- Nivel 20: 1313716306599481436
- Nivel 25: 1239330751334584421 (Miembro Activo)
- Nivel 30: 1438675114911596624
- Nivel 35: 1313716401021911102 (Miembro Super Activo)
- Nivel 40: 1313716612452581437
- Nivel 50: 1313716715934453761
- Nivel 75: 1313716864790302730
- Nivel 100: 1313716964383920269

## 🚀 Cómo Ejecutar

### En Replit (Configurado ✅)
Este proyecto está completamente configurado para Replit:

1. **Variables de entorno**: `DISCORD_BOT_TOKEN` configurado en Secrets ✅
2. **Workflow**: Configurado para ejecutar `node index.js` automáticamente ✅
3. **Dependencias**: Instaladas automáticamente con npm ✅
4. **Puerto**: Servidor web en puerto 5000 con Dashboard ✅
5. **Deployment**: Configurado para VM (24/7) ✅
6. **Dashboard Web**: Accesible en la URL del proyecto ✅
7. **Datos Persistentes**: JSON con almacenamiento persistente en Render ✅

El bot está corriendo y conectado a Discord. Solo presiona "Run" para iniciarlo.

### URLs del Dashboard
- `/` - Página principal con todas las secciones
- `/api/leaderboard` - API JSON con hasta 500 usuarios
- `/api/stats` - Estadísticas generales
- `/health` - Health check para Uptime Robot

### Localmente
```bash
npm install
DISCORD_BOT_TOKEN=tu_token node index.js
```

## 📦 Estructura del Proyecto

```
├── index.js              # Bot principal
├── config.js             # Configuración
├── commands/             # Comandos slash (22 archivos)
├── utils/                # Utilidades
│   ├── database.js       # Persistencia JSON
│   ├── xpSystem.js       # Sistema de XP
│   ├── cardGenerator.js  # Generación de imágenes
│   ├── timeBoost.js      # Boost nocturno
│   └── helpers.js        # Funciones auxiliares
└── data/                 # Datos persistentes
```

## 📝 Comandos Disponibles

### Usuarios (19 comandos)
- `/level`, `/nivel`, `/rank` - Ver nivel con tarjeta
- `/leaderboard`, `/lb` - Tabla de clasificación
- `/rewards list` - Ver recompensas
- `/boost list`, `/boost status` - Ver boosts
- `/minigame trivia/rps/roulette` - Jugar minijuegos
- `/ahorcado solo/multi` - Jugar Ahorcado
- `/help` - Ayuda

### Staff (13 comandos)
- `/addlevel`, `/removelevel`, `/setlevel` - Gestión de niveles
- `/xp add/remove/reset` - Gestión de XP
- `/boost add`, `/globalboost`, `/removeglobalboost` - Gestión de boosts
- `/banxp`, `/unbanxp` - Sistema de bans
- `/resettemporada` - Resetear temporada
- `/clearlevelroles` - Limpiar roles
- `/embed`, `/mensaje` - Mensajes personalizados
- `/help staff` - Ayuda de staff

## 🎨 Temas de Tarjetas

- **Normal**: Pixel art básico (usuarios normales)
- **Ocean**: Tema marino (Nivel 25+, Miembro Activo)
- **Zelda**: Amarillo/verde (Nivel 35+, Super Activo)
- **Pokemon**: Rojo/amarillo (Nivel 100+)
- **Geometry Dash**: Colores neón (Boosters)
- **Night**: Noche estrellada (VIPs)
- **Aleatorio**: Roblox/Minecraft/Zelda/FNAF/GD (Usuario especial)

## 🔄 Mejoras Futuras Planeadas

### Completado ✅
- [x] Hangman (Ahorcado) modo solitario - 3 rondas con select menus
- [x] Hangman (Ahorcado) multijugador - Host vs Adivinador
- [x] Sistema de cooldowns para Ahorcado (48h solo, 30min multi)
- [x] Recompensas de niveles fraccionarios

### Pendientes
- [ ] Más preguntas de trivia
- [ ] Sistema de achievements/logros
- [ ] Dashboard web
- [ ] Estadísticas detalladas
- [ ] Sistema de economía opcional
- [ ] Más minijuegos

## 📊 Fórmula de XP Actual

```
Nivel 1-5:   100 XP base (MUY rápido)
Nivel 6-10:  150 XP base (Muy rápido)
Nivel 11-15: 250 XP base (Rápido)
Nivel 16-20: 400 XP base (Med. rápido)
Nivel 21-35: 600 XP base (Normal)
Nivel 36-40: 850 XP base (Med. lento)
Nivel 41-50: 1200 XP base (Lento)
Nivel 51-75: 1800 XP base (Med. lento)
Nivel 76-90: 2500 XP base (Lento)
Nivel 90+:   3500 XP base (MUY lento)
```

Multiplicador por nivel: `baseXP * (1 + nivel * 0.1)`

## 💾 Datos Persistentes - MongoDB (RECOMENDADO)

Datos persistentes con MongoDB Atlas (gratis):
- Sincronización automática cada 5 minutos
- Backup automático en la nube
- Datos no se pierden en deploys

**Configuración:**
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea cuenta gratis
3. Crea un cluster gratis
4. Copia la connection string
5. En Render/Replit: Agrégala como variable `MONGODB_URI` en Secrets
6. ¡Listo! Los datos se sincronizan automáticamente

**Si no quieres MongoDB:**
- Los datos se guardan localmente en JSON (`data/`)
- Se pierden en deploys de Render
- Opción: Hacer git push de `data/` a GitHub

## 🌐 Despliegue a Producción

### Opción 1: Render (24/7 Recomendado)
**Pasos para desplegar a Render:**

1. **Crear cuenta en Render:**
   - Ve a https://render.com y crea una cuenta
   - Conecta tu cuenta de GitHub

2. **Conectar el repositorio:**
   - En Render, haz clic en "New +"
   - Selecciona "Web Service"
   - Conecta tu repositorio de GitHub
   - Autoriza acceso a tus repositorios

3. **Configurar el servicio:**
   - **Name:** Ponle un nombre (ej: discord-bot)
   - **Region:** Selecciona la más cercana
   - **Branch:** main (o la rama que uses)
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`

4. **Configurar variables de entorno:**
   - En la sección "Environment"
   - Añade: `DISCORD_BOT_TOKEN` = tu token de Discord

5. **Tipo de servicio:**
   - Selecciona "Worker" (no Web Service, ya que es un bot)
   - Los workers cumplen 24/7

6. **Desplegar:**
   - Haz clic en "Create Web Service"
   - Render descargará, instalará y ejecutará el bot automáticamente

**Notas:**
- El bot estará corriendo 24/7
- Se reiniciará automáticamente si falla
- Los datos se guardan en archivos JSON (asegúrate de hacer backup)

### Opción 2: Otros servicios
Compatible con cualquier plataforma que soporte Node.js:
- Railway (similar a Render)
- Fly.io
- DigitalOcean App Platform
- Heroku (requiere tarjeta de crédito ahora)
- AWS/GCP/Azure

## ⚙️ Variables de Entorno Requeridas

```
DISCORD_BOT_TOKEN=tu_token_de_discord
```

## 🔐 Seguridad

- Token del bot nunca incluido en el código
- Datos persistentes en archivos locales
- Sistema de permisos basado en roles de Discord
- Comandos peligrosos requieren confirmación

## 📞 Intents Requeridos

En Discord Developer Portal, activa:
- Server Members Intent
- Message Content Intent
- Guilds Intent
- Guild Messages Intent
- Guild Message Reactions Intent

## 🆘 Troubleshooting

### Bot no responde
- Verifica token en Secrets
- Revisa intents en Discord Developer Portal
- Chequea permisos del bot en el servidor

### Tarjetas no se generan
- Verifica instalación de `@napi-rs/canvas`
- Revisa logs de consola

### Boost nocturno no funciona
- Verifica zona horaria en `config.js`
- Chequea logs de cron

## 📄 Licencia

ISC - Libre para uso y modificación

---

**Última actualización**: 30 de Noviembre de 2025
**Estado**: ✅ 100% COMPLETO - MongoDB configurado y sincronizando datos
**Versión**: 1.1.0 - Todos los minijuegos + MongoDB Atlas
**Entorno**: Replit + MongoDB Atlas - Datos persistentes en producción
**MongoDB**: ✅ Conectado - Sincronización automática cada 5 minutos

## 🎮 Detalles del Minijuego de Ahorcado

### Diseño Técnico
- **Interfaz**: StringSelectMenu (menú desplegable) con 25 opciones
- **Alfabeto**: ABCDEFGHIJKLMNÑOPQRSTUVYZ (sin W ni X por límites de componentes)
- **Ventaja**: Solo usa 1 ActionRow (en lugar de 5 filas de botones)
- **Arquitectura**: `createLetterSelector()` genera menús dinámicos

### Modo Solitario (`/ahorcado solo`)
- 3 rondas consecutivas
- Palabras aleatorias de un pool de 20 palabras
- Ganar 2/3 rondas: 25% boost x24h o 1 nivel
- Cooldown: 48 horas (aplicado siempre, ganar o perder)
- 6 intentos fallidos máximo por ronda

### Modo Multijugador (`/ahorcado multi`)
- Host crea palabra personalizada
- Adivinador intenta resolver
- Recompensa: +0.5 niveles al ganar
- Cooldown: 30 minutos
- Timeout: 5 minutos

### Pool de Palabras (20 palabras)
DISCORD, MINECRAFT, POKEMON, ROBOTICA, ASTRONAUTA, COMPUTADORA,
PROGRAMACION, VIDEOJUEGO, TECNOLOGIA, AVENTURA, DESARROLLO,
SERVIDOR, MODERADOR, COMUNIDAD, RECOMPENSA, DESAFIO,
VICTORIA, JUGADOR, MENSAJE, RANKING
