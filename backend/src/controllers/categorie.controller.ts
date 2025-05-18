import { Response } from "express";
import Categorie from "../models/categorie.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CATEGORIE, COMMON } from "../constants";
import Depense from "../models/depense.model";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';

export const ajouterCategorie = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, erreurs.array());
    return;
  }

  try {
    const { nom: nomInitial, description, image } = req.body;
    const nom = nomInitial.trim();

    // Validation de la longueur du nom
    if (
      nom.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH ||
      nom.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH
    ) {
      sendErrorClient(res, `Le nom doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères`);
      return;
    }

    // Validation de la longueur de la description
    if (
      description &&
      description.length > CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH
    ) {
      sendErrorClient(res, `La description ne peut pas dépasser ${CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères`);
      return;
    }

    // Vérification si la catégorie existe déjà
    const categorieExistante = await Categorie.findOne({
      nom: { $regex: new RegExp(`^${nom}$`, "i") },
    });
    if (categorieExistante) {
      sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS);
      return;
    }

    const nouvelleCategorie = await Categorie.create({
      nom,
      description,
      image,
    });

    sendSuccess(res, nouvelleCategorie, 'Catégorie créée', 201);
  } catch (error) {
    logger.error(error);
    sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_ADD, 500);
  }
};

export const obtenirCategories = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categories = await Categorie.find().sort({ nom: 1 });
    sendSuccess(res, categories, 'Liste des catégories');
  } catch (error) {
    logger.error(error);
    sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_GET_LIST, 500);
  }
};

export const modifierCategorie = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND);
      return;
    }

    // Vérification si le nouveau nom existe déjà
    if (req.body.nom && req.body.nom !== categorie.nom) {
      const categorieExistante = await Categorie.findOne({
        nom: { $regex: new RegExp(req.body.nom, "i") },
        _id: { $ne: categorie._id },
      });
      if (categorieExistante) {
        sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS);
        return;
      }
    }

    const updated = await Categorie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    sendSuccess(res, updated, 'Catégorie modifiée');
  } catch (error) {
    logger.error(error);
    sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_UPDATE, 500);
  }
};

export const supprimerCategorie = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND);
      return;
    }

    // Vérifier si la catégorie est utilisée par des dépenses
    const depenses = await Depense.countDocuments({ categorie: categorie._id });
    if (depenses > 0) {
      sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_IN_USE);
      return;
    }

    await categorie.deleteOne();
    sendSuccess(res, { message: "Catégorie supprimée" });
  } catch (error) {
    logger.error(error);
    sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_DELETE, 500);
  }
};
