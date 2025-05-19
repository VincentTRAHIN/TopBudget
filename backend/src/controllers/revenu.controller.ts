import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AppError } from "../middlewares/error.middleware";
import { AUTH, REVENU, COMMON } from "../constants";
import { ImportService } from "../services/import.service";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { 
  RevenuCreateBody, 
  RevenuUpdateBody, 
  RevenuQueryParams
} from '../types/typed-request';
import { createAsyncHandler } from '../utils/async.utils';
import { AuthRequest } from '../middlewares/auth.middleware';
import { RevenuService } from '../services/revenu.service';

/**
 * @swagger
 * /api/revenus:
 *   post:
 *     tags: [Revenus]
 *     summary: Créer un nouveau revenu
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
 *               - categorieRevenu
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
 *               recurrence:
 *                 type: object
 *               categorieRevenu:
 *                 type: string
 *               description:
 *                 type: string
 *               estRecurrent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Revenu créé avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Catégorie de revenu non trouvée
 */
export const ajouterRevenu = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(res, "Erreur de validation", errors.array());
    }

    try {
      const revenu = await RevenuService.create(req.body as RevenuCreateBody, req.user.id);
      return sendSuccess(res, "Revenu créé avec succès", revenu, 201);
    } catch (error) {
      logger.error("Erreur lors de la création du revenu:", error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/revenus:
 *   get:
 *     tags: [Revenus]
 *     summary: Obtenir la liste des revenus
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
 *         description: Vue des revenus
 *       - in: query
 *         name: categorieRevenu
 *         schema:
 *           type: string
 *         description: ID de la catégorie de revenu
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
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtre sur les revenus récurrents
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Liste des revenus récupérée avec succès
 */
export const obtenirRevenus = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      const result = await RevenuService.getAll(req.query as RevenuQueryParams, req.user.id);
      return sendSuccess(res, "Liste des revenus récupérée avec succès", result);
    } catch (error) {
      logger.error("Erreur lors de la récupération des revenus:", error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/revenus/{id}:
 *   get:
 *     tags: [Revenus]
 *     summary: Obtenir un revenu par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du revenu
 *     responses:
 *       200:
 *         description: Revenu récupéré avec succès
 *       404:
 *         description: Revenu non trouvé
 *       403:
 *         description: Accès non autorisé
 */
export const obtenirRevenuParId = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      const revenu = await RevenuService.getById(req.params.id, req.user.id);
      return sendSuccess(res, "Revenu récupéré avec succès", revenu);
    } catch (error) {
      logger.error("Erreur lors de la récupération du revenu:", error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/revenus/{id}:
 *   put:
 *     tags: [Revenus]
 *     summary: Modifier un revenu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du revenu
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
 *               recurrence:
 *                 type: object
 *               categorieRevenu:
 *                 type: string
 *               description:
 *                 type: string
 *               estRecurrent:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Revenu modifié avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Revenu ou catégorie non trouvé
 */
export const modifierRevenu = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(res, "Erreur de validation", errors.array());
    }

    try {
      const revenu = await RevenuService.update(req.params.id, req.body as RevenuUpdateBody, req.user.id);
      return sendSuccess(res, "Revenu modifié avec succès", revenu);
    } catch (error) {
      logger.error("Erreur lors de la modification du revenu:", error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/revenus/{id}:
 *   delete:
 *     tags: [Revenus]
 *     summary: Supprimer un revenu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du revenu
 *     responses:
 *       200:
 *         description: Revenu supprimé avec succès
 *       404:
 *         description: Revenu non trouvé
 */
export const supprimerRevenu = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    }

    try {
      await RevenuService.delete(req.params.id, req.user.id);
      return sendSuccess(res, "Revenu supprimé avec succès");
    } catch (error) {
      logger.error("Erreur lors de la suppression du revenu:", error);
      next(error);
    }
  }
);

// Import avec Multer qui ajoute req.file
interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const importerRevenus = createAsyncHandler(
  async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) return next(new AppError(COMMON.ERRORS.NO_CSV_FILE, 400));
    if (!req.user) return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    
    try {
      const result = await ImportService.importRevenusCsv(req.file.buffer, req.user.id);
      sendSuccess(res, REVENU.SUCCESS.IMPORTED, result);
    } catch (error) {
      next(error);
    }
  }
);
