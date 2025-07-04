import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "../routes/auth.route";
import depenseRoutes from "../routes/depense.route";
import categorieRoutes from "../routes/categorie.route";
import statistiquesRoutes from "../routes/statistiques.route";
import profileRoutes from "../routes/profile.route";
import userRoutes from "../routes/user.route";
import revenuRoutes from "../routes/revenu.route";
import categorieRevenuRoutes from "../routes/categorieRevenu.route";
import { errorHandler, AppError } from "../middlewares/error.middleware";

export const createTestApp = (): express.Application => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.static("public"));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      details: {
        mongoStatus: "connected",
        uptime: process.uptime(),
      },
    });
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

  return app;
}; 