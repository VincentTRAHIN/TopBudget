import { Response } from "express";
import Categorie from "../models/categorie.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CATEGORIE } from "../constants";
import Depense from "../models/depense.model";

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

    // Validation de la longueur du nom
    if (nom.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH || nom.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH) {
      res.status(400).json({ message: `Le nom doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères` });
      return;
    }

    // Validation de la longueur de la description
    if (description && description.length > CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ message: `La description ne peut pas dépasser ${CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères` });
      return;
    }

    // Vérification si la catégorie existe déjà
    const categorieExistante = await Categorie.findOne({ nom: { $regex: new RegExp(nom, 'i') } });
    if (categorieExistante) {
      res.status(400).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS });
      return;
    }

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
    const categories = await Categorie.find().sort({ nom: 1 });
    res.json(categories);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
  }
};

export const modifierCategorie = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      res.status(404).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND });
      return;
    }

    // Vérification si le nouveau nom existe déjà
    if (req.body.nom && req.body.nom !== categorie.nom) {
      const categorieExistante = await Categorie.findOne({ 
        nom: { $regex: new RegExp(req.body.nom, 'i') },
        _id: { $ne: categorie._id }
      });
      if (categorieExistante) {
        res.status(400).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS });
        return;
      }
    }

    const updated = await Categorie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la catégorie" });
  }
};

export const supprimerCategorie = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      res.status(404).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND });
      return;
    }

    // Vérifier si la catégorie est utilisée par des dépenses
    const depenses = await Depense.countDocuments({ categorie: categorie._id });
    if (depenses > 0) {
      res.status(400).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_IN_USE });
      return;
    }

    await categorie.deleteOne();
    res.json({ message: "Catégorie supprimée" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la catégorie" });
  }
};
