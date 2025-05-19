import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AUTH, COMMON } from "../constants";
import { AuthInscriptionBody, AuthConnexionBody } from "../types/auth.types";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
import { createAsyncHandler } from "../utils/async.utils";
import { AuthService } from "../services/auth.service";

/**
 * @swagger
 * /api/auth/inscription:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthInscriptionBody'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
export const inscription = createAsyncHandler(
  async (
    req: Request & { body: AuthInscriptionBody },
    res: Response,
  ): Promise<void> => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
      sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, erreurs.array());
      return;
    }

    try {
      const userData = await AuthService.inscription(req.body);
      sendSuccess(res, AUTH.SUCCESS.SIGNUP, userData, 201);
    } catch (error) {
      logger.error((error as Error).message);
      sendErrorClient(res, AUTH.ERRORS.SIGNUP_ERROR);
    }
  },
);

/**
 * @swagger
 * /api/auth/connexion:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion d'un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthConnexionBody'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiants invalides
 */
export const connexion = createAsyncHandler(
  async (
    req: Request & { body: AuthConnexionBody },
    res: Response,
  ): Promise<void> => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
      sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, erreurs.array());
      return;
    }

    try {
      const userData = await AuthService.connexion(req.body);
      sendSuccess(res, AUTH.SUCCESS.LOGIN, userData);
    } catch (error) {
      logger.error((error as Error).message);
      sendErrorClient(res, AUTH.ERRORS.LOGIN_ERROR);
    }
  },
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
export const getMe = createAsyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    try {
      const userData = await AuthService.getMe(req.user.id);
      sendSuccess(res, AUTH.SUCCESS.PROFILE_FETCHED, userData);
    } catch (error) {
      logger.error("Erreur dans getMe:", error);
      sendErrorClient(res, AUTH.ERRORS.PROFILE_FETCH_ERROR);
    }
  },
);
