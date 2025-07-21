console.log("🔍 DEBUG: Starting imports...");
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
console.log("🔍 DEBUG: Basic imports successful");
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.route";
import depenseRoutes from "./routes/depense.route";
import categorieRoutes from "./routes/categorie.route";
import statistiquesRoutes from "./routes/statistiques.route";
import profileRoutes from "./routes/profile.route";
import userRoutes from "./routes/user.route";
import revenuRoutes from "./routes/revenu.route";
import categorieRevenuRoutes from "./routes/categorieRevenu.route";
import logger from "./utils/logger.utils";
console.log("🔍 DEBUG: Logger imported");
import { swaggerSpec } from "./docs/swagger.config";
console.log("🔍 DEBUG: Swagger config imported");
import { errorHandler, AppError } from "./middlewares/error.middleware";
console.log("🔍 DEBUG: All imports completed");

dotenv.config();
console.log("🔍 DEBUG: dotenv configured");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const morganFormat = process.env.NODE_ENV === "development" ? "dev" : "combined";

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

// Temporarily disable Swagger due to YAML syntax errors
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

app.use("/api/auth", authRoutes);
app.use("/api/depenses", depenseRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/categories-revenu", categorieRevenuRoutes);
app.use("/api/statistiques", statistiquesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/revenus", revenuRoutes);

app.use((_req, _res, next) => {
  next(new AppError("Route non trouvée", 404));
});

app.use(errorHandler);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    logger.info("📦 Connexion à MongoDB établie avec succès");
  } catch (error) {
    logger.error("Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    console.log("🔍 DEBUG: Starting server...");
    console.log("🔍 DEBUG: PORT =", PORT);
    console.log("🔍 DEBUG: MONGO_URI =", process.env.MONGO_URI ? "SET" : "NOT SET");
    
    await connectDB();
    console.log("🔍 DEBUG: Database connected successfully");
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 DEBUG: Server started on port ${PORT}`);
      logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Le port ${PORT} est déjà utilisé`);
      } else {
        logger.error("Erreur du serveur:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error("Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

console.log("🔍 DEBUG: About to start server...");
startServer().catch((error) => {
  console.error("🚨 FATAL ERROR during server startup:", error);
  process.exit(1);
});
