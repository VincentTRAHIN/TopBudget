import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { createAsyncHandler } from "../utils/async.utils";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
import { CategorieService } from "../services/categorie.service";
import { TypedAuthRequest, CategorieCreateBody, CategorieUpdateBody, IdParams } from "../types/typed-request";
import { CATEGORIE, COMMON } from "../constants";

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Créer une nouvelle catégorie
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom de la catégorie
 *               description:
 *                 type: string
 *                 description: Description de la catégorie
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: La catégorie existe déjà
 */
export const ajouterCategorie = createAsyncHandler(
  async (req: TypedAuthRequest<CategorieCreateBody>, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
      }

      const categorie = await CategorieService.create(req.body);
      return sendSuccess(res, CATEGORIE.SUCCESS.CREATED, categorie, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtenir la liste des catégories
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 */
export const obtenirCategories = createAsyncHandler(
  async (req: TypedAuthRequest, res: Response, next: NextFunction) => {
    try {
      const categories = await CategorieService.getAll();
      return sendSuccess(res, CATEGORIE.SUCCESS.FETCHED, categories);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtenir une catégorie par son ID
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie récupérée avec succès
 *       404:
 *         description: Catégorie non trouvée
 */
export const obtenirCategorieParId = createAsyncHandler(
  async (req: TypedAuthRequest<unknown, IdParams>, res: Response, next: NextFunction) => {
    try {
      const categorie = await CategorieService.getById(req.params.id);
      return sendSuccess(res, CATEGORIE.SUCCESS.FETCHED, categorie);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Modifier une catégorie
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nouveau nom de la catégorie
 *               description:
 *                 type: string
 *                 description: Nouvelle description de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie modifiée avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Catégorie non trouvée
 *       409:
 *         description: La catégorie existe déjà
 */
export const modifierCategorie = createAsyncHandler(
  async (req: TypedAuthRequest<CategorieUpdateBody, IdParams>, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
      }

      const categorie = await CategorieService.update(req.params.id, req.body);
      return sendSuccess(res, CATEGORIE.SUCCESS.UPDATED, categorie);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée avec succès
 *       400:
 *         description: Catégorie en cours d'utilisation
 *       404:
 *         description: Catégorie non trouvée
 */
export const supprimerCategorie = createAsyncHandler(
  async (req: TypedAuthRequest<unknown, IdParams>, res: Response, next: NextFunction) => {
    try {
      await CategorieService.delete(req.params.id);
      return sendSuccess(res, CATEGORIE.SUCCESS.DELETED, null);
    } catch (error) {
      next(error);
    }
  }
);
