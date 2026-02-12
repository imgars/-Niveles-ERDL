# Bot de Niveles - Discord

Bot avanzado de Discord con sistema de niveles, economía virtual (Lagcoins), casino, minijuegos, power-ups, tarjetas de rango en pixel art y mucho más. Diseñado para comunidades de habla hispana que buscan gamificación e interacción social.

## Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comandos](#comandos)
- [Dashboard Web](#dashboard-web)
- [Panel de Administración](#panel-de-administración)
- [Despliegue en Render](#despliegue-en-render)
- [Tecnologías](#tecnologías)

---

## Características

### Sistema de Niveles y XP
- Fórmula progresiva de XP con cooldowns.
- Roles automáticos al alcanzar niveles específicos (1, 5, 10, 20, 25, 30, 35, 40, 50, 75, 100).
- Tarjetas de rango personalizadas en **pixel art** con 10 temas desbloqueables: Pixel, Ocean, Zelda, Pokémon, Geometry Dash, Night, Roblox, Minecraft, FNAF y Default.
- Multiplicadores de XP para Boosters, VIPs y horario nocturno.

### Economía Virtual (Lagcoins)
- Moneda virtual: **Lagcoins (LC)**.
- Sistema bancario con depósitos, retiros y límite expandible.
- Más de 24 trabajos disponibles con cooldowns.
- Tienda con más de 50 ítems comprables.
- Sistema de regalos entre usuarios (ítems, Lagcoins, XP).
- Impuestos semanales progresivos basados en la riqueza total.
- Rachas diarias con recompensas crecientes.

### Casino
- **Ruleta** con apuestas a color, número y rangos.
- **Tragamonedas (Slots)** con jackpot.
- **Blackjack** con mecánicas completas.
- **Coinflip** (cara o cruz).
- **Dados** con múltiples modos de apuesta.
- **Carreras de caballos** con apuestas.
- **Póker** simplificado.
- **Duelos** entre usuarios.
- Casino extendido y modo multi.

### Minijuegos
- **Trivia** con preguntas variadas.
- **Ahorcado** con palabras en español.
- **Piedra, Papel o Tijeras.**
- **Ruleta Rusa** con apuestas de niveles y Lagcoins.

### Sistema de Robos
- Robo a usuarios con probabilidad base del 15%.
- Asalto al banco con probabilidad del 5%.
- **Seguro Anti-Robo** con 4 niveles de protección (50% a 100%).

### Power-Ups
- 12 power-ups en 4 categorías: trabajo, casino, robo y XP.
- Duración temporal con activación manual.
- Boosts globales configurables por staff.

### Nacionalidades
- Más de 30 países asignables con probabilidades variables.
- Multiplicadores de salario según país.
- Sistema de viaje con pasaportes y visas para países desarrollados.
- Persistencia en MongoDB.

### Subastas
- Sistema de subastas entre usuarios para intercambiar ítems.

### Streaks
- Sistema de rachas de mensajes entre usuarios.
- Seguimiento diario con notificaciones de ruptura.

### Generación de Tarjetas con IA
- Comando `/gamecard` con generación de imágenes por IA (Gemini).
- Soporte para 8 videojuegos: Roblox, Minecraft, Brawl Stars, Geometry Dash, Fortnite, Clash Royale/CoC, Genshin Impact, Valorant.
- Tarjetas de perfil y de batalla.

### Matrimonios
- Sistema de matrimonio y divorcio entre usuarios.

---

## Requisitos

- **Node.js** v20 o superior
- **MongoDB** (Atlas o instancia propia)
- **Token de Discord Bot** con los intents necesarios
- **API Key de Gemini** (para generación de imágenes con IA)

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd discord-leveling-bot
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno (ver sección siguiente).

4. Inicia el bot:
   ```bash
   npm start
   ```

---

## Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DISCORD_TOKEN` | Token del bot de Discord | Sí |
| `CLIENT_ID` | ID de la aplicación de Discord | Sí |
| `GUILD_ID` | ID del servidor de Discord | Sí |
| `MONGODB_URI` | URI de conexión a MongoDB | Sí |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | API Key de Google Gemini | Sí |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | URL base de la API de Gemini | Sí |
| `ADMIN_SECRET` | Clave secreta para el panel de administración | Sí |

---

## Estructura del Proyecto

```
├── index.js                  # Archivo principal del bot y servidor Express
├── config.js                 # Configuración de IDs, roles, canales y constantes
├── package.json              # Dependencias y scripts
├── Procfile                  # Configuración para Render
│
├── commands/                 # 80 comandos del bot
│   ├── level.js              # Ver nivel y XP
│   ├── rank.js               # Tarjeta de rango pixel art
│   ├── leaderboard.js        # Tabla de clasificación
│   ├── work.js               # Sistema de trabajos
│   ├── shop.js / tienda.js   # Tienda de ítems
│   ├── balance.js            # Ver balance de Lagcoins
│   ├── bank.js               # Operaciones bancarias
│   ├── blackjack.js          # Juego de Blackjack
│   ├── slots.js              # Tragamonedas
│   ├── robar.js / rob.js     # Sistema de robos
│   ├── gamecard.js           # Tarjetas generadas con IA
│   ├── mision.js             # Misiones semanales
│   ├── powerups.js           # Gestión de power-ups
│   ├── nacionalidad.js       # Sistema de nacionalidades
│   ├── marry.js / divorce.js # Sistema de matrimonios
│   ├── help.js               # Ayuda y lista de comandos
│   ├── info.js               # Información del bot
│   └── ...                   # Y muchos más
│
├── utils/                    # Utilidades y módulos del sistema
│   ├── database.js           # Persistencia JSON local (fallback)
│   ├── mongoSync.js          # Sincronización con MongoDB
│   ├── xpSystem.js           # Cálculos de XP y niveles
│   ├── cardGenerator.js      # Generador de tarjetas pixel art
│   ├── geminiImageGenerator.js # Generación de imágenes con Gemini AI
│   ├── economyDB.js          # Base de datos de economía
│   ├── activityLogger.js     # Registro de actividad
│   ├── streakService.js      # Servicio de rachas
│   ├── timeBoost.js          # Boost nocturno
│   ├── casinoCooldowns.js    # Cooldowns del casino
│   ├── easterEggs.js         # Easter eggs
│   └── helpers.js            # Funciones auxiliares
│
├── data/                     # Datos estáticos y persistencia JSON
│   ├── users.json            # Datos de usuarios (fallback)
│   ├── economy.json          # Datos de economía
│   ├── boosts.json           # Boosts activos
│   ├── cooldowns.json        # Cooldowns activos
│   ├── shop_items.js         # Definición de ítems de tienda
│   ├── missions_templates.js # Plantillas de misiones
│   ├── trivia_questions.js   # Preguntas de trivia
│   └── hangman_words.js      # Palabras del ahorcado
│
├── public/                   # Dashboard web público
│   ├── index.html            # Página principal del dashboard
│   ├── css/style.css         # Estilos del dashboard
│   ├── js/main.js            # Lógica del dashboard
│   ├── js/minigame-gd.js     # Minijuego de Geometry Dash
│   ├── assets/cards/         # Imágenes de las tarjetas pixel art
│   └── admin/                # Panel de administración
│       ├── login.html        # Login del panel admin
│       ├── dashboard.html    # Dashboard de administración
│       ├── css/admin.css     # Estilos del panel admin
│       └── js/admin.js       # Lógica del panel admin
```

---

## Comandos

### Niveles y XP
| Comando | Descripción |
|---------|-------------|
| `/level` `/nivel` | Ver tu nivel y XP actual |
| `/rank` `/profile` | Generar tu tarjeta de rango pixel art |
| `/leaderboard` `/lb` | Ver la tabla de clasificación |
| `/rankcard` | Cambiar el tema de tu tarjeta de rango |
| `/xp` | Ver XP detallado |
| `/rewards` | Ver recompensas por nivel |

### Economía
| Comando | Descripción |
|---------|-------------|
| `/work` `/trabajar` | Trabajar para ganar Lagcoins |
| `/balance` | Ver tu balance de Lagcoins |
| `/bank` `/depositar` `/retirar` | Operaciones bancarias |
| `/shop` `/tienda` | Ver y comprar ítems |
| `/inventario` | Ver tu inventario |
| `/daily` | Recompensa diaria |
| `/streak` | Ver tu racha diaria |
| `/gift` | Regalar ítems, Lagcoins o XP |
| `/trade` | Intercambiar con otros usuarios |
| `/tax` | Ver información de impuestos |

### Casino
| Comando | Descripción |
|---------|-------------|
| `/blackjack` | Jugar Blackjack |
| `/slots` | Jugar Tragamonedas |
| `/coinflip` | Cara o cruz |
| `/dice` | Jugar dados |
| `/casinoextendido` | Casino con más juegos |
| `/casinomulti` | Casino multijugador |

### Social
| Comando | Descripción |
|---------|-------------|
| `/marry` | Pedir matrimonio |
| `/divorce` | Divorciarse |
| `/nacionalidad` | Ver o cambiar nacionalidad |
| `/afk` | Establecer estado AFK |
| `/8ball` | Bola 8 mágica |

### Robos y Seguridad
| Comando | Descripción |
|---------|-------------|
| `/robar` `/rob` | Intentar robar a un usuario |
| `/bankheist` | Asaltar el banco |
| `/seguro` | Comprar seguro anti-robo |

### Minijuegos
| Comando | Descripción |
|---------|-------------|
| `/minigame` | Trivia, ahorcado, RPS, ruleta rusa |
| `/gamecard` | Generar tarjeta de videojuego con IA |

### Power-Ups y Boosts
| Comando | Descripción |
|---------|-------------|
| `/powerups` | Ver y activar power-ups |
| `/boost` | Ver boosts activos |
| `/cooldowns` | Ver todos los cooldowns activos |

### Administración
| Comando | Descripción |
|---------|-------------|
| `/addcoins` `/removecoins` `/setcoins` | Gestionar Lagcoins |
| `/addlevel` `/removelevel` `/setlevel` | Gestionar niveles |
| `/globalboost` | Activar boost global |
| `/banxp` `/unbanxp` | Banear/desbanear del sistema XP |
| `/embed` | Enviar embeds personalizados |
| `/systemtoggle` | Activar/desactivar sistemas |

---

## Dashboard Web

El bot incluye un dashboard web público accesible en:

**[https://niveleserdl.onrender.com](https://niveleserdl.onrender.com)**

Incluye:
- Tabla de clasificación con paginación.
- Búsqueda de usuarios por nombre o ID.
- Estadísticas del servidor en tiempo real.
- Minijuego de Geometry Dash integrado.

---

## Panel de Administración

Accesible en `/admin/login.html`, el panel permite:

- **Dashboard** con estadísticas en tiempo real del bot.
- **Logs** de actividad: XP, niveles, Lagcoins, trabajo, casino, robos, misiones, ítems.
- **Gestión de usuarios**: búsqueda, modificación de XP/nivel/Lagcoins, historial.
- **Configuración**: visualización y toggle de mantenimiento.
- Auto-refresh de logs cada 5 segundos.

Cuentas de administrador preconfiguradas (Gars y Mazin).

---

## Despliegue en Render

1. Sube el proyecto a un repositorio de GitHub.

2. Crea un nuevo **Web Service** en [Render](https://render.com).

3. Conecta tu repositorio de GitHub.

4. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Agrega todas las variables de entorno necesarias en la sección **Environment**.

6. Despliega. El bot se iniciará automáticamente y el dashboard web estará disponible en la URL proporcionada por Render.

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Node.js v20** | Runtime del bot |
| **Discord.js v14** | Integración con la API de Discord |
| **Express.js** | Servidor web para el dashboard y APIs |
| **MongoDB / Mongoose** | Base de datos principal |
| **@napi-rs/canvas** | Generación de imágenes pixel art |
| **Google Gemini AI** | Generación de tarjetas con IA |
| **node-cron** | Tareas programadas (impuestos, streaks) |
| **moment-timezone** | Manejo de zonas horarias (Venezuela) |

---

## Licencia

ISC
