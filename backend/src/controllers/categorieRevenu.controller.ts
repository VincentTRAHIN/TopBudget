import { Response } from "express";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import RevenuModel from "../models/revenu.model";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { CATEGORIE_REVENU, COMMON } from '../constants';

export const ajouterCategorieRevenu = async (
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
    if (
      nom.length < CATEGORIE_REVENU.VALIDATION.MIN_NOM_LENGTH ||
      nom.length > CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH
    ) {
      sendErrorClient(res, `Le nom doit contenir entre ${CATEGORIE_REVENU.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH} caractères`);
      return;
    }
    if (
      description &&
      description.length > CATEGORIE_REVENU.VALIDATION.MAX_DESCRIPTION_LENGTH
    ) {
      sendErrorClient(res, `La description ne peut pas dépasser ${CATEGORIE_REVENU.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères`);
      return;
    }
    const existante = await CategorieRevenuModel.findOne({
      nom: { $regex: new RegExp(`^${nom}$`, "i") },
    });
    if (existante) {
      sendErrorClient(res, CATEGORIE_REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_ALREADY_EXISTS);
      return;
    }
    const nouvelleCategorie = await CategorieRevenuModel.create({
      nom,
      description,
      image,
    });
    sendSuccess(res, nouvelleCategorie, 'Catégorie de revenu créée', 201);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout de la catégorie de revenu" });
  }
};

export const obtenirCategoriesRevenu = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categories = await CategorieRevenuModel.find().sort({ nom: 1 });
    sendSuccess(res, categories, 'Liste des catégories de revenu');
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des catégories de revenus",
      });
  }
};

export const modifierCategorieRevenu = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categorie = await CategorieRevenuModel.findById(req.params.id);
    if (!categorie) {
      sendErrorClient(res, CATEGORIE_REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_NOT_FOUND);
      return;
    }
    if (req.body.nom && req.body.nom !== categorie.nom) {
      const existante = await CategorieRevenuModel.findOne({
        nom: { $regex: new RegExp(req.body.nom, "i") },
        _id: { $ne: categorie._id },
      });
      if (existante) {
        sendErrorClient(res, CATEGORIE_REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_ALREADY_EXISTS);
        return;
      }
    }
    const updated = await CategorieRevenuModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    sendSuccess(res, updated, 'Catégorie de revenu modifiée');
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la mise à jour de la catégorie de revenu",
      });
  }
};

export const supprimerCategorieRevenu = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categorie = await CategorieRevenuModel.findById(req.params.id);
    if (!categorie) {
      sendErrorClient(res, CATEGORIE_REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_NOT_FOUND);
      return;
    }
    const revenus = await RevenuModel.countDocuments({
      categorieRevenu: categorie._id,
    });
    if (revenus > 0) {
      sendErrorClient(res, CATEGORIE_REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_IN_USE);
      return;
    }
    await categorie.deleteOne();
    sendSuccess(res, { message: 'Catégorie de revenu supprimée' });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la suppression de la catégorie de revenu",
      });
  }
};
