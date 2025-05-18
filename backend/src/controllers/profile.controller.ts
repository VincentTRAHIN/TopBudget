import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import logger from "../utils/logger.utils";
import { AUTH, PROFILE } from "../constants";
import { IUserProfileUpdateInput } from "../types/user.types";
import { AppError } from "../middlewares/error.middleware";
import ProfileService from "../services/ProfileService";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';

/**
 * Mise à jour du profil utilisateur
 * @route PUT /api/profile
 * @access Privé
 */
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const userId = req.user.id;
    const result = await ProfileService.updateUserProfileData(userId, req.body as IUserProfileUpdateInput);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendErrorClient(res, error.message);
    } else {
      logger.error("Erreur lors de la mise à jour du profil:", error);
      sendErrorClient(res, PROFILE.ERROR_MESSAGES.SERVER_ERROR_UPDATE, 500);
    }
  }
};

/**
 * Téléchargement d'un avatar utilisateur
 * @route POST /api/profile/avatar
 * @access Privé
 */
export const uploadUserAvatar = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const userId = req.user.id;
    const result = await ProfileService.updateAvatar(userId, req.file!);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendErrorClient(res, error.message);
    } else {
      logger.error("Erreur lors de l'upload de l'avatar:", error);
      sendErrorClient(res, PROFILE.ERROR_MESSAGES.SERVER_ERROR_UPLOAD_AVATAR, 500);
    }
  }
};

/**
 * Changement du mot de passe utilisateur
 * @route PUT /api/profile/me/change-password
 * @access Privé
 */
export const changeUserPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await ProfileService.changePassword(userId, currentPassword, newPassword, confirmPassword);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendErrorClient(res, error.message);
    } else {
      logger.error("Erreur lors du changement de mot de passe:", error);
      sendErrorClient(res, PROFILE.ERROR_MESSAGES.SERVER_ERROR_PASSWORD_CHANGE, 500);
    }
  }
};
