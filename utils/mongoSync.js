import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI;

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Esquema de Boost
const boostSchema = new mongoose.Schema({
  type: String,
  target: String,
  multiplier: Number,
  expiresAt: Date,
  description: String
}, { timestamps: true });

const Boost = mongoose.model('Boost', boostSchema);

// Esquema de Preguntas
const questionSchema = new mongoose.Schema({
  question: String,
  askerName: String,
  answer: String,
  answered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  answeredAt: Date
});

const Question = mongoose.model('Question', questionSchema);

// Esquema de Rachas
const streakSchema = new mongoose.Schema({
  guildId: String,
  user1Id: String,
  user2Id: String,
  streakCount: { type: Number, default: 1 },
  lastMessageDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'active' } // active, broken
});

const Streak = mongoose.model('Streak', streakSchema);

// Esquema de Misiones Semanales
const missionSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  weekNumber: Number,
  year: Number,
  missions: [{
    id: Number,
    title: String,
    description: String,
    type: String, // 'greeting', 'question', 'help', 'participate'
    target: Number, // cantidad de veces que debe hacer la acción
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    difficulty: { type: Number, default: 1 }, // 1-3
    reward: {
      xp: Number,
      multiplier: Number,
      levels: Number
    }
  }],
  completedCount: { type: Number, default: 0 },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Mission = mongoose.model('Mission', missionSchema);

let isConnected = false;

export async function connectMongoDB() {
  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI no configurada. Usando JSON local.');
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    isConnected = true;
    console.log('✅ MongoDB conectado');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    return false;
  }
}

export async function saveUserToMongo(guildId, userId, userData) {
  if (!isConnected) return;
  try {
    await User.updateOne(
      { userId, guildId },
      userData,
      { upsert: true }
    );
  } catch (error) {
    console.error('Error guardando usuario en MongoDB:', error.message);
  }
}

export async function getAllUsersFromMongo(guildId = null) {
  if (!isConnected) return [];
  try {
    const query = guildId ? { guildId } : {};
    const users = await User.find(query).lean();
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios de MongoDB:', error.message);
    return [];
  }
}

export async function saveBoostsToMongo(boosts) {
  if (!isConnected) return;
  try {
    await Boost.deleteMany({});
    if (boosts.global && boosts.global.length > 0) {
      await Boost.insertMany(boosts.global);
    }
  } catch (error) {
    console.error('Error guardando boosts en MongoDB:', error.message);
  }
}

export async function getAllBoostsFromMongo() {
  if (!isConnected) return { global: [], users: {}, channels: {} };
  try {
    const boosts = await Boost.find({}).lean();
    return { global: boosts || [], users: {}, channels: {} };
  } catch (error) {
    console.error('Error obteniendo boosts de MongoDB:', error.message);
    return { global: [], users: {}, channels: {} };
  }
}

export async function saveQuestionToMongo(questionData) {
  if (!isConnected) return null;
  try {
    const newQuestion = new Question(questionData);
    const saved = await newQuestion.save();
    return saved;
  } catch (error) {
    console.error('Error guardando pregunta en MongoDB:', error.message);
    return null;
  }
}

export async function getQuestionsFromMongo() {
  if (!isConnected) return [];
  try {
    const questions = await Question.find({}).sort({ createdAt: -1 }).lean();
    return questions;
  } catch (error) {
    console.error('Error obteniendo preguntas de MongoDB:', error.message);
    return [];
  }
}

export async function answerQuestionInMongo(questionId, answer) {
  if (!isConnected) return null;
  try {
    const updated = await Question.findByIdAndUpdate(
      questionId,
      { answer, answered: true, answeredAt: new Date() },
      { new: true }
    );
    return updated;
  } catch (error) {
    console.error('Error respondiendo pregunta en MongoDB:', error.message);
    return null;
  }
}

export async function saveStreakToMongo(streakData) {
  if (!isConnected) return null;
  try {
    const query = { guildId: streakData.guildId };
    const users = [streakData.user1Id, streakData.user2Id].sort();
    query.user1Id = users[0];
    query.user2Id = users[1];
    
    const updated = await Streak.findOneAndUpdate(
      query,
      streakData,
      { upsert: true, new: true }
    );
    return updated;
  } catch (error) {
    console.error('Error guardando racha:', error.message);
    return null;
  }
}

export async function getStreakBetween(guildId, user1Id, user2Id) {
  if (!isConnected) return null;
  try {
    const users = [user1Id, user2Id].sort();
    const streak = await Streak.findOne({
      guildId,
      user1Id: users[0],
      user2Id: users[1]
    });
    return streak;
  } catch (error) {
    console.error('Error obteniendo racha:', error.message);
    return null;
  }
}

export async function updateStreakDate(guildId, user1Id, user2Id) {
  if (!isConnected) return null;
  try {
    const users = [user1Id, user2Id].sort();
    const streak = await Streak.findOne({
      guildId,
      user1Id: users[0],
      user2Id: users[1],
      status: 'active'
    });
    
    if (!streak) return null;
    
    const lastDate = new Date(streak.lastMessageDate);
    const today = new Date();
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() === today.getTime()) {
      return streak;
    }
    
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      streak.streakCount += 1;
      streak.lastMessageDate = new Date();
      await streak.save();
      return { streak, updated: true, message: `¡Racha extendida! 🔥 Ahora van ${streak.streakCount} días` };
    } else if (daysDiff > 1) {
      streak.status = 'broken';
      await streak.save();
      return { streak, broken: true, message: `¡Se perdió la racha! 😢 Llevaban ${streak.streakCount} días` };
    }
    
    return streak;
  } catch (error) {
    console.error('Error actualizando fecha de racha:', error.message);
    return null;
  }
}

