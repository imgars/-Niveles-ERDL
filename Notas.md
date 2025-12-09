# Notas de Actualizacion - Bot de Niveles

## Version 2.5.0 - Diciembre 2024

### Nuevas Funcionalidades

#### Sistema de Roleplay Mejorado
- **Comandos Independientes:** Ahora cada accion de roleplay es un comando individual:
  - `/hug` - Abrazar a alguien
  - `/greet` - Saludar a alguien
  - `/goodbye` - Despedirse de alguien
  - `/pat` - Acariciar la cabeza
  - `/slap` - Abofetear
  - `/bite` - Morder
  - `/feed` - Dar de comer
  - `/cuddle` - Acurrucarse
  - `/lick` - Lamer
  - `/punch` - Golpear
  - `/kill` - Matar (de broma)
  - `/poke` - Pinchar
  - `/highfive` - Chocar los cinco
  - `/handholding` - Tomar la mano
  - `/kisscheeks` - Beso en la mejilla

#### Sistema de Emociones Mejorado
- **Comandos Independientes:** Cada emocion ahora tiene su propio comando:
  - `/cry` - Llorar
  - `/laugh` - Reir
  - `/blush` - Sonrojarse
  - `/facepalm` - Facepalm
  - `/pout` - Hacer puchero
  - `/bored` - Aburrimiento
  - `/happy` - Felicidad
  - `/dance` - Bailar
  - `/sing` - Cantar
  - `/sleep` - Dormir (mimir time)
  - `/drunk` - Actuar ebrio
  - `/scared` - Miedo
  - `/smug` - Cara de engreido

#### Nuevos Comandos
- `/jumbo <emoji>` - Muestra cualquier emoji en formato grande
- `/pingrole <rol> [mensaje]` - (Staff) Hacer ping a cualquier rol incluyendo @everyone

#### Mejoras en /leaderboard
- Ahora el leaderboard muestra automaticamente el tema correcto segun tu rol:
  - **Nivel 100+:** Tema Pokemon
  - **Super Activo (Nivel 35+):** Tema Zelda
  - **Normal:** Tema Pixel General
- Ya no es necesario seleccionar el tipo de leaderboard

#### Mejoras en /level
- Ahora muestra informacion detallada de todos los boosts activos:
  - Boost de Booster del servidor (+200%)
  - Boost VIP (+200%)
  - Boost Nocturno (+25%)
  - Boosts por usuario, canal o globales con tiempo restante

#### Mejoras de Economia
- Nuevo diseno de leaderboards de economia (`/lbeconomia`) con estilo pixel art mejorado
- Comandos de staff ahora procesan mas rapido y con menos errores

### Cambios
- Eliminado `/gamecard roblox` y `/gamecard brawlstars` - Solo se mantiene `/gamecard <username>` para Minecraft
- El estado del bot ahora muestra: `/info para ver mas informacion sobre el bot`
- Actualizado el ID del rol de nivel 100: `1313716964383920269`

### Correcciones de Errores
- Corregidos errores de "Instance failed" en comandos de dar items y coins
- Las imagenes y GIFs en trivia y roleplay ahora se muestran correctamente
- Mejorada la carga de comandos para mayor estabilidad en Render

### Notas Tecnicas
- Todos los comandos de roleplay y emociones ahora se cargan como archivos independientes
- Mejoras en el manejo de errores y respuestas diferidas
- Optimizacion de rendimiento en operaciones de base de datos

---

### Como usar los nuevos comandos

**Roleplay:**
```
/hug @usuario - Abraza a alguien
/pat @usuario - Acaricia la cabeza de alguien
/slap @usuario - Abofetea a alguien
```

**Emociones:**
```
/cry - Expresa tristeza
/happy - Expresa felicidad
/dance - Baila
```

**Emoji Grande:**
```
/jumbo :emoji: - Muestra el emoji en grande
```

**Ping de Rol (Staff):**
```
/pingrole @rol Mensaje importante
```

---

*Actualizado: Diciembre 2024*
*Bot de Niveles - El mejor sistema de XP para tu servidor*
