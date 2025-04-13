import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";

const generateToken = (id: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET non défini");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const inscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    res.status(400).json({ erreurs: erreurs.array() });
  }

  const { nom, email, motDePasse } = req.body;

  try {
    const userExistant = await User.findOne({ email });
    if (userExistant) {
      res.status(400).json({ message: "Cet email est déjà utilisé" });
      return;
    }

    const nouvelUtilisateur = new User({ nom, email, motDePasse });
    await nouvelUtilisateur.save();

    res.status(201).json({
      _id: nouvelUtilisateur._id,
      nom: nouvelUtilisateur.nom,
      email: nouvelUtilisateur.email,
      token: generateToken(nouvelUtilisateur._id as string),
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
};

export const connexion = async (req: Request, res: Response): Promise<void> => {
  logger.info("Requête reçue sur /api/auth/login"); // Log 1
  logger.info(`Corps de la requête: ${JSON.stringify(req.body)}`); // Log 2: Voir les données reçues
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    logger.warn(
      `Erreurs de validation login: ${JSON.stringify(erreurs.array())}`
    ); // Log 3: Voir les erreurs de validation
    res.status(400).json({ erreurs: erreurs.array() });
    return;
  }

  const { email, motDePasse } = req.body;

  try {
    const utilisateur = await User.findOne({ email });
    if (!utilisateur) {
      logger.warn(`Utilisateur non trouvé pour email: ${email}`); // Log 4

      res.status(400).json({ message: "Email ou mot de passe invalide" });
      return;
    }
    logger.info(`Utilisateur trouvé: ${utilisateur.email}`); // Log 5


    const motDePasseValide = await utilisateur.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      logger.warn(`Mot de passe invalide pour utilisateur: ${email}`); // Log 6

      res.status(400).json({ message: "Email ou mot de passe invalide" });
      return;
    }
    logger.info(`Connexion réussie pour utilisateur: ${email}`); // Log 7

    res.json({
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      token: generateToken(utilisateur._id as string),
    });
  } catch (error) {
    logger.error('Erreur interne lors de la connexion:', error); // Log 8
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res
      .status(401)
      .json({ message: "Non autorisé ou utilisateur non trouvé via token" });
    return;
  }

  try {
    const utilisateur = await User.findById(req.user.id).select("-motDePasse");

    if (!utilisateur) {
      // Si l'utilisateur a été supprimé entretemps
      res
        .status(404)
        .json({ message: "Utilisateur non trouvé en base de données" });
      return;
    }

    // Renvoyer les données de l'utilisateur
    res.status(200).json({
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
    });
  } catch (error) {
    logger.error("Erreur dans getMe:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'utilisateur",
    });
  }
};
