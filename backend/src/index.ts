// Charger et valider les variables d'environnement en premier
import { config } from "./config/env.config";

import mongoose from "mongoose";
import app from "./app";
import logger from "./utils/logger.utils";

const PORT = config.PORT;

const connectDB = async () => {
  try {
    console.log("--> [DEBUG] connectDB: Starting MongoDB connection...");
    const mongoUri = config.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured');
    }
    await mongoose.connect(mongoUri);
    console.log("--> [SUCCESS] connectDB: MongoDB connection successful.");
    logger.info("📦 Connexion à MongoDB établie avec succès");
  } catch (error) {
    const err = error as Error;
    console.error("--> [FATAL] connectDB: MongoDB connection failed:", err);
    logger.error("Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`--> [SUCCESS] startServer: Server listening on port ${PORT}.`);
      logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });
    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error(`--> [FATAL] startServer: Server error occurred:`, error);
      if (error.code === "EADDRINUSE") {
        logger.error(`Le port ${PORT} est déjà utilisé`);
      } else {
        logger.error("Erreur du serveur:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    const err = error as Error;
    console.error("--> [FATAL] startServer: Error during server startup:", err);
    logger.error("Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Gestion globale des erreurs
process.on('uncaughtException', (error) => {
  console.error("--> [FATAL] UNCAUGHT EXCEPTION:", error);
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("--> [FATAL] UNHANDLED REJECTION at:", promise);
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log("--> [INFO] SIGTERM received, shutting down gracefully...");
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log("--> [INFO] SIGINT received, shutting down gracefully...");
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
