import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.route';
import depenseRoutes from './routes/depense.route';
import categorieRoutes from './routes/categorie.route';
import statistiquesRoutes from './routes/statistiques.route';
import logger from './utils/logger.utils';

dotenv.config();

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/statistiques', statistiquesRoutes);



// Gestion des erreurs 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => logger.info('🛢️  Connecté à MongoDB Atlas'))
  .catch((error) => logger.error('Erreur de connexion MongoDB Atlas:', error));

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`));
