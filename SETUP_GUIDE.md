# 🚀 Guía de Configuración Rápida

## Paso 1: Obtener el Token del Bot de Discord

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en "New Application"
3. Dale un nombre a tu bot (ej: "Bot de Niveles")
4. Ve a la sección "Bot" en el menú lateral
5. Haz clic en "Add Bot" y confirma
6. Activa estos **Privileged Gateway Intents**:
   - ✅ **PRESENCE INTENT** (opcional)
   - ✅ **SERVER MEMBERS INTENT** (requerido)
   - ✅ **MESSAGE CONTENT INTENT** (requerido)
7. Copia el token del bot (botón "Reset Token" o "Copy")

## Paso 2: Configurar el Token en Replit

1. En Replit, busca el icono de **candado** (🔒) en la barra lateral llamado "Secrets"
2. Haz clic en "Add new secret"
3. En "Key" pon: `DISCORD_BOT_TOKEN`
4. En "Value" pega el token que copiaste
5. Haz clic en "Add Secret"

## Paso 3: Invitar el Bot a tu Servidor

1. Ve de nuevo al [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a "OAuth2" → "URL Generator"
4. Marca estos **scopes**:
   - ✅ bot
   - ✅ applications.commands
5. Marca estos **permisos** (Bot Permissions):
   - ✅ Administrator (o selecciona permisos específicos)
6. Copia la URL generada y ábrela en tu navegador
7. Selecciona tu servidor y autoriza el bot

## Paso 4: Iniciar el Bot

1. En Replit, el bot intentará iniciarse automáticamente
2. Si no se inicia, haz clic en el botón **Run** (▶️)
3. Deberías ver en la consola:
   ```
   ✅ Logged in as TuBot#1234
   🌙 Night boost initialized: Active/Inactive
   📝 Registering slash commands...
   ✅ Slash commands registered successfully!
   ```

## Paso 5: Probar el Bot

En tu servidor de Discord, prueba estos comandos:

1. `/help` - Ver todos los comandos
2. `/level` - Ver tu nivel (generará una tarjeta)
3. `/leaderboard` - Ver la tabla de clasificación
4. `/rewards list` - Ver las recompensas

## Paso 6: Configurar IDs (Opcional)

Si quieres cambiar los IDs de roles y canales:

1. Abre el archivo `config.js`
2. Edita las IDs según tu servidor:
   - `STAFF_ROLE_ID`: ID del rol de staff
   - `LEVEL_UP_CHANNEL_ID`: Canal donde se anuncian subidas de nivel
   - `NO_XP_CHANNELS`: Canales donde no se gana XP
   - `LEVEL_ROLES`: IDs de los roles de recompensa

### Cómo obtener IDs en Discord:

1. Activa el "Modo Desarrollador":
   - Configuración → Avanzado → Modo Desarrollador (ON)
2. Haz clic derecho en un rol/canal/usuario
3. Selecciona "Copiar ID"

## 🌐 Desplegar a Render (24/7)

### Opción 1: Desde GitHub

1. Crea un repositorio en GitHub
2. Sube este código a GitHub
3. Ve a [Render](https://render.com)
4. Crea una cuenta
5. Haz clic en "New +" → "Web Service"
6. Conecta tu repositorio de GitHub
7. Configura:
   - **Name**: nombre-de-tu-bot
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
8. En "Environment Variables":
   - Añade `DISCORD_BOT_TOKEN` con tu token
9. Selecciona un plan (Free o Paid)
10. Haz clic en "Create Web Service"

### Opción 2: Deploy desde Replit

1. En Replit, ve a la pestaña "Version Control"
2. Conecta con GitHub
3. Sigue los pasos de la Opción 1

### Nota sobre el Plan Gratuito de Render:

- El plan gratuito se duerme después de 15 minutos de inactividad
- Para mantener el bot activo 24/7, necesitas:
  - Usar el plan de pago ($7/mes) o
  - Configurar un servicio de "ping" externo

## 📊 Primeros Pasos

1. **Gana XP**: Escribe mensajes, reacciona a mensajes
2. **Minijuegos**: Usa `/minigame trivia` para jugar
3. **Ver nivel**: Usa `/level` para ver tu tarjeta personalizada
4. **Staff**: Los usuarios con el rol de staff pueden usar comandos administrativos

## ⚙️ Comandos de Staff Importantes

- `/addlevel @usuario 10` - Dar 10 niveles a un usuario
- `/globalboost 0.5 60` - Activar boost de 50% durante 60 minutos
- `/banxp user @usuario 30` - Banear usuario de ganar XP por 30 minutos
- `/resettemporada` - Resetear todos los niveles (¡cuidado!)

## 🎨 Personalización

### Cambiar Colores de Tarjetas

Edita `utils/cardGenerator.js`, función `getThemeColors()`:

```javascript
pixel: {
  bg: ['#2C2F33', '#23272A'],  // Colores de fondo
  accent: '#7289DA',             // Color de acento
  bar: '#43B581',                // Color de barra
  text: '#FFFFFF'                // Color de texto
}
```

### Añadir Preguntas de Trivia

Edita `commands/minigame.js`, array `triviaQuestions`:

```javascript
{
  question: '¿Tu pregunta?',
  options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
  correct: 0  // Índice de la respuesta correcta (0-3)
}
```

## 🆘 Solución de Problemas

### El bot no se inicia
- ✅ Verifica que el token esté configurado correctamente en Secrets
- ✅ Asegúrate de que los intents estén activados en Discord Developer Portal

### Los comandos no aparecen
- ✅ Espera 1-2 minutos después de invitar el bot
- ✅ Verifica que el bot tenga permisos de `applications.commands`
- ✅ Intenta `/help` directamente

### Las tarjetas no se generan
- ✅ Verifica que `@napi-rs/canvas` esté instalado
- ✅ Revisa los logs de consola para errores
- ✅ El bot necesita permisos para adjuntar archivos

### No se gana XP
- ✅ Verifica que el canal no esté en `NO_XP_CHANNELS`
- ✅ Asegúrate de esperar 10 segundos entre mensajes
- ✅ Verifica que no estés baneado de XP

## 📝 Notas Finales

- **Datos**: Se guardan automáticamente en la carpeta `data/`
- **Backups**: Considera hacer copias de seguridad de `data/*.json`
- **Boosts**: Los boosts nocturnos funcionan con horario de Venezuela
- **Minijuegos**: Tienen cooldowns para evitar farming

## 🎯 Próximos Pasos

1. Personaliza los colores y temas de las tarjetas
2. Añade más preguntas de trivia
3. Ajusta las recompensas de nivel según tu servidor
4. Implementa el minijuego de Ahorcado (pendiente)

---

¡Disfruta tu bot de niveles! 🎉
