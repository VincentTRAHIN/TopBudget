console.log("--> [DEBUG] app.ts: Loading route imports...");
import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import profileRoutes from "./profile.route";
import depenseRoutes from "./depense.route";
import revenuRoutes from "./revenu.route";
import importRoutes from "./import.route";
import categorieRoutes from "./categorie.route";
import categorieRevenuRoutes from "./categorieRevenu.route";
import statistiquesRoutes from "./statistiques.route";
import healthRoutes from "../health.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
router.use("/depenses", depenseRoutes);
router.use("/revenus", revenuRoutes);
router.use("/import", importRoutes);
router.use("/categories", categorieRoutes);
router.use("/categories-revenu", categorieRevenuRoutes);
router.use("/statistiques", statistiquesRoutes);
console.log("--> [DEBUG] app.ts: Setting up advanced health check endpoints...");
router.use("/health", healthRoutes);
console.log("--> [DEBUG] app.ts: Health check endpoints configured.");
export default router;
