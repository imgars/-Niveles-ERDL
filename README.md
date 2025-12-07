# -Niveles

Un bot de Discord completo con sistema de niveles, XP, minijuegos y tarjetas de rango personalizadas con pixel art.

## 🌟 Características

### Sistema de Niveles
- **Sistema de XP progresivo**: Los primeros 5 niveles son muy rápidos, luego la velocidad disminuye gradualmente hasta el nivel 90+
- **Cooldown de XP**: 10 segundos entre mensajes para evitar spam
- **Ganancia de XP**: Por mensajes, imágenes, videos y reacciones
- **Recompensas automáticas**: Roles asignados automáticamente al alcanzar niveles específicos (1, 5, 10, 20, 25, 30, 35, 40, 50, 75, 100)

### Sistema de Boosts
- **Boosts acumulables**: Los boosts se suman entre sí
- **Boost de Boosters/VIPs**: 200% automático para usuarios con roles especiales
- **Boost nocturno**: 25% durante la noche (18:00 - 06:00 hora de Venezuela)
- **Boosts personalizados**: Para usuarios, canales o todo el servidor
- **Boosts de minijuegos**: Gana boosts temporales jugando

### Minijuegos
1. **Trivia**: 5 preguntas, recompensa de 20% boost por 12h o 1.5 niveles
2. **Piedra, Papel o Tijeras**: Mejor de 3, ganador recibe 30% boost por 2h
3. **Ruleta Rusa**: Ganador +2.5 niveles, perdedor -3 niveles (¡riesgoso!)
4. **Ahorcado** (próximamente): Modo solitario y multijugador

### Tarjetas Personalizadas
- **Pixel Art**: Diferentes temas según el rango del usuario
- **Temas disponibles**:
  - Normal: Pixel art básico
  - Activo (Nivel 25+): Tema oceánico
  - Super Activo (Nivel 35+): Tema Zelda
  - Nivel 100+: Tema Pokémon
  - Boosters: Tema Geometry Dash
  - VIPs: Tema nocturno con estrellas
  - Usuario especial: Temas aleatorios (Roblox, Minecraft, Zelda, FNAF, Geometry Dash)

## 🎮 Comandos

### Comandos de Usuarios

| Comando | Descripción |
|---------|-------------|
| `/level [usuario]` | Muestra el nivel y XP (con tarjeta personalizada) |
| `/nivel [usuario]` | Alias de /level |
| `/rank [usuario]` | Alias de /level |
| `/leaderboard` | Tabla de clasificación top 10 |
| `/lb` | Alias de /leaderboard |
| `/rewards list` | Muestra las recompensas por nivel |
| `/boost list` | Ver boosts activos |
| `/boost status` | Ver estado de todos los boosts |
| `/minigame trivia` | Jugar trivia |
| `/minigame rps <oponente>` | Piedra, Papel o Tijeras |
| `/minigame roulette <oponente>` | Ruleta Rusa |
| `/help` | Muestra todos los comandos |

### Comandos de Staff

| Comando | Descripción |
|---------|-------------|
| `/addlevel <usuario> <cantidad>` | Añadir niveles |
| `/removelevel <usuario> <cantidad>` | Quitar niveles |
| `/setlevel <usuario> <nivel>` | Establecer nivel exacto |
| `/xp add/remove/reset <usuario>` | Gestionar XP |
| `/boost add <usuario/canal> <multiplicador> <duración>` | Añadir boost |
| `/globalboost <multiplicador> <duración>` | Boost global |
| `/removeglobalboost` | Quitar boost global |
| `/banxp user/channel` | Banear de ganar XP |
| `/unbanxp user/channel` | Desbanear |
| `/resettemporada` | Resetear toda la XP del servidor |
| `/clearlevelroles` | Quitar todos los roles de nivel |
| `/embed` | Crear embed personalizado |
| `/mensaje <texto>` | Enviar mensaje plano |
| `/help staff` | Comandos de staff |

## 🚀 Configuración

### 1. Configurar el Bot en Discord

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crea una nueva aplicación
3. Ve a la sección "Bot" y crea un bot
4. Activa los siguientes **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
5. Copia el token del bot

### 2. Invitar el Bot a tu Servidor

