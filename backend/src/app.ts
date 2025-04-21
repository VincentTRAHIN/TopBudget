import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.route';
import depenseRoutes from './routes/depense.route';
import categorieRoutes from './routes/categorie.route';
import statistiquesRoutes from './routes/statistiques.route';
import logger from './utils/logger.utils';
import { swaggerSpec } from './docs/swagger.config';
import { errorHandler, AppError } from './middlewares/error.middleware';

dotenv.config();

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuration de Morgan pour ignorer les requêtes de healthcheck
app.use(morgan('combined', {
  skip: (req) => req.url === '/api/health',
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint amélioré
app.get('/api/health', (_req, res) => {
  try {
    // Vérifier la connexion MongoDB
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        status: 'error',
        message: 'Database connection not ready',
        details: {
          mongoStatus: mongoose.connection.readyState
        }
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      details: {
        mongoStatus: 'connected',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/statistiques', statistiquesRoutes);

// Gestion des erreurs 404
app.use((_req, _res, next) => {
  next(new AppError('Route non trouvée', 404));
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Fonction de connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    logger.info('📦 Connexion à MongoDB établie avec succès');
  } catch (error) {
    logger.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Lancer le serveur
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });

    // Gérer les erreurs du serveur
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Le port ${PORT} est déjà utilisé`);
      } else {
        logger.error('Erreur du serveur:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
