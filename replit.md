# Discord Leveling Bot - Proyecto

## Descripcion General

Bot de Discord completo con sistema de niveles, XP, economia (Lagcoins), casino, minijuegos, power-ups, seguros, nacionalidades, subastas y tarjetas de rango personalizadas. Este proyecto esta listo para ejecutarse en Replit y ser desplegado a Render u otras plataformas de hosting.

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
- 20+ trabajos diferentes con herramientas requeridas
- Tienda con 40+ items en 14 categorias
- Sistema de robos entre usuarios (con seguros anti-robo)
- Estadisticas detalladas de economia
- Rachas de recompensas diarias

### Sistema de Power-Ups (NUEVO)
- 12 power-ups diferentes en 4 categorias
- Boosts de trabajo: +25%, +50%, +100%
- Boosts de casino: +15%, +30%, +50%
- Boosts de robo: +20%, +40%, +60%
- Boosts de XP: +25%, +50%, +100%
- Power-ups temporales con duracion limitada

### Sistema de Seguros Anti-Robo (NUEVO)
- 4 niveles de proteccion: 50%, 75%, 90%, 100%
- Proteccion temporal contra robos
- Sistema de activacion y desactivacion

### Sistema de Nacionalidades (NUEVO)
- 30+ paises disponibles
- Probabilidades diferentes por pais (mas raro = mejor economia)
- Multiplicadores de trabajo por pais
- Sistema de viajes (requiere pasaporte)
- Paises desarrollados requieren visa de trabajo

### Sistema de Subastas (NUEVO)
- Crear subastas de items
- Ofertar en subastas activas
- Sistema de notificaciones
- Historial de subastas

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

### Comandos de Staff para Economia
- /addcoins - Anadir Lagcoins a usuarios
- /removecoins - Quitar Lagcoins a usuarios
- /setcoins - Establecer Lagcoins exactos
- /admin abuse - Impulsar TODOS los sistemas del bot
- /staffeconomy - Comandos avanzados de economia

### Easter Eggs (NUEVO)
- !Lagcoin - Muestra imagen de bolivares venezolanos
- !Mzingerkai - +777 XP (una vez)
- !SirgioBOT - Imagen especial
- !Arepa - Imagen de arepas
- !Dinnerbone - Tu avatar al reves
- !casin0 - +500% suerte casino por 30min (una vez)
- !gars, !timeoutt, !pelotocino, !uno

### Leaderboards con Imagenes (NUEVO)
- /lbeconomia - Leaderboards de economia con imagen generada
- 4 tipos: Lagcoins, Casino, Minijuegos, Trades

### Sistema de Boosts
- Boosts acumulables (se suman entre si)
- Boost automatico de 200% para Boosters y VIPs
- Boost nocturno de 25% (18:00-06:00 Venezuela)
- Boosts personalizados por usuario, canal o globales
- Admin Abuse: Boost global temporal para todos

### Minijuegos
- **Trivia**: 5 preguntas, recompensas de boost o niveles
- **Piedra, Papel o Tijeras**: Mejor de 3, con recompensas
- **Ruleta Rusa**: Riesgoso! Ganador +2.5 niveles, perdedor -3 niveles
- **Ahorcado Solo**: 3 rondas, 25% boost o 1 nivel, cooldown 48h
- **Ahorcado Multi**: Host vs Adivinador, +0.5 niveles, cooldown 30min

### Tarjetas Personalizadas
- Generacion dinamica con Canvas
- Temas pixel art segun rango del usuario
- Temas especiales para boosters, VIPs y usuario especial

### Dashboard Web
- Pagina web con tema retro pixel art
- Leaderboard completo con hasta 500 usuarios
- API REST para obtener datos

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
- Nivel 25: Miembro Activo
- Nivel 30: Veterano
- Nivel 35: Super Activo
- Nivel 40: Elite
- Nivel 50: Maestro
- Nivel 75: Leyenda
- Nivel 100: Inmortal

## Como Ejecutar

### En Replit (Desarrollo)
1. **Variables de entorno**: Configurar DISCORD_BOT_TOKEN y MONGODB_URI en Secrets
2. **Workflow**: Ejecutar npm start
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
├── commands/             # Comandos slash (45+ archivos)
│   ├── level.js          # Comandos de niveles
│   ├── balance.js        # Comandos de economia
│   ├── casino.js         # Juegos de casino
│   ├── casinomulti.js    # Casino multijugador (NUEVO)
│   ├── powerups.js       # Sistema de power-ups (NUEVO)
│   ├── seguro.js         # Seguros anti-robo (NUEVO)
│   ├── nacionalidad.js   # Nacionalidades (NUEVO)
│   ├── subasta.js        # Subastas (NUEVO)
│   ├── adminabuse.js     # Admin Abuse (NUEVO)
│   ├── staffeconomy.js   # Staff Economy (NUEVO)
│   ├── lbeconomia.js     # Leaderboards imagen (NUEVO)
│   ├── profile.js        # Perfil mejorado (NUEVO)
│   └── ...               # Mas comandos
├── utils/                # Utilidades
│   ├── database.js       # Persistencia JSON
│   ├── mongoSync.js      # Sincronizacion MongoDB
│   ├── economyDB.js      # Sistema de economia (MEJORADO)
│   ├── easterEggs.js     # Easter Eggs (NUEVO)
│   ├── xpSystem.js       # Sistema de XP
│   ├── cardGenerator.js  # Generacion de imagenes
│   └── helpers.js        # Funciones auxiliares
├── public/               # Dashboard web
└── data/                 # Datos persistentes
    ├── users.json        # Datos de usuarios
    ├── economy.json      # Datos de economia
    ├── powerups.json     # Power-ups activos (NUEVO)
    ├── insurance.json    # Seguros activos (NUEVO)
    ├── nationalities.json # Nacionalidades (NUEVO)
    ├── auctions.json     # Subastas (NUEVO)
    └── adminboost.json   # Boost admin (NUEVO)
