import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import profileRoutes from "./profile.route";
import depenseRoutes from "./depense.route";
import revenuRoutes from "./revenu.route";
import categorieRoutes from "./categorie.route";
import categorieRevenuRoutes from "./categorieRevenu.route";
import statistiquesRoutes from "./statistiques.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
router.use("/depenses", depenseRoutes);
router.use("/revenus", revenuRoutes);
router.use("/categories", categorieRoutes);
router.use("/categories-revenu", categorieRevenuRoutes);
router.use("/statistiques", statistiquesRoutes);

export default router;