Usa este enlace (reemplaza `CLIENT_ID` con tu Application ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 3. Configurar Variables de Entorno

En Replit, ve a "Secrets" (icono de candado) y añade:
```
DISCORD_BOT_TOKEN=tu_token_aquí
```

### 4. Personalizar Configuración

Edita `config.js` para ajustar:
- IDs de roles de staff, boosters y VIPs
- IDs de roles de recompensa por nivel
- Canales bloqueados de XP
- Canal de anuncios de subida de nivel
- Multiplicadores de XP

## 📦 Despliegue a Render

### Opción 1: Desde Replit

1. En Replit, descarga el proyecto como ZIP
2. Sube el código a GitHub
3. Conecta el repositorio a Render

### Opción 2: Directo a Render

1. Crea una cuenta en [Render](https://render.com)
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Añade `DISCORD_BOT_TOKEN`
5. Despliega

### Importante para Render

Para que el bot funcione 24/7 en Render:

1. Elige el plan apropiado (el gratuito se duerme después de 15 minutos de inactividad)
2. Para el plan gratuito, puedes usar un servicio de "ping" para mantenerlo activo
3. O mejor aún, usa el plan de pago para tener el bot siempre activo

## 🗂️ Estructura del Proyecto

```
.
├── index.js              # Archivo principal del bot
├── config.js             # Configuración (IDs, roles, etc)
├── package.json          # Dependencias
├── commands/             # Comandos slash
│   ├── level.js
│   ├── leaderboard.js
│   ├── minigame.js
│   └── ...
├── utils/                # Utilidades
│   ├── database.js       # Sistema de persistencia JSON
│   ├── xpSystem.js       # Cálculos de XP y niveles
│   ├── cardGenerator.js  # Generación de tarjetas
│   ├── timeBoost.js      # Sistema de boost nocturno
│   └── helpers.js        # Funciones auxiliares
└── data/                 # Datos persistentes (JSON)
    ├── users.json
    ├── boosts.json
    ├── cooldowns.json
    └── bans.json
```

## 🔧 Tecnologías

- **Node.js** v20
- **Discord.js** v14
- **@napi-rs/canvas** - Generación de imágenes
- **node-cron** - Tareas programadas
- **moment-timezone** - Manejo de zonas horarias

## 📊 Fórmula de XP

El sistema usa una fórmula progresiva:

- **Niveles 1-5**: MUY rápido (100 XP base)
- **Niveles 6-10**: Muy rápido (150 XP base)
- **Niveles 11-15**: Rápido (250 XP base)
- **Niveles 16-20**: Medianamente rápido (400 XP base)
- **Niveles 21-35**: Normal (600 XP base)
- **Niveles 36-40**: Medianamente lento (850 XP base)
- **Niveles 41-50**: Lento (1200 XP base)
- **Niveles 51-75**: Medianamente lento (1800 XP base)
- **Niveles 76-90**: Lento (2500 XP base)
- **Niveles 90+**: MUY lento (3500 XP base)

Cada nivel multiplica la XP base por `1 + (nivel * 0.1)`

## 💾 Persistencia de Datos

Todos los datos se guardan en archivos JSON en la carpeta `data/`:
- Los datos sobreviven a reinicios del bot
- Sistema de guardado automático
- Backups recomendados para producción

## 🎨 Personalización

### Cambiar Temas de Tarjetas

Edita `utils/cardGenerator.js` función `getThemeColors()` para personalizar:
- Colores de fondo
- Colores de acento
- Colores de barra de progreso

### Añadir Preguntas de Trivia

Edita `commands/minigame.js` array `triviaQuestions` para añadir/modificar preguntas.

## 📝 Notas Importantes

- **Intents**: Asegúrate de tener activados los intents necesarios en el portal de Discord
- **Permisos**: El bot necesita permisos de administrador para gestionar roles
- **Backups**: Haz copias de seguridad de la carpeta `data/` regularmente
- **Rate Limits**: Discord tiene límites de tasa, el bot maneja esto automáticamente

## 🆘 Solución de Problemas

### El bot no responde a comandos
- Verifica que el token sea correcto
- Asegúrate de que los intents estén activados
- Revisa que el bot tenga permisos en el servidor

### Las tarjetas no se generan
- Verifica que `@napi-rs/canvas` esté instalado correctamente
- Revisa los logs para errores de generación de imágenes

### Los boosts no funcionan
- Verifica que la zona horaria de Venezuela esté correcta
- Revisa el archivo `data/boosts.json` para ver boosts activos

## 📄 Licencia

ISC

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de abrir issues o pull requests.

---

Desarrollado con ❤️ por Sirgio Team
