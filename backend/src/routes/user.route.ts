import express from "express";
import { proteger } from "../middlewares/auth.middleware";
import { searchUser } from "../controllers/user.controller";

const router = express.Router();

// Recherche d'utilisateur par email ou nom
router.get("/search", proteger, searchUser);

export default router;
