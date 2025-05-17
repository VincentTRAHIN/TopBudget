import express from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  updateUserProfile,
  uploadUserAvatar,
  changeUserPassword,
} from "../controllers/profile.controller";
import { uploadAvatar } from "../middlewares/upload.middleware";

const router = express.Router();

// Route pour mettre à jour le profil utilisateur
router.put("/", proteger, updateUserProfile);

// Route pour télécharger un avatar
router.post("/avatar", proteger, uploadAvatar, uploadUserAvatar);

// Route pour changer le mot de passe
router.put("/me/change-password", proteger, changeUserPassword);

export default router;