```

## Comandos Disponibles

### Comandos de Economia (20+)
- /balance - Ver saldo
- /perfil - Ver perfil completo con stats
- /daily - Recompensa diaria
- /trabajar - Trabajar para ganar Lagcoins
- /tienda - Comprar items (40+ items, 14 categorias)
- /inventario - Ver items
- /depositar, /retirar - Banco
- /robar - Robar a usuarios
- /powerups - Ver y comprar power-ups
- /seguro - Seguros anti-robo
- /nacionalidad - Sistema de paises
- /subasta - Sistema de subastas
- /lbeconomia - Leaderboards con imagen

### Comandos de Casino (10+)
- /casino, /slots, /blackjack, /coinflip, /dice
- /casinomulti carreras - Carreras de caballos
- /casinomulti poker - Poker simplificado
- /casinomulti ruleta - Ruleta avanzada
- /casinomulti duelo - Desafios 1v1

### Staff - Economia (15+)
- /addcoins, /removecoins, /setcoins
- /admin abuse - Boost global todos los sistemas
- /admin status - Ver boost activo
- /admin stop - Detener boost
- /staffeconomy daritem, quitaritem
- /staffeconomy darpowerup
- /staffeconomy darseguro, quitarseguro
- /staffeconomy darnacionalidad
- /staffeconomy verusuario
- /staffeconomy resetusuario

## Items de la Tienda (40+)

### Categorias
1. Herramientas (desbloquean trabajos)
2. Tecnologia (laptops, camaras, etc)
3. Vehiculos (moto, taxi, etc)
4. Profesional (estetoscopio, licencias)
5. Instrumentos
6. Cocina
7. Armas (arco de caza)
8. Granja
9. Consumibles
10. Coleccionables
11. Viajes (pasaporte, visa)
12. Power-Ups (12 tipos)
13. Seguros (4 niveles)

## Trabajos Disponibles (20+)

| Trabajo | Ganancia | Multiplicador Pais |
|---------|----------|--------------------|
| Basico | 50-120 | x1.0 |
| Pescador | 100-250 | x1.0 |
| Programador | 200-500 | x1.5 |
| Medico | 300-700 | x1.8 |
| Piloto | 400-900 | x2.0 |
| Futbolista | 500-1500 | x2.5 |
| YouTuber | 150-800 | x1.4 |
| Influencer | 100-600 | x1.3 |

## Paises y Multiplicadores

### Latinoamerica
- Venezuela: x0.6 (65% prob)
- Mexico, Argentina: x0.7-0.8 (40%)
- Chile: x0.95 (28%)

### Primer Mundo (requiere Visa)
- Espana: x1.3 (14%)
- Estados Unidos: x2.0 (5%)
- Canada: x1.8 (7%)
- Japon: x1.6 (9%)

## Variables de Entorno Requeridas

```
DISCORD_BOT_TOKEN=tu_token_de_discord
MONGODB_URI=tu_connection_string_mongodb
```

## Cambios Recientes

### 4 de Diciembre 2025 - v2.5.0
- NUEVO: Sistema de Power-Ups completo (12 tipos)
- NUEVO: Sistema de Seguros Anti-Robo (4 niveles)
- NUEVO: Sistema de Nacionalidades (30+ paises)
- NUEVO: Sistema de Subastas
- NUEVO: Admin Abuse (boost global temporal)
- NUEVO: Easter Eggs (10 comandos secretos)
- NUEVO: Casino Multijugador (carreras, poker, ruleta, duelos)
- NUEVO: Leaderboards con imagen generada
- NUEVO: 10+ nuevos trabajos (medico, piloto, futbolista, etc)
- NUEVO: 20+ nuevos items en tienda
- MEJORADO: Perfil con stats completos
- MEJORADO: Sistema de economia mas robusto
- MEJORADO: Manejo de errores mejorado
- FIX: Errores de MongoDB con fallback a JSON

### 3 de Diciembre 2025 - v2.0.0
- Sistema de economia completo con Lagcoins
- 5 juegos de casino
- Tienda con 19+ items
- 13 trabajos diferentes
- Sistema de banco y robos

---

**Ultima actualizacion**: 4 de Diciembre de 2025
**Estado**: COMPLETO - Todos los sistemas implementados
**Version**: 2.5.0 - Power-Ups, Seguros, Nacionalidades, Subastas
**Entorno**: Replit (desarrollo) + Render (produccion)
**MongoDB**: Sincronizacion con fallback a JSON
