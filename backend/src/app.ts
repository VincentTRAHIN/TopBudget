console.log("--> [DEBUG] app.ts: Top of file, starting imports...");

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

console.log("--> [DEBUG] app.ts: Basic imports loaded.");

console.log("--> [DEBUG] app.ts: Loading dotenv...");
dotenv.config();
console.log("--> [DEBUG] app.ts: dotenv.config() executed.");

console.log(`--> [DEBUG] app.ts: NODE_ENV is: ${process.env.NODE_ENV}`);
console.log(`--> [DEBUG] app.ts: MONGO_URI is set: ${!!process.env.MONGO_URI}`);
console.log(`--> [DEBUG] app.ts: JWT_SECRET is set: ${!!process.env.JWT_SECRET}`);
console.log(`--> [DEBUG] app.ts: PORT is set: ${!!process.env.PORT || "5001 (default)"}`);

console.log("--> [DEBUG] app.ts: Loading route imports...");
import authRoutes from "./routes/auth.route";
import depenseRoutes from "./routes/depense.route";
import categorieRoutes from "./routes/categorie.route";
import statistiquesRoutes from "./routes/statistiques.route";
import profileRoutes from "./routes/profile.route";
import userRoutes from "./routes/user.route";
import revenuRoutes from "./routes/revenu.route";
import categorieRevenuRoutes from "./routes/categorieRevenu.route";

console.log("--> [DEBUG] app.ts: Route imports loaded. Loading utilities...");
import logger from "./utils/logger.utils";
import { errorHandler, AppError } from "./middlewares/error.middleware";

console.log("--> [DEBUG] app.ts: All imports completed. Creating Express app...");
const app = express();

console.log("--> [DEBUG] app.ts: Express app created. Setting up middleware...");

app.use(helmet());
console.log("--> [DEBUG] app.ts: Helmet middleware added.");

const allowedOrigins = [
  'http://localhost:3000',
  'https://top-budget.vercel.app' 
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
console.log("--> [DEBUG] app.ts: CORS middleware added.");

app.use(express.json());
console.log("--> [DEBUG] app.ts: JSON middleware added.");

app.use(express.static("public"));
console.log("--> [DEBUG] app.ts: Static middleware added.");

const morganFormat = process.env.NODE_ENV === "development" ? "dev" : "combined";
console.log(`--> [DEBUG] app.ts: Morgan format set to: ${morganFormat}`);

const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

app.use(
  morgan(morganFormat, {
    skip: (req) => req.url === "/api/health",
    stream: morganStream,
  }),
);
console.log("--> [DEBUG] app.ts: Morgan middleware added.");

console.log("--> [DEBUG] app.ts: Setting up health check endpoint...");
app.get("/api/health", (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        status: "error",
        message: "Database connection not ready",
        details: {
          mongoStatus: mongoose.connection.readyState,
        },
      });
      return;
    }

    res.status(200).json({
      status: "ok",
      details: {
        mongoStatus: "connected",
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      message: "Health check failed",
    });
  }
});
console.log("--> [DEBUG] app.ts: Health check endpoint configured.");

