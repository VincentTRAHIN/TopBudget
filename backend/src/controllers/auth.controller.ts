import { Request, Response } from "express";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

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
    console.error((error as Error).message);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
};

export const connexion = async (req: Request, res: Response): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
     res.status(400).json({ erreurs: erreurs.array() });
     return;
  }

  const { email, motDePasse } = req.body;

  try {
    const utilisateur = await User.findOne({ email });
    if (!utilisateur) {
       res
        .status(400)
        .json({ message: "Email ou mot de passe invalide" });
        return;
    }

    const motDePasseValide = await utilisateur.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
       res
        .status(400)
        .json({ message: "Email ou mot de passe invalide" });
        return;
    }

    res.json({
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      token: generateToken(utilisateur._id as string),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};
