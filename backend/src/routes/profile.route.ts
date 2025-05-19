import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  updateUserProfile,
  uploadUserAvatar,
  changeUserPassword,
} from "../controllers/profile.controller";
import { uploadAvatar } from "../middlewares/upload.middleware";
import { asyncHandler } from '../utils/async.utils';

const router = Router();

// Route pour mettre à jour le profil utilisateur
router.put("/", proteger, asyncHandler(updateUserProfile));

// Route pour télécharger un avatar
router.post("/avatar", proteger, uploadAvatar, asyncHandler(uploadUserAvatar));

// Route pour changer le mot de passe
router.put("/me/change-password", proteger, asyncHandler(changeUserPassword));

export default router;
