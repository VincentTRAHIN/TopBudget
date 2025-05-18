import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import Categorie from "../models/categorie.model";
import Depense from "../models/depense.model";
import { CATEGORIE, COMMON } from "../constants";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { IdParams, CategorieRequest } from '../types/typed-request';
import { createAsyncHandler } from '../utils/async.utils';

/**
 * Ajouter une nouvelle catégorie
 * POST /api/categories
 */
export const ajouterCategorie = createAsyncHandler<CategorieRequest.CreateBody>(
  async (req, res): Promise<void> => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
      sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, erreurs.array());
      return;
    }

    try {
      const { nom: nomInitial, description, image } = req.body;
      const nom = nomInitial.trim();

      if (
        nom.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH ||
        nom.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH
      ) {
        sendErrorClient(res, `Le nom doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères`);
        return;
      }

      if (
        description &&
        description.length > CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH
      ) {
        sendErrorClient(res, `La description ne peut pas dépasser ${CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères`);
        return;
      }

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
  }
);

/**
 * Obtenir la liste des catégories
 * GET /api/categories
 */
export const obtenirCategories = createAsyncHandler(
  async (req, res): Promise<void> => {
    try {
      const categories = await Categorie.find().sort({ nom: 1 });
      sendSuccess(res, categories, 'Liste des catégories');
    } catch (error) {
      logger.error(error);
      sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_GET_LIST, 500);
    }
  }
);

/**
 * Modifier une catégorie existante
 * PUT /api/categories/:id
 */
export const modifierCategorie = createAsyncHandler<CategorieRequest.UpdateBody, IdParams>(
  async (req, res): Promise<void> => {
    try {
      const categorie = await Categorie.findById(req.params.id);

      if (!categorie) {
        sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND);
        return;
      }

      if (req.body.nom) {
        const nomExiste = await Categorie.findOne({
          _id: { $ne: req.params.id },
          nom: { $regex: new RegExp(`^${req.body.nom.trim()}$`, "i") },
        });

        if (nomExiste) {
          sendErrorClient(
            res,
            CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS,
          );
          return;
        }
      }

      Object.assign(categorie, req.body);

      if (categorie.nom) {
        if (
          categorie.nom.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH ||
          categorie.nom.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH
        ) {
          sendErrorClient(
            res,
            `Le nom doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères`,
          );
          return;
        }
      }

      if (
        categorie.description &&
        categorie.description.length > CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH
      ) {
        sendErrorClient(
          res,
          `La description ne peut pas dépasser ${CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères`,
        );
        return;
      }

      await categorie.save();
      sendSuccess(res, categorie, 'Catégorie modifiée');
    } catch (error) {
      logger.error(error);
      sendErrorClient(
        res,
        CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_UPDATE,
        500,
      );
    }
  }
);

/**
 * Supprimer une catégorie
 * DELETE /api/categories/:id
 */
export const supprimerCategorie = createAsyncHandler<Record<string, never>, IdParams>(
  async (req, res): Promise<void> => {
    try {
      const categorie = await Categorie.findById(req.params.id);
      if (!categorie) {
        sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND);
        return;
      }

      const depensesAssociees = await Depense.findOne({
        categorie: req.params.id,
      });
      if (depensesAssociees) {
        sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_IN_USE);
        return;
      }

      await categorie.deleteOne();
      sendSuccess(res, { message: "Catégorie supprimée" });
    } catch (error) {
      logger.error(error);
      sendErrorClient(
        res,
        CATEGORIE.ERROR_MESSAGES.SERVER_ERROR_DELETE,
        500,
      );
    }
  }
);