console.log("--> [DEBUG] app.ts: Setting up API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/depenses", depenseRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/categories-revenu", categorieRevenuRoutes);
app.use("/api/statistiques", statistiquesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/revenus", revenuRoutes);
console.log("--> [DEBUG] app.ts: All API routes configured.");

console.log("--> [DEBUG] app.ts: Setting up error handling...");
app.use((_req, _res, next) => {
  next(new AppError("Route non trouvée", 404));
});

app.use(errorHandler);
console.log("--> [DEBUG] app.ts: Error handling configured.");

const connectDB = async () => {
  try {
    console.log("--> [DEBUG] connectDB: Starting MongoDB connection...");
    console.log("--> [DEBUG] connectDB: Attempting to connect to MongoDB...");
    
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("--> [FATAL] connectDB: MONGO_URI is not defined!");
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    console.log("--> [DEBUG] connectDB: MONGO_URI is present. Calling mongoose.connect().");
    console.log(`--> [DEBUG] connectDB: MongoDB URI starts with: ${mongoUri.substring(0, 20)}...`);
    
    await mongoose.connect(mongoUri);
    
    console.log("--> [SUCCESS] connectDB: MongoDB connection successful.");
    logger.info("📦 Connexion à MongoDB établie avec succès");
  } catch (error) {
    const err = error as Error;
    console.error("--> [FATAL] connectDB: MongoDB connection failed:", error);
    console.error("--> [FATAL] connectDB: Error details:", {
      name: err?.name || 'Unknown',
      message: err?.message || 'No message',
      stack: err?.stack || 'No stack trace',
    });
    logger.error("Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;
console.log(`--> [DEBUG] app.ts: PORT determined as: ${PORT}`);

const loadSwaggerAndStartServer = async () => {
  console.log("--> [DEBUG] app.ts: Loading swagger config...");
  let swaggerSpec;
  try {
    console.log("--> [DEBUG] app.ts: Initializing swaggerSpec...");
    const swaggerModule = await import("./docs/swagger.config");
    swaggerSpec = swaggerModule.swaggerSpec;
    console.log("--> [DEBUG] app.ts: swaggerSpec loaded successfully.");
  } catch (error) {
    const err = error as Error;
    console.error("--> [FATAL] app.ts: CRASH during swagger initialization:", error);
    console.error("--> [FATAL] app.ts: Error details:", {
      name: err?.name || 'Unknown',
      message: err?.message || 'No message',
      stack: err?.stack || 'No stack trace',
    });
    process.exit(1);
  }

  console.log("--> [DEBUG] app.ts: Setting up Swagger UI...");
  try {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("--> [DEBUG] app.ts: Swagger UI middleware added successfully.");
  } catch (error) {
    console.error("--> [FATAL] app.ts: CRASH during Swagger UI setup:", error);
    process.exit(1);
  }

  await startServer();
};

const startServer = async () => {
  try {
    console.log("--> [DEBUG] startServer: Starting server initialization...");
    console.log("--> [DEBUG] startServer: Calling connectDB().");
    
    await connectDB();
    
    console.log("--> [DEBUG] startServer: connectDB() finished. Starting Express server...");
    
    const server = app.listen(PORT, () => {
      console.log(`--> [SUCCESS] startServer: Server listening on port ${PORT}.`);
      logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error(`--> [FATAL] startServer: Server error occurred:`, error);
      if (error.code === "EADDRINUSE") {
        console.error(`--> [FATAL] startServer: Port ${PORT} is already in use`);
        logger.error(`Le port ${PORT} est déjà utilisé`);
      } else {
        console.error("--> [FATAL] startServer: Other server error:", error);
        logger.error("Erreur du serveur:", error);
      }
      process.exit(1);
    });

    console.log("--> [DEBUG] startServer: Server setup completed successfully.");
    
  } catch (error) {
    const err = error as Error;
    console.error("--> [FATAL] startServer: Error during server startup:", error);
    console.error("--> [FATAL] startServer: Error details:", {
      name: err?.name || 'Unknown',
      message: err?.message || 'No message',
      stack: err?.stack || 'No stack trace',
    });
    logger.error("Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

console.log("--> [DEBUG] app.ts: About to call loadSwaggerAndStartServer().");
loadSwaggerAndStartServer();

// Additional safety measures to catch any unhandled errors
console.log("--> [DEBUG] app.ts: Setting up global error handlers...");

process.on('uncaughtException', (error) => {
  console.error("--> [FATAL] UNCAUGHT EXCEPTION:", error);
  console.error("--> [FATAL] Error details:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("--> [FATAL] UNHANDLED REJECTION at:", promise);
  console.error("--> [FATAL] Reason:", reason);
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

console.log("--> [DEBUG] app.ts: Global error handlers configured. App initialization complete.");
