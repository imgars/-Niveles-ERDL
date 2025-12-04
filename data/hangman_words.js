export const HANGMAN_WORDS = {
  facil: [
    'casa', 'perro', 'gato', 'sol', 'luna', 'agua', 'fuego', 'tierra', 'aire', 'mar',
    'paz', 'amor', 'vida', 'luz', 'flor', 'arbol', 'mesa', 'silla', 'libro', 'lapiz',
    'pan', 'leche', 'cafe', 'te', 'jugo', 'fruta', 'mano', 'pie', 'ojo', 'nariz',
    'boca', 'pelo', 'cara', 'cuerpo', 'rojo', 'azul', 'verde', 'negro', 'blanco', 'rosa',
    'uno', 'dos', 'tres', 'diez', 'cien', 'hola', 'adios', 'bueno', 'malo', 'grande',
    'niño', 'niña', 'hombre', 'mujer', 'papa', 'mama', 'hijo', 'hija', 'rey', 'reina'
  ],
  medio: [
    'ordenador', 'telefono', 'internet', 'mensaje', 'correo', 'pagina', 'imagen', 'video',
    'musica', 'pelicula', 'cancion', 'guitarra', 'piano', 'violin', 'bateria', 'flauta',
    'futbol', 'baloncesto', 'tenis', 'beisbol', 'natacion', 'ciclismo', 'atletismo',
    'hospital', 'escuela', 'universidad', 'biblioteca', 'restaurante', 'supermercado',
    'aeropuerto', 'estacion', 'edificio', 'apartamento', 'habitacion', 'ventana',
    'computadora', 'televisor', 'refrigerador', 'microondas', 'lavadora', 'secadora',
    'serpiente', 'elefante', 'jirafa', 'cocodrilo', 'delfin', 'tiburon', 'tortuga',
    'mariposa', 'abeja', 'hormiga', 'araña', 'mosquito', 'libelula', 'escarabajo',
    'manzana', 'naranja', 'platano', 'fresa', 'sandia', 'melon', 'uva', 'piña',
    'zanahoria', 'tomate', 'lechuga', 'cebolla', 'papa', 'brocoli', 'espinaca'
  ],
  dificil: [
    'extraordinario', 'revolucionario', 'independiente', 'responsabilidad', 'comunicacion',
    'infraestructura', 'internacional', 'conocimiento', 'descubrimiento', 'transformacion',
    'administracion', 'representante', 'organizacion', 'electronica', 'programacion',
    'matematicas', 'astronomia', 'arquitectura', 'ingenieria', 'tecnologia',
    'sostenibilidad', 'biodiversidad', 'ecosistema', 'fotosintesis', 'metabolismo',
    'neurociencia', 'psicologia', 'sociologia', 'antropologia', 'arqueologia',
    'paleontologia', 'geologia', 'meteorologia', 'oceanografia', 'climatologia',
    'cryptocurrency', 'blockchain', 'inteligencia', 'automatizacion', 'digitalizacion',
    'globalizacion', 'diversificacion', 'especializacion', 'comercializacion',
    'profesionalismo', 'emprendimiento', 'innovacion', 'creatividad', 'productividad'
  ],
  videojuegos: [
    'minecraft', 'fortnite', 'valorant', 'overwatch', 'csgo', 'dota', 'warcraft',
    'starcraft', 'diablo', 'hearthstone', 'pokemon', 'zelda', 'mario', 'kirby',
    'metroid', 'splatoon', 'smash', 'xenoblade', 'fireemblem', 'animalcrossing',
    'playstation', 'xbox', 'nintendo', 'steam', 'discord', 'twitch', 'youtube',
    'genshin', 'honkai', 'roblox', 'amongus', 'apex', 'pubg', 'callofduty',
    'battlefield', 'halo', 'destiny', 'borderlands', 'bioshock', 'fallout',
    'skyrim', 'witcher', 'darksouls', 'eldenring', 'sekiro', 'bloodborne',
    'residentevil', 'silenthill', 'outlast', 'amnesia', 'phasmophobia'
  ],
  paises: [
    'venezuela', 'colombia', 'ecuador', 'peru', 'bolivia', 'chile', 'argentina',
    'uruguay', 'paraguay', 'brasil', 'mexico', 'guatemala', 'honduras', 'salvador',
    'nicaragua', 'costarica', 'panama', 'cuba', 'republicadominicana', 'puertorico',
    'españa', 'portugal', 'francia', 'alemania', 'italia', 'reinounido', 'irlanda',
    'holanda', 'belgica', 'suiza', 'austria', 'polonia', 'rusia', 'ucrania',
    'estadosunidos', 'canada', 'australia', 'nuevazelanda', 'japon', 'china',
    'corea', 'tailandia', 'vietnam', 'indonesia', 'filipinas', 'india', 'egipto'
  ],
  discord: [
    'servidor', 'canal', 'mensaje', 'mencion', 'emoji', 'sticker', 'reaccion',
    'moderador', 'administrador', 'propietario', 'miembro', 'rol', 'permiso',
    'nitro', 'boost', 'nivel', 'experiencia', 'leaderboard', 'ranking', 'estadisticas',
    'bot', 'comando', 'slash', 'embed', 'webhook', 'integracion', 'aplicacion',
    'stream', 'compartir', 'pantalla', 'microfono', 'camara', 'videollamada',
    'servidor', 'comunidad', 'amigos', 'grupo', 'directos', 'notificacion'
  ]
};

export function getRandomWord(difficulty = null) {
  let wordPool = [];
  
  if (difficulty && HANGMAN_WORDS[difficulty]) {
    wordPool = HANGMAN_WORDS[difficulty];
  } else {
    Object.values(HANGMAN_WORDS).forEach(words => {
      wordPool = wordPool.concat(words);
    });
  }
  
  return wordPool[Math.floor(Math.random() * wordPool.length)];
}

export function getWordsByCategory(category) {
  return HANGMAN_WORDS[category] || [];
}

export function getAllCategories() {
  return Object.keys(HANGMAN_WORDS);
}

export function getWordDifficulty(word) {
  for (const [difficulty, words] of Object.entries(HANGMAN_WORDS)) {
    if (words.includes(word.toLowerCase())) {
      return difficulty;
    }
  }
  return 'desconocido';
}
