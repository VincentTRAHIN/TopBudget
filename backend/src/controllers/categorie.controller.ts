import { Response } from "express";
import Categorie from "../models/categorie.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";

export const ajouterCategorie = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    res.status(400).json({ erreurs: erreurs.array() });
    return;
  }

  try {
    const { nom, description, image } = req.body;

    const nouvelleCategorie = await Categorie.create({
      nom,
      description,
      image,
    });

    res.status(201).json(nouvelleCategorie);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de la catégorie" });
  }
};

export const obtenirCategories = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await Categorie.find();
    res.json(categories);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des catégories" });
  }
};

export const modifierCategorie = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      res.status(404).json({ message: "Catégorie non trouvée" });
      return;
    }

    const updated = await Categorie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de la catégorie" });
  }
};

export const supprimerCategorie = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      res.status(404).json({ message: "Catégorie non trouvée" });
      return;
    }

    await categorie.deleteOne();
    res.json({ message: "Catégorie supprimée" });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de la catégorie" });
  }
};
