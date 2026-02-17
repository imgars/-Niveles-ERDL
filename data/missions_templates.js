export const MISSION_TEMPLATES = {
  semana1: [
    { id: 1, title: 'Saludador', description: 'Di hola a 5 personas', type: 'greeting', target: 5, difficulty: 1, reward: { xp: 100, multiplier: 0.1, levels: 0, lagcoins: 50 } },
    { id: 2, title: 'Preguntón', description: 'Pregunta como estan a 3 personas', type: 'question', target: 3, difficulty: 1, reward: { xp: 150, multiplier: 0.15, levels: 0, lagcoins: 75 } },
    { id: 3, title: 'Socializador', description: 'Participa en 10 conversaciones', type: 'participate', target: 10, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1, lagcoins: 150 } },
    { id: 4, title: 'Ayudante', description: 'Ofrece ayuda a 4 personas', type: 'help', target: 4, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 100 } },
    { id: 5, title: 'Visitante', description: 'Envia mensajes en 6 canales diferentes', type: 'channels', target: 6, difficulty: 1, reward: { xp: 120, multiplier: 0.12, levels: 0, lagcoins: 60 } },
    { id: 6, title: 'Amigable', description: 'Interactua con 8 usuarios nuevos', type: 'newusers', target: 8, difficulty: 2, reward: { xp: 280, multiplier: 0.28, levels: 1, lagcoins: 180 } },
    { id: 7, title: 'Comunicador', description: 'Envia 50 mensajes en el chat', type: 'messages', target: 50, difficulty: 2, reward: { xp: 200, multiplier: 0.22, levels: 0, lagcoins: 120 } },
    { id: 8, title: 'Entusiasta', description: 'Reacciona a 20 mensajes', type: 'reactions', target: 20, difficulty: 1, reward: { xp: 150, multiplier: 0.15, levels: 0, lagcoins: 80 } },
    { id: 9, title: 'Comentarista', description: 'Responde a 7 preguntas en el chat', type: 'answers', target: 7, difficulty: 3, reward: { xp: 350, multiplier: 0.35, levels: 2, lagcoins: 250 } },
    { id: 10, title: 'Leyenda', description: 'Completa 9 misiones en la semana', type: 'meta', target: 9, difficulty: 3, reward: { xp: 500, multiplier: 0.5, levels: 3, lagcoins: 500 } }
  ],
  semana2: [
    { id: 1, title: 'Madrugador', description: 'Envia 10 mensajes antes de las 10am', type: 'morning_messages', target: 10, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 100 } },
    { id: 2, title: 'Noctambulo', description: 'Envia 10 mensajes despues de las 10pm', type: 'night_messages', target: 10, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 100 } },
    { id: 3, title: 'Conversador', description: 'Mantén 5 conversaciones de mas de 10 mensajes', type: 'long_conversations', target: 5, difficulty: 3, reward: { xp: 400, multiplier: 0.4, levels: 2, lagcoins: 300 } },
    { id: 4, title: 'Creativo', description: 'Usa 20 emojis diferentes', type: 'unique_emojis', target: 20, difficulty: 2, reward: { xp: 180, multiplier: 0.18, levels: 0, lagcoins: 90 } },
    { id: 5, title: 'Jugador', description: 'Juega 5 minijuegos', type: 'minigames', target: 5, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1, lagcoins: 150 } },
    { id: 6, title: 'Ganador', description: 'Gana 3 minijuegos', type: 'minigame_wins', target: 3, difficulty: 3, reward: { xp: 350, multiplier: 0.35, levels: 2, lagcoins: 250 } },
    { id: 7, title: 'Trabajador', description: 'Trabaja 10 veces', type: 'work', target: 10, difficulty: 2, reward: { xp: 220, multiplier: 0.22, levels: 0, lagcoins: 200 } },
    { id: 8, title: 'Ahorrador', description: 'Acumula 1000 Lagcoins en el banco', type: 'bank_balance', target: 1000, difficulty: 2, reward: { xp: 180, multiplier: 0.18, levels: 0, lagcoins: 100 } },
    { id: 9, title: 'Comerciante', description: 'Compra 3 items en la tienda', type: 'shop_purchases', target: 3, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 150 } },
    { id: 10, title: 'Maestro Semana 2', description: 'Completa todas las misiones de la semana 2', type: 'meta', target: 9, difficulty: 3, reward: { xp: 600, multiplier: 0.6, levels: 3, lagcoins: 600 } }
  ],
  semana3: [
    { id: 1, title: 'Apostador', description: 'Juega 10 partidas en el casino', type: 'casino_plays', target: 10, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 100 } },
    { id: 2, title: 'Suertudo', description: 'Gana 5 partidas en el casino', type: 'casino_wins', target: 5, difficulty: 3, reward: { xp: 400, multiplier: 0.4, levels: 2, lagcoins: 300 } },
    { id: 3, title: 'Viajero', description: 'Viaja a 2 paises diferentes', type: 'travel', target: 2, difficulty: 3, reward: { xp: 500, multiplier: 0.5, levels: 2, lagcoins: 400 } },
    { id: 4, title: 'Coleccionista', description: 'Compra 5 items diferentes', type: 'unique_items', target: 5, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1, lagcoins: 200 } },
    { id: 5, title: 'Racha', description: 'Mantén una racha de 3 dias', type: 'streak_days', target: 3, difficulty: 2, reward: { xp: 300, multiplier: 0.3, levels: 1, lagcoins: 200 } },
    { id: 6, title: 'Genio', description: 'Responde correctamente 10 preguntas de trivia', type: 'trivia_correct', target: 10, difficulty: 2, reward: { xp: 280, multiplier: 0.28, levels: 1, lagcoins: 180 } },
    { id: 7, title: 'Linguista', description: 'Adivina 5 palabras en el ahorcado', type: 'hangman_wins', target: 5, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1, lagcoins: 150 } },
    { id: 8, title: 'Generoso', description: 'Dona 500 Lagcoins a otros usuarios', type: 'donations', target: 500, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0, lagcoins: 250 } },
    { id: 9, title: 'Popular', description: 'Recibe 30 reacciones en tus mensajes', type: 'reactions_received', target: 30, difficulty: 2, reward: { xp: 220, multiplier: 0.22, levels: 0, lagcoins: 120 } },
    { id: 10, title: 'Maestro Semana 3', description: 'Completa todas las misiones de la semana 3', type: 'meta', target: 9, difficulty: 3, reward: { xp: 700, multiplier: 0.7, levels: 4, lagcoins: 700 } }
  ],
  semana4: [
    { id: 1, title: 'Multimillonario', description: 'Acumula 5000 Lagcoins en total', type: 'total_lagcoins', target: 5000, difficulty: 3, reward: { xp: 500, multiplier: 0.5, levels: 2, lagcoins: 500 } },
    { id: 2, title: 'Profesional', description: 'Desbloquea 3 trabajos diferentes', type: 'jobs_unlocked', target: 3, difficulty: 3, reward: { xp: 400, multiplier: 0.4, levels: 2, lagcoins: 350 } },
    { id: 3, title: 'Veterano', description: 'Alcanza el nivel 20', type: 'level_reach', target: 20, difficulty: 3, reward: { xp: 600, multiplier: 0.6, levels: 3, lagcoins: 500 } },
    { id: 4, title: 'Inversionista', description: 'Ten 2000 Lagcoins en el banco', type: 'bank_balance', target: 2000, difficulty: 2, reward: { xp: 300, multiplier: 0.3, levels: 1, lagcoins: 200 } },
    { id: 5, title: 'Estratega', description: 'Gana 3 partidas de blackjack seguidas', type: 'blackjack_streak', target: 3, difficulty: 3, reward: { xp: 450, multiplier: 0.45, levels: 2, lagcoins: 400 } },
    { id: 6, title: 'Amigo Fiel', description: 'Mantén una racha de 7 dias', type: 'streak_days', target: 7, difficulty: 3, reward: { xp: 500, multiplier: 0.5, levels: 2, lagcoins: 400 } },
    { id: 7, title: 'Explorador', description: 'Visita 4 paises diferentes', type: 'countries_visited', target: 4, difficulty: 3, reward: { xp: 600, multiplier: 0.6, levels: 3, lagcoins: 500 } },
    { id: 8, title: 'Influencer', description: 'Menciona a 15 usuarios diferentes', type: 'mentions', target: 15, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1, lagcoins: 150 } },
    { id: 9, title: 'Constante', description: 'Envia mensajes durante 7 dias seguidos', type: 'daily_messages', target: 7, difficulty: 3, reward: { xp: 400, multiplier: 0.4, levels: 2, lagcoins: 350 } },
    { id: 10, title: 'Campeon Mensual', description: 'Completa todas las misiones del mes', type: 'meta', target: 9, difficulty: 3, reward: { xp: 1000, multiplier: 1.0, levels: 5, lagcoins: 1000 } }
  ],
  especiales: [
    { id: 101, title: 'Primeros Pasos', description: 'Usa 5 comandos diferentes', type: 'unique_commands', target: 5, difficulty: 1, reward: { xp: 100, multiplier: 0.1, levels: 0, lagcoins: 50 }, oneTime: true },
    { id: 102, title: 'Rico', description: 'Gana 10000 Lagcoins en total', type: 'total_earned', target: 10000, difficulty: 3, reward: { xp: 800, multiplier: 0.8, levels: 4, lagcoins: 1000 }, oneTime: true },
    { id: 103, title: 'Jackpot!', description: 'Gana un jackpot en las tragamonedas', type: 'slots_jackpot', target: 1, difficulty: 3, reward: { xp: 1000, multiplier: 1.0, levels: 5, lagcoins: 2000 }, oneTime: true },
    { id: 104, title: 'BFF', description: 'Mantén una racha de 30 dias', type: 'streak_days', target: 30, difficulty: 3, reward: { xp: 1500, multiplier: 1.5, levels: 7, lagcoins: 3000 }, oneTime: true },
    { id: 105, title: 'Ciudadano del Mundo', description: 'Visita todos los paises disponibles', type: 'all_countries', target: 24, difficulty: 3, reward: { xp: 2000, multiplier: 2.0, levels: 10, lagcoins: 5000 }, oneTime: true }
  ]
};

export function getMissionsForWeek(weekNumber) {
  const weekKey = `semana${((weekNumber - 1) % 4) + 1}`;
  return MISSION_TEMPLATES[weekKey] || MISSION_TEMPLATES.semana1;
}

export function getSpecialMissions() {
  return MISSION_TEMPLATES.especiales;
}

export function getAllMissions() {
  return Object.values(MISSION_TEMPLATES).flat();
}

export function getMissionById(id) {
  const allMissions = getAllMissions();
  return allMissions.find(m => m.id === id);
}
