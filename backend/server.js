// Chargement des variables d'environnement et des dépendances principales.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import des modules de routes, classés par ressource métier.
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const auteursRoutes = require('./routes/auteurs.routes');
const livresRoutes = require('./routes/livres.routes');
const empruntsRoutes = require('./routes/emprunts.routes');
const statsRoutes = require('./routes/stats.routes');

// Création de l'application Express et configuration du port d'écoute.
const app = express();
const PORT = Number(process.env.PORT) || 3000;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Autorise les appels du front local tout en gardant une validation stricte sur les origines.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors(corsOrigins.length ? {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || /localhost:\d+$|127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin non autorisee par CORS'));
  },
  credentials: true,
} : { origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(logger);
// Sert les fichiers statiques du frontend (HTML, CSS, JS) dès que l'API démarre.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Redirection de la racine vers le dashboard principal.
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Vérifie que le serveur reçoit bien des requêtes et que PostgreSQL répond.
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      db: result.rows[0].now,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Montage des routes API par domaine fonctionnel.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auteurs', auteursRoutes);
app.use('/api/livres', livresRoutes);
app.use('/api/emprunts', empruntsRoutes);
app.use('/api/stats', statsRoutes);

// Gestion centralisée des routes non trouvées.
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route introuvable' });
});

// Middleware final pour les erreurs métier et les exceptions.
app.use(errorHandler);

// Démarrage du serveur sur le port configuré.
app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`);
});