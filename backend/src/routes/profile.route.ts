import express from "express";
import { proteger } from "../middlewares/auth.middleware";
import { updateUserProfile, uploadUserAvatar } from "../controllers/profile.controller";

const router = express.Router();

// Route pour mettre à jour le profil utilisateur
router.put("/", proteger, updateUserProfile);

// Route pour télécharger un avatar
router.post("/avatar", proteger, uploadUserAvatar);

export default router;
