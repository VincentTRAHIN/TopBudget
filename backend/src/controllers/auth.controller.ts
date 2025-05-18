import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AUTH, COMMON } from "../constants";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';

const generateToken = (id: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET non défini");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: AUTH.JWT_EXPIRES_IN,
  });
};

export const inscription = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, erreurs.array());
    return;
  }

  const { nom, email, motDePasse } = req.body;

  try {
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      return;
    }

    const nouvelUtilisateur = new User({ nom, email, motDePasse });
    await nouvelUtilisateur.save();

    sendSuccess(res, {
      _id: nouvelUtilisateur._id,
      nom: nouvelUtilisateur.nom,
      email: nouvelUtilisateur.email,
      token: generateToken(nouvelUtilisateur._id as string),
    }, 'Utilisateur inscrit avec succès', 201);
  } catch (error) {
    logger.error((error as Error).message);
    sendErrorClient(res, AUTH.ERROR_MESSAGES.SERVER_ERROR_SIGNUP, 500);
  }
};

export const connexion = async (req: Request, res: Response): Promise<void> => {
  logger.info("Requête reçue sur /api/auth/login");
  logger.info(`Corps de la requête: ${JSON.stringify(req.body)}`);

  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    logger.warn(
      `Erreurs de validation login: ${JSON.stringify(erreurs.array())}`,
    );
    sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, erreurs.array());
    return;
  }

  const { email, motDePasse } = req.body;

  try {
    const utilisateur = await User.findOne({ email });
    if (!utilisateur) {
      logger.warn(`Utilisateur non trouvé pour email: ${email}`);
      sendErrorClient(res, AUTH.ERROR_MESSAGES.INVALID_CREDENTIALS);
      return;
    }
    logger.info(`Utilisateur trouvé: ${utilisateur.email}`);

    const motDePasseValide = await utilisateur.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      logger.warn(`Mot de passe invalide pour utilisateur: ${email}`);
      sendErrorClient(res, AUTH.ERROR_MESSAGES.INVALID_CREDENTIALS);
      return;
    }
    logger.info(`Connexion réussie pour utilisateur: ${email}`);

    sendSuccess(res, {
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      token: generateToken(utilisateur._id as string),
    }, 'Utilisateur connecté', 200);
  } catch (error) {
    logger.error("Erreur interne lors de la connexion:", error);
    sendErrorClient(res, AUTH.ERROR_MESSAGES.SERVER_ERROR_LOGIN, 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
    return;
  }

  try {
    const utilisateur = await User.findById(req.user.id).select("-motDePasse");

    if (!utilisateur) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.USER_NOT_FOUND);
      return;
    }

    await utilisateur.populate({
      path: "partenaireId",
      select: "nom email avatarUrl _id",
    });

    sendSuccess(res, {
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
      dateCreation: utilisateur.dateCreation,
      avatarUrl: utilisateur.avatarUrl,
      partenaireId: utilisateur.partenaireId,
    });
  } catch (error) {
    logger.error("Erreur dans getMe:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'utilisateur",
    });
  }
};