export async function getUserStreaks(guildId, userId) {
  if (!isConnected) return [];
  try {
    const streaks = await Streak.find({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active'
    }).lean();
    return streaks || [];
  } catch (error) {
    console.error('Error obteniendo rachas del usuario:', error.message);
    return [];
  }
}

export async function getAllStreaksFromMongo(guildId = null) {
  if (!isConnected) return [];
  try {
    const query = guildId ? { guildId } : {};
    const streaks = await Streak.find(query).lean();
    return streaks || [];
  } catch (error) {
    console.error('Error obteniendo todas las rachas de MongoDB:', error.message);
    return [];
  }
}

export async function getUserMissions(guildId, userId, weekNumber, year) {
  if (!isConnected) return null;
  try {
    const missions = await Mission.findOne({
      guildId,
      userId,
      weekNumber,
      year
    });
    return missions;
  } catch (error) {
    console.error('Error obteniendo misiones:', error.message);
    return null;
  }
}

export async function createUserMissions(guildId, userId) {
  if (!isConnected) return null;
  try {
    const weekNumber = Math.ceil((new Date().getDate()) / 7);
    const year = new Date().getFullYear();
    
    const missionTemplates = [
      { id: 1, title: 'Saludador', description: 'Di hola a 5 personas', type: 'greeting', target: 5, difficulty: 1, reward: { xp: 100, multiplier: 0.1, levels: 0 } },
      { id: 2, title: 'Preguntón', description: 'Pregunta cómo están a 3 personas', type: 'question', target: 3, difficulty: 1, reward: { xp: 150, multiplier: 0.15, levels: 0 } },
      { id: 3, title: 'Socializador', description: 'Participa en 10 conversaciones', type: 'participate', target: 10, difficulty: 2, reward: { xp: 250, multiplier: 0.25, levels: 1 } },
      { id: 4, title: 'Ayudante', description: 'Ofrece ayuda a 4 personas', type: 'help', target: 4, difficulty: 2, reward: { xp: 200, multiplier: 0.2, levels: 0 } },
      { id: 5, title: 'Visitante', description: 'Envía mensajes en 6 canales diferentes', type: 'channels', target: 6, difficulty: 1, reward: { xp: 120, multiplier: 0.12, levels: 0 } },
      { id: 6, title: 'Amigable', description: 'Interactúa con 8 usuarios nuevos', type: 'newusers', target: 8, difficulty: 2, reward: { xp: 280, multiplier: 0.28, levels: 1 } },
      { id: 7, title: 'Comunicador', description: 'Envía 50 mensajes en el chat', type: 'messages', target: 50, difficulty: 2, reward: { xp: 200, multiplier: 0.22, levels: 0 } },
      { id: 8, title: 'Entusiasta', description: 'Reacciona a 20 mensajes', type: 'reactions', target: 20, difficulty: 1, reward: { xp: 150, multiplier: 0.15, levels: 0 } },
      { id: 9, title: 'Comentarista', description: 'Responde a 7 preguntas en el chat', type: 'answers', target: 7, difficulty: 3, reward: { xp: 350, multiplier: 0.35, levels: 2 } },
      { id: 10, title: 'Leyenda', description: 'Completa 9 misiones en la semana', type: 'meta', target: 9, difficulty: 3, reward: { xp: 500, multiplier: 0.5, levels: 3 } }
    ];
    
    const newMissions = new Mission({
      guildId,
      userId,
      weekNumber,
      year,
      missions: missionTemplates
    });
    
    await newMissions.save();
    return newMissions;
  } catch (error) {
    console.error('Error creando misiones:', error.message);
    return null;
  }
}

export async function updateMissionProgress(guildId, userId, weekNumber, year, missionId, increment = 1) {
  if (!isConnected) return null;
  try {
    const missions = await Mission.findOne({
      guildId,
      userId,
      weekNumber,
      year
    });
    
    if (!missions) return null;
    
    const mission = missions.missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return null;
    
    mission.progress = Math.min(mission.progress + increment, mission.target);
    if (mission.progress >= mission.target) {
      mission.completed = true;
      missions.completedCount += 1;
    }
    
    await missions.save();
    return { mission, completed: mission.completed, reward: mission.reward };
  } catch (error) {
    console.error('Error actualizando progreso de misión:', error.message);
    return null;
  }
}

export async function getMissionsStats(guildId, userId, weekNumber, year) {
  if (!isConnected) return null;
  try {
    const missions = await Mission.findOne({
      guildId,
      userId,
      weekNumber,
      year
    }).lean();
    return missions;
  } catch (error) {
    console.error('Error obteniendo estadísticas de misiones:', error.message);
    return null;
  }
}

export function isMongoConnected() {
  return isConnected;
}
