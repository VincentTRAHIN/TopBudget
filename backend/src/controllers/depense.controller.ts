import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AppError } from "../middlewares/error.middleware";
import { AUTH, DEPENSE, COMMON } from "../constants";
import { ImportService } from "../services/import.service";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { 
  DepenseCreateBody, 
  DepenseUpdateBody, 
  DepenseQueryParams
} from '../types/typed-request';
import { createAsyncHandler } from '../utils/async.utils';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DepenseService } from "../services/depense.service";

/**
 * @swagger
 * /api/depenses:
 *   post:
 *     tags: [Dépenses]
 *     summary: Créer une nouvelle dépense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montant
 *               - date
 *               - typeCompte
 *               - typeDepense
 *               - categorie
 *             properties:
 *               montant:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               commentaire:
 *                 type: string
 *               typeCompte:
 *                 type: string
 *                 enum: [compte_courant, compte_epargne]
 *               typeDepense:
 *                 type: string
 *                 enum: [fixe, variable]
 *               recurrence:
 *                 type: object
 *               categorie:
 *                 type: string
 *               description:
 *                 type: string
 *               estChargeFixe:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Dépense créée avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Catégorie non trouvée
 */
export const ajouterDepense = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
    }

    try {
      const depense = await DepenseService.create(req.body as DepenseCreateBody, req.user.id);
      return sendSuccess(res, DEPENSE.SUCCESS.CREATED, depense, 201);
    } catch (error) {
      logger.error(DEPENSE.ERRORS.CREATE_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/depenses:
 *   get:
 *     tags: [Dépenses]
 *     summary: Obtenir la liste des dépenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Champ de tri
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre de tri
 *       - in: query
 *         name: vue
 *         schema:
 *           type: string
 *           enum: [moi, partenaire, couple_complet]
 *         description: Vue des dépenses
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *       - in: query
 *         name: typeCompte
 *         schema:
 *           type: string
 *           enum: [compte_courant, compte_epargne]
 *         description: Type de compte
 *       - in: query
 *         name: typeDepense
 *         schema:
 *           type: string
 *           enum: [fixe, variable]
 *         description: Type de dépense
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Liste des dépenses récupérée avec succès
 */
export const obtenirDepenses = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      const result = await DepenseService.getAll(req.query as DepenseQueryParams, req.user.id);
      return sendSuccess(res, DEPENSE.SUCCESS.FETCHED, result);
    } catch (error) {
      logger.error(DEPENSE.ERRORS.FETCH_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/depenses/{id}:
 *   get:
 *     tags: [Dépenses]
 *     summary: Obtenir une dépense par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     responses:
 *       200:
 *         description: Dépense récupérée avec succès
 *       404:
 *         description: Dépense non trouvée
 *       403:
 *         description: Accès non autorisé
 */
export const obtenirDepenseParId = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      const depense = await DepenseService.getById(req.params.id, req.user.id);
      return sendSuccess(res, DEPENSE.SUCCESS.FETCHED, depense);
    } catch (error) {
      logger.error(DEPENSE.ERRORS.FETCH_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/depenses/{id}:
 *   put:
 *     tags: [Dépenses]
 *     summary: Modifier une dépense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               montant:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               commentaire:
 *                 type: string
 *               typeCompte:
 *                 type: string
 *                 enum: [compte_courant, compte_epargne]
 *               typeDepense:
 *                 type: string
 *                 enum: [fixe, variable]
 *               recurrence:
 *                 type: object
 *               categorie:
 *                 type: string
 *               description:
 *                 type: string
 *               estChargeFixe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Dépense modifiée avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Dépense ou catégorie non trouvée
 */
export const modifierDepense = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(res, COMMON.ERRORS.VALIDATION_ERROR, errors.array());
    }

    try {
      const depense = await DepenseService.update(req.params.id, req.body as DepenseUpdateBody, req.user.id);
      return sendSuccess(res, DEPENSE.SUCCESS.UPDATED, depense);
    } catch (error) {
      logger.error(DEPENSE.ERRORS.UPDATE_ERROR, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/depenses/{id}:
 *   delete:
 *     tags: [Dépenses]
 *     summary: Supprimer une dépense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     responses:
 *       200:
 *         description: Dépense supprimée avec succès
 *       404:
 *         description: Dépense non trouvée
 */
export const supprimerDepense = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      await DepenseService.delete(req.params.id, req.user.id);
      return sendSuccess(res, DEPENSE.SUCCESS.DELETED);
    } catch (error) {
      logger.error(DEPENSE.ERRORS.DELETE_ERROR, error);
      next(error);
    }
  }
);

// Import avec Multer qui ajoute req.file
interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const importerDepenses = createAsyncHandler(
  async (req: MulterRequest, res, next): Promise<void> => {
    if (!req.file) return next(new AppError(COMMON.ERRORS.NO_CSV_FILE, 400));
    if (!req.user)
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    try {
      const result = await ImportService.importDepensesCsv(req.file.buffer, req.user.id);
      sendSuccess(res, DEPENSE.SUCCESS.IMPORTED, result);
    } catch (error) {
      next(error);
    }
  }
);
