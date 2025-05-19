import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { CATEGORIE_REVENU, COMMON } from "../constants";
import { CategorieRevenuCreateBody, CategorieRevenuUpdateBody, IdParams } from '../types/typed-request';
import { createAsyncHandler } from '../utils/async.utils';
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { CategorieRevenuService } from '../services/categorieRevenu.service';

/**
 * @swagger
 * /api/categories-revenu:
 *   post:
 *     tags: [Categories Revenu]
 *     summary: Créer une nouvelle catégorie de revenu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieRevenuInput'
 *     responses:
 *       201:
 *         description: Catégorie de revenu créée avec succès
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
 *                   $ref: '#/components/schemas/CategorieRevenu'
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Nom de catégorie déjà utilisé
 */
export const ajouterCategorieRevenu = createAsyncHandler<CategorieRevenuCreateBody>(
  async (req, res, next): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
      return;
    }

    try {
      const categorieRevenu = await CategorieRevenuService.create(req.body, req.user!.id);
      sendSuccess(res, CATEGORIE_REVENU.SUCCESS.CREATED, categorieRevenu, 201);
    } catch (error) {
      logger.error(CATEGORIE_REVENU.ERRORS.CREATE_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories-revenu:
 *   get:
 *     tags: [Categories Revenu]
 *     summary: Obtenir la liste des catégories de revenu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des catégories de revenu récupérée avec succès
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategorieRevenu'
 */
export const obtenirCategoriesRevenu = createAsyncHandler(
  async (req, res, next): Promise<void> => {
    try {
      const categoriesRevenu = await CategorieRevenuService.getAll(req.user!.id);
      sendSuccess(res, CATEGORIE_REVENU.SUCCESS.FETCHED, categoriesRevenu);
    } catch (error) {
      logger.error(CATEGORIE_REVENU.ERRORS.FETCH_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories-revenu/{id}:
 *   put:
 *     tags: [Categories Revenu]
 *     summary: Modifier une catégorie de revenu existante
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieRevenuInput'
 *     responses:
 *       200:
 *         description: Catégorie de revenu modifiée avec succès
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
 *                   $ref: '#/components/schemas/CategorieRevenu'
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Catégorie non trouvée
 *       409:
 *         description: Nom de catégorie déjà utilisé
 */
export const modifierCategorieRevenu = createAsyncHandler<CategorieRevenuUpdateBody, IdParams>(
  async (req, res, next): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
      return;
    }

    try {
      const categorieRevenu = await CategorieRevenuService.update(req.params.id, req.body, req.user!.id);
      sendSuccess(res, CATEGORIE_REVENU.SUCCESS.UPDATED, categorieRevenu);
    } catch (error) {
      logger.error(CATEGORIE_REVENU.ERRORS.UPDATE_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories-revenu/{id}:
 *   delete:
 *     tags: [Categories Revenu]
 *     summary: Supprimer une catégorie de revenu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catégorie de revenu supprimée avec succès
 *       404:
 *         description: Catégorie non trouvée
 */
export const supprimerCategorieRevenu = createAsyncHandler<Record<string, never>, IdParams>(
  async (req, res, next): Promise<void> => {
    try {
      await CategorieRevenuService.delete(req.params.id, req.user!.id);
      sendSuccess(res, CATEGORIE_REVENU.SUCCESS.DELETED);
    } catch (error) {
      logger.error(CATEGORIE_REVENU.ERRORS.DELETE_ERROR, error);
      next(error);
    }
  }
);
