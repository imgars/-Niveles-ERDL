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

export async function getAllUsersFromMongo(guildId) {
  if (!isConnected) return [];
  try {
    const users = await User.find({ guildId }).lean();
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

export function isMongoConnected() {
  return isConnected;
}
