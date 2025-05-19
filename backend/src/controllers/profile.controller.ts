import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { createAsyncHandler } from "../utils/async.utils";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
import { ProfileService } from "../services/profile.service";
import { TypedAuthRequest } from "../types/typed-request";
import { IUserProfileUpdateInput } from "../types/user.types";
import { AUTH, PROFILE } from "../constants";
import { AppError } from "../middlewares/error.middleware";

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *               prenom:
 *                 type: string
 *                 description: Prénom de l'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
export const updateUserProfile = createAsyncHandler(
  async (
    req: TypedAuthRequest<IUserProfileUpdateInput>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorClient(res, "Erreur de validation", errors.array());
      }

      const result = await ProfileService.updateUserProfileData(
        req.user.id,
        req.body,
      );
      return sendSuccess(res, "Profil mis à jour avec succès", result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Télécharger un avatar utilisateur
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image de l'avatar
 *     responses:
 *       200:
 *         description: Avatar mis à jour avec succès
 *       400:
 *         description: Aucun fichier fourni
 *       401:
 *         description: Non autorisé
 */
export const uploadUserAvatar = createAsyncHandler(
  async (req: TypedAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
      }

      if (!req.file) {
        return sendErrorClient(res, PROFILE.ERRORS.NO_FILE);
      }

      const result = await ProfileService.updateAvatar(req.user.id, req.file);
      return sendSuccess(res, "Avatar mis à jour avec succès", result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/profile/me/change-password:
 *   put:
 *     summary: Changer le mot de passe utilisateur
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mot de passe actuel
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation du nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
export const changeUserPassword = createAsyncHandler(
  async (
    req: TypedAuthRequest<ChangePasswordBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorClient(res, "Erreur de validation", errors.array());
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await ProfileService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        confirmPassword,
      );
      return sendSuccess(res, "Mot de passe changé avec succès", result);
    } catch (error) {
      next(error);
    }
  },
);
