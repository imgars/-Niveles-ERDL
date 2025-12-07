# -Niveles

## Descripcion General

Bot de Discord completo con sistema de niveles, XP, economia (Lagcoins), casino, minijuegos, power-ups, seguros, nacionalidades, subastas, rachas de usuarios y tarjetas de rango personalizadas con estilo **PIXEL ART**. Este proyecto esta diseñado para desplegarse en **Render desde GitHub** (https://github.com/imgars/-Niveles.git) - NO ejecutar en Replit para evitar conflictos.

## Deployment

**IMPORTANTE:** El bot se despliega en Render, no en Replit. Los secretos (DISCORD_BOT_TOKEN, MONGODB_URI) deben configurarse en Render.

### Secretos Requeridos (en Render):
- `DISCORD_BOT_TOKEN` - Token del bot de Discord
- `MONGODB_URI` - URI de conexion a MongoDB

## Funcionalidades Principales

### Sistema de Niveles y XP
- Formula de XP progresiva (niveles 1-5 muy rapidos, hasta nivel 90+ muy lentos)
- Cooldown de 10 segundos entre mensajes
- Ganancia de XP por mensajes, imagenes, videos y reacciones
- Recompensas automaticas de roles en niveles especificos
- Persistencia de datos en JSON y MongoDB

### Sistema de Economia (Lagcoins)
- Moneda virtual: Lagcoins
- Banco para depositar y proteger dinero
- 24+ trabajos diferentes con herramientas requeridas
- Tienda con 50+ items en 14 categorias
- Sistema de robos entre usuarios (con seguros anti-robo)
- Estadisticas detalladas de economia
- Rachas de recompensas diarias
- Sistema de impuestos semanales (NUEVO)

### Tarjetas y Leaderboards PIXEL ART (NUEVO v3.0)
- 9 temas de tarjetas pixel art:
  - **Pixel**: Tema basico cyan/teal
  - **Ocean**: Tema marino azul (Nivel 25+)
  - **Zelda**: Tema verde/dorado (Nivel 35+)
  - **Pokemon**: Tema naranja/rojo (Nivel 100+)
  - **Geometry Dash**: Colores neon arcoiris (Boosters)
  - **Night**: Noche estrellada (VIPs)
  - **Roblox**: Tema rojo (Usuario especial)
  - **Minecraft**: Tema tierra/verde (Usuario especial)
  - **FNAF**: Tema oscuro terrorfico (Usuario especial)
- Leaderboard general con pixel art
- Leaderboard Elite (100+) estilo Minecraft 1.12
- Leaderboards de economia con imagen generada

### Sistema de Power-Ups
- 12 power-ups diferentes en 4 categorias
- Boosts de trabajo: +25%, +50%, +100%
- Boosts de casino: +15%, +30%, +50%
- Boosts de robo: +20%, +40%, +60%
- Boosts de XP: +25%, +50%, +100%
- Power-ups temporales con duracion limitada

### Sistema de Seguros Anti-Robo
- 4 niveles de proteccion: 50%, 75%, 90%, 100%
- Proteccion temporal contra robos
- Sistema de activacion y desactivacion

### Sistema de Nacionalidades (30+ Paises)
- Paises latinoamericanos y europeos
- Probabilidades diferentes por pais (mas raro = mejor economia)
- Multiplicadores de trabajo por pais
- Sistema de viajes (requiere pasaporte)
- Paises desarrollados requieren visa de trabajo

### Nuevos Comandos v3.0

#### /cooldowns - Ver todos los cooldowns activos
- Muestra estado de trabajo, robo, daily y todos los juegos de casino
- Indica cuales estan listos y cuales en espera
- Muestra reduccion de cooldown activa por powerups

#### /work - Trabajar con tus items
- Menu interactivo para seleccionar trabajo
- Muestra todos los trabajos disponibles segun items
- Boton de trabajo rapido para trabajo basico

#### /gift - Sistema de regalos
- Regalar items del inventario
- Transferir Lagcoins a otros usuarios
- Regalar XP de tu experiencia

#### /gamecard - Tarjetas de perfil de juegos
- Roblox: Busca perfil real y genera tarjeta
- Minecraft: Busca perfil Java y genera tarjeta con skin
- Brawl Stars: Enlace a perfil de brawlify

#### /impuestos - Sistema fiscal
- Ver informacion de tramos fiscales
- Pagar impuestos semanales
- Ver estado fiscal actual
- Tramos: 0% (0-1000), 1% (1001-5000), 2% (5001-20000), etc.

#### /info - Informacion con acciones rapidas
- Estadisticas del servidor
- Botones para: nivel, balance, leaderboard, trabajo, casino, minijuego
- Enlace al dashboard web

### Sistema de Impuestos (NUEVO)
- Impuestos semanales basados en riqueza total
- 6 tramos fiscales desde 0% hasta 5%
- Usuarios pobres (<1000 LC) exentos
- Penalizacion por no pagar: acumulacion de deuda

### Sistema de Casino
- /casino - Ruleta clasica (hasta x3)
- /slots - Tragamonedas con jackpot (x10)
- /blackjack - Juega al 21 contra el dealer
- /coinflip - Lanza moneda 50/50
- /dice - Dados con predicciones
- /casinomulti carreras - Carreras de caballos
- /casinomulti poker - Poker simplificado
- /casinomulti ruleta - Ruleta con multiples apuestas
- /casinomulti duelo - Desafios entre usuarios

### Trivia y Ahorcado Mejorados
- 150+ preguntas de trivia en 15 categorias
- Nuevas categorias: videojuegos, tecnologia, musica, cine, deportes
- 300+ palabras de ahorcado en 9 categorias
- Nuevas categorias: videojuegos, paises, discord, anime, comida, tecnologia

### Sistema de Boosts (Mejorado)
- /boost list ahora filtra boosts expirados
- Muestra tiempo restante de cada boost
- Incluye boost nocturno y admin boost en lista
- Boosts acumulables (se suman entre si)
- Boost automatico de 200% para Boosters y VIPs
- Boost nocturno de 25% (18:00-06:00 Venezuela)

### Minijuegos
- **Trivia**: 5 preguntas, 15 categorias, 150+ preguntas
- **Piedra, Papel o Tijeras**: Mejor de 3, con recompensas
- **Ruleta Rusa**: Riesgoso! Ganador +2.5 niveles, perdedor -3 niveles
- **Ahorcado Solo**: 300+ palabras, 9 categorias
- **Ahorcado Multi**: Host vs Adivinador

## Configuracion Actual

### IDs Configurados en config.js
```javascript
STAFF_ROLE_ID: '1230949715127042098'
BOOSTER_ROLE_ID: '1229938887955189843'
VIP_ROLE_ID: '1230595787717611686'
SPECIAL_USER_ID: '956700088103747625'
LEVEL_UP_CHANNEL_ID: '1420907355956318239'
MISSION_COMPLETE_CHANNEL_ID: '1441276918916710501'
NO_XP_CHANNELS: ['1313723272290111559', '1258524941289263254']
```

### Roles de Nivel
- Nivel 1: Nuevo Miembro
- Nivel 5: Iniciado
- Nivel 10: Regular
- Nivel 20: Conocido
- Nivel 25: Miembro Activo (desbloquea tema Ocean)
- Nivel 30: Veterano
- Nivel 35: Super Activo (desbloquea tema Zelda)
- Nivel 40: Elite
- Nivel 50: Maestro
- Nivel 75: Leyenda
- Nivel 100: Inmortal (desbloquea tema Pokemon + leaderboard Minecraft)

## Como Ejecutar

### En Replit (Solo Desarrollo)
1. **Variables de entorno**: Configurar DISCORD_BOT_TOKEN y MONGODB_URI en Secrets
2. **Workflow**: Solo para testing, NO usar en produccion
3. **Puerto**: Servidor web en puerto 5000 con Dashboard

### En Render (Produccion)
- Repository: https://github.com/imgars/-Niveles.git
- Dashboard URL: https://niveles-wul5.onrender.com
- Build Command: npm install
- Start Command: node index.js

## Estructura del Proyecto

```
├── index.js              # Bot principal
├── config.js             # Configuracion
├── commands/             # Comandos slash (50+ archivos)
│   ├── level.js          # Comandos de niveles
│   ├── leaderboard.js    # Leaderboard con pixel art
│   ├── balance.js        # Comandos de economia
│   ├── casino.js         # Juegos de casino
│   ├── cooldowns.js      # Ver cooldowns (NUEVO)
│   ├── work.js           # Trabajar interactivo (NUEVO)
│   ├── gift.js           # Sistema regalos (NUEVO)
│   ├── gamecard.js       # Tarjetas de juegos (NUEVO)
│   ├── tax.js            # Impuestos (NUEVO)
│   ├── info.js           # Info con botones (MEJORADO)
│   ├── boost.js          # Boosts (MEJORADO)
│   ├── profile.js        # Perfil imagen (MEJORADO)
│   ├── lbeconomia.js     # Leaderboards imagen (MEJORADO)
│   └── ...               # Mas comandos
├── utils/                # Utilidades
│   ├── database.js       # Persistencia JSON
│   ├── mongoSync.js      # Sincronizacion MongoDB
│   ├── economyDB.js      # Sistema de economia
│   ├── cardGenerator.js  # Generacion pixel art (MEJORADO)
│   ├── casinoCooldowns.js # Cooldowns casino
│   └── helpers.js        # Funciones auxiliares
├── data/                 # Datos
│   ├── trivia_questions.js # 150+ preguntas (MEJORADO)
│   └── hangman_words.js  # 300+ palabras (MEJORADO)
├── public/               # Dashboard web
└── data/                 # Datos persistentes JSON
```

## Comandos Disponibles

### Comandos Nuevos v3.0
- /cooldowns - Ver todos los cooldowns activos
- /work - Trabajar con menu interactivo
- /gift item/lagcoins/xp - Regalar a otros usuarios
- /gamecard roblox/minecraft/brawlstars - Tarjetas de perfil de juegos
- /impuestos info/pagar/estado - Sistema fiscal

### Comandos de Economia (25+)
- /balance - Ver saldo
- /perfil - Ver perfil completo como imagen
- /daily - Recompensa diaria
- /trabajar - Trabajar para ganar Lagcoins
- /work - Trabajar interactivo
- /tienda - Comprar items (50+ items)
- /inventario - Ver items
- /depositar, /retirar - Banco
- /robar - Robar a usuarios
- /powerups - Ver y comprar power-ups
- /seguro - Seguros anti-robo
- /nacionalidad - Sistema de paises
- /subasta - Sistema de subastas
- /lbeconomia - Leaderboards con imagen
- /impuestos - Sistema fiscal

### Comandos de Casino (10+)
- /casino, /slots, /blackjack, /coinflip, /dice
- /casinomulti carreras, poker, ruleta, duelo
- Todos con sistema de cooldowns

## Cambios Recientes

### 7 de Diciembre 2025 - v3.1.0
- FIX: Sistema de boosts corregido (100=x1, 200=x2, 1000=x10)
- FIX: Ahorcado ahora da recompensas correctamente tras 3 rondas
- FIX: Bug de N/A y NaN en sistema de niveles (validacion de datos)
- MEJORADO: /shop con precios mas altos
- NUEVO: Tarjetas comprables en tienda (Minecraft 5000, FNAF 4500, Roblox 7000)
- MEJORADO: /perfil ahora usa embed en vez de imagen con info completa
- FIX: /gamecard roblox y brawl stars muestran imagenes directamente
- MEJORADO: Leaderboard estilo Discord con grises y azules pixel art
- NUEVO: Seccion de Nacionalidades en pagina web (29 paises con banderas)
- MEJORADO: Leaderboard web ahora paginado (25 usuarios por pagina)

### 6 de Diciembre 2025 - v3.0.0 (PIXEL ART UPDATE)
- NUEVO: Tarjetas de rango estilo PIXEL ART completo
- NUEVO: 9 temas de tarjetas (pixel, ocean, zelda, pokemon, gd, night, roblox, minecraft, fnaf)
- NUEVO: Leaderboard Elite (100+) estilo Minecraft 1.12
- NUEVO: /cooldowns - Ver todos los cooldowns
- NUEVO: /work - Trabajar con menu interactivo
- NUEVO: /gift - Sistema de regalos (items, lagcoins, xp)
- NUEVO: /gamecard - Tarjetas Roblox, Minecraft, Brawl Stars
- NUEVO: /impuestos - Sistema fiscal semanal
- NUEVO: 150+ preguntas de trivia (15 categorias)
- NUEVO: 300+ palabras de ahorcado (9 categorias)
- MEJORADO: /info con botones de acciones rapidas
- MEJORADO: /boost list filtra expirados y muestra tiempo
- MEJORADO: /perfil ahora genera imagen en vez de embed
- MEJORADO: /lbeconomia con pixel art
- MEJORADO: /leaderboard con pixel art
- FIX: Boosts expirados ya no aparecen en lista

### 4 de Diciembre 2025 - v2.5.0
- Sistema de Power-Ups completo
- Sistema de Seguros Anti-Robo
- Sistema de Nacionalidades
- Sistema de Subastas
- Admin Abuse
- Casino Multijugador

---

**Ultima actualizacion**: 7 de Diciembre de 2025
**Estado**: COMPLETO - Todos los sistemas implementados
**Version**: 3.1.0 - Bug Fixes & Web Improvements
**Entorno**: Replit (desarrollo) + Render (produccion)
**GitHub**: https://github.com/imgars/-Niveles.git
**MongoDB**: Sincronizacion con fallback a JSON
