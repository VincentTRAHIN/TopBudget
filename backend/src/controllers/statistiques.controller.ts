import { Response, NextFunction } from "express";
import DepenseModel from "../models/depense.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { AUTH, STATISTIQUES } from "../constants";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import User from "../models/user.model";
import { IUser } from "../types/user.types";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
import { getUserIdsFromContext } from "../utils/utilisateur.utils";
import { createAsyncHandler } from "../utils/async.utils";
import mongoose from "mongoose";
import RevenuModel from "../models/revenu.model";
import { validationResult } from "express-validator";
import { StatistiquesService } from "../services/statistiques.service";

type UserIdsType =
  | mongoose.Types.ObjectId
  | { $in: ReadonlyArray<mongoose.Types.ObjectId> };

/**
 * @swagger
 * /api/statistiques/flux-mensuel:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir le total des flux mensuels
 *     description: Récupère le total des dépenses ou revenus pour une période donnée
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depense, revenu]
 *         required: true
 *         description: Type de flux à analyser
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Total des flux mensuels récupéré avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getTotalFluxMensuel = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const { type, dateDebut, dateFin } = req.query;

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userIds = userComplete.partenaireId
      ? ({ $in: [userComplete._id, userComplete.partenaireId] } as UserIdsType)
      : (userComplete._id as UserIdsType);

    const result = await StatistiquesService.getTotalFluxMensuel(
      userIds,
      new Date(dateDebut as string),
      new Date(dateFin as string),
      type as "depense" | "revenu",
      type === "depense" ? DepenseModel : RevenuModel,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.FLUX_MENSUEL, result);
  },
);

/**
 * @swagger
 * /api/statistiques/repartition-categorie:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir la répartition par catégorie
 *     description: Récupère la répartition des dépenses ou revenus par catégorie
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depense, revenu]
 *         required: true
 *         description: Type de flux à analyser
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Répartition par catégorie récupérée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getRepartitionParCategorie = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const { type, dateDebut, dateFin } = req.query;

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userIds = userComplete.partenaireId
      ? ({ $in: [userComplete._id, userComplete.partenaireId] } as UserIdsType)
      : (userComplete._id as UserIdsType);

    const result = await StatistiquesService.getRepartitionParCategorie(
      userIds,
      new Date(dateDebut as string),
      new Date(dateFin as string),
      type as "depense" | "revenu",
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.REPARTITION_CATEGORIE, result);
  },
);

/**
 * @swagger
 * /api/statistiques/evolution-flux:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir l'évolution des flux mensuels
 *     description: Récupère l'évolution des dépenses, revenus ou soldes sur plusieurs mois
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depenses, revenus, solde]
 *         required: true
 *         description: Type de flux à analyser
 *       - in: query
 *         name: nbMois
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         required: true
 *         description: Nombre de mois à analyser
 *       - in: query
 *         name: dateReference
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de référence pour le calcul
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer sur les flux récurrents uniquement
 *     responses:
 *       200:
 *         description: Évolution des flux mensuels récupérée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getEvolutionFluxMensuels = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const { type, nbMois, dateReference, estRecurrent } = req.query;

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userIds = userComplete.partenaireId
      ? ({ $in: [userComplete._id, userComplete.partenaireId] } as UserIdsType)
      : (userComplete._id as UserIdsType);

    const result = await StatistiquesService.getEvolutionFluxMensuels(
      userIds,
      parseInt(nbMois as string),
      new Date(dateReference as string),
      type as "depenses" | "revenus" | "solde",
      { estRecurrent: estRecurrent === "true" },
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_SOLDES, result);
  },
);

/**
 * @swagger
 * /api/statistiques/solde-periode:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir le solde pour une période
 *     description: Récupère le solde (revenus - dépenses) pour une période donnée
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Solde pour la période récupéré avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getSoldePourPeriode = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const { dateDebut, dateFin } = req.query;

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userIds = userComplete.partenaireId
      ? ({ $in: [userComplete._id, userComplete.partenaireId] } as UserIdsType)
      : (userComplete._id as UserIdsType);

    const result = await StatistiquesService.getSoldePourPeriode(
      userIds,
      new Date(dateDebut as string),
      new Date(dateFin as string),
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.SOLDE_MENSUEL, result);
  },
);

/**
 * @swagger
 * /api/statistiques/comparaison-mois:
 *   get:
 *     tags: [Statistiques]
 *     summary: Comparer deux mois
 *     description: Compare les dépenses, revenus ou soldes entre deux mois
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depenses, revenus, solde]
 *         required: true
 *         description: Type de flux à comparer
 *       - in: query
 *         name: dateActuelle
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date du mois actuel
 *       - in: query
 *         name: datePrecedente
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date du mois précédent
 *     responses:
 *       200:
 *         description: Comparaison des mois récupérée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getComparaisonMois = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const { type, dateActuelle, datePrecedente } = req.query;

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userIds = userComplete.partenaireId
      ? ({ $in: [userComplete._id, userComplete.partenaireId] } as UserIdsType)
      : (userComplete._id as UserIdsType);

    const result = await StatistiquesService.getComparaisonMois(
      userIds,
      new Date(dateActuelle as string),
      new Date(datePrecedente as string),
      type as "depenses" | "revenus" | "solde",
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.COMPARAISON_MOIS, result);
  },
);

/**
 * @swagger
 * /api/statistiques/contributions-couple:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir les contributions du couple
 *     description: Récupère la répartition des dépenses entre les deux partenaires
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Contributions du couple récupérées avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getContributionsCouple = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    if (!userComplete.partenaireId) {
      return next(new AppError(STATISTIQUES.ERRORS.NO_PARTNER, 400));
    }

    const { dateDebut, dateFin } = req.query;

    const result = await StatistiquesService.getContributionsCouple(
      userComplete._id.toString(),
      userComplete.partenaireId.toString(),
      new Date(dateDebut as string),
      new Date(dateFin as string),
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.CONTRIBUTIONS_COUPLE, result);
  },
);

/**
 * @swagger
 * /api/statistiques/charges-fixes-couple:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir les charges fixes du couple
 *     description: Récupère la répartition des charges fixes entre les deux partenaires
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Charges fixes du couple récupérées avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getChargesFixesCouple = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    if (!userComplete.partenaireId) {
      return next(new AppError(STATISTIQUES.ERRORS.NO_PARTNER, 400));
    }

    const { dateDebut, dateFin } = req.query;

    const result = await StatistiquesService.getChargesFixesCouple(
      userComplete._id.toString(),
      userComplete.partenaireId.toString(),
      new Date(dateDebut as string),
      new Date(dateFin as string),
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.CHARGES_FIXES, result);
  },
);

/**
 * @swagger
 * /api/statistiques/synthese-mensuelle-couple:
 *   get:
 *     tags: [Statistiques]
 *     summary: Obtenir la synthèse mensuelle du couple
 *     description: Récupère une synthèse complète des dépenses et revenus du couple
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de début de la période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Synthèse mensuelle du couple récupérée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
export const getSyntheseMensuelleCouple = createAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorClient(
        res,
        STATISTIQUES.ERRORS.VALIDATION_ERROR,
        errors.array(),
      );
    }

    if (!req.user) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    const userComplete = (await User.findById(req.user.id)) as {
      _id: mongoose.Types.ObjectId;
      partenaireId?: mongoose.Types.ObjectId;
    };
    if (!userComplete) {
      return next(new AppError(STATISTIQUES.ERRORS.UNAUTHORIZED, 401));
    }

    if (!userComplete.partenaireId) {
      return next(new AppError(STATISTIQUES.ERRORS.NO_PARTNER, 400));
    }

    const { dateDebut, dateFin } = req.query;

    const result = await StatistiquesService.getSyntheseMensuelleCouple(
      userComplete._id.toString(),
      userComplete.partenaireId.toString(),
      new Date(dateDebut as string),
      new Date(dateFin as string),
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.SYNTHESE_MENSUELLE, result);
  },
);

export const totalDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getTotalFluxMensuel(
      userIds as UserIdsType,
      dateDebut,
      dateFin,
      "depense",
      DepenseModel,
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.DEPENSES_MENSUELLES, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération des dépenses mensuelles:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.DEPENSES_MENSUELLES, 500));
  }
};

export const repartitionDepensesParCategorie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getRepartitionParCategorie(
      userIds as UserIdsType,
      dateDebut,
      dateFin,
      "depense",
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.REPARTITION_CATEGORIE, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de la répartition des dépenses:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.REPARTITION_CATEGORIE, 500));
  }
};

export const evolutionDepenses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateReference = new Date();
    const result = await StatistiquesService.getEvolutionFluxMensuels(
      userIds as UserIdsType,
      12,
      dateReference,
      "depenses",
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_DEPENSES, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de l'évolution des dépenses:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_DEPENSES, 500));
  }
};

export const evolutionRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateReference = new Date();
    const result = await StatistiquesService.getEvolutionFluxMensuels(
      userIds as UserIdsType,
      12,
      dateReference,
      "revenus",
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_REVENUS, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de l'évolution des revenus:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_REVENUS, 500));
  }
};

export const evolutionSolde = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateReference = new Date();
    const result = await StatistiquesService.getEvolutionFluxMensuels(
      userIds as UserIdsType,
      12,
      dateReference,
      "solde",
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_SOLDES, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de l'évolution du solde:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_SOLDES, 500));
  }
};

export const evolutionDepensesRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getSoldePourPeriode(
      userIds as UserIdsType,
      dateDebut,
      dateFin,
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.SOLDE_MENSUEL, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de l'évolution des dépenses et revenus:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.SOLDE_MENSUEL, 500));
  }
};

export const comparaisonMoisPrecedent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds } = userContext;
    const dateActuelle = new Date();
    const datePrecedente = new Date();
    datePrecedente.setMonth(datePrecedente.getMonth() - 1);

    const result = await StatistiquesService.getComparaisonMois(
      userIds as UserIdsType,
      dateActuelle,
      datePrecedente,
      "solde",
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.COMPARAISON_MOIS, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de la comparaison avec le mois précédent:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.COMPARAISON_MOIS, 500));
  }
};

export const repartitionDepensesCouple = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds, utilisateurFilter } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getContributionsCouple(
      userIds.toString(),
      utilisateurFilter.toString(),
      dateDebut,
      dateFin,
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.CONTRIBUTIONS_COUPLE, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de la répartition des dépenses du couple:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.CONTRIBUTIONS_COUPLE, 500));
  }
};

export const repartitionChargesCouple = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds, utilisateurFilter } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getChargesFixesCouple(
      userIds.toString(),
      utilisateurFilter.toString(),
      dateDebut,
      dateFin,
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.CHARGES_FIXES, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de la répartition des charges du couple:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.CHARGES_FIXES, 500));
  }
};

export const repartitionDepensesRevenusCouple = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userContext = await getUserIdsFromContext(req, res);
    if (!userContext) return;

    const { userIds, utilisateurFilter } = userContext;
    const dateDebut = new Date();
    dateDebut.setDate(1);
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);
    dateFin.setDate(0);

    const result = await StatistiquesService.getSyntheseMensuelleCouple(
      userIds.toString(),
      utilisateurFilter.toString(),
      dateDebut,
      dateFin,
    );
    sendSuccess(res, STATISTIQUES.SUCCESS.SYNTHESE_MENSUELLE, result);
  } catch (error: unknown) {
    logger.error(
      "Erreur lors de la récupération de la répartition des dépenses et revenus du couple:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.SYNTHESE_MENSUELLE, 500));
  }
};

export const repartitionParCategorie = createAsyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const { mois, annee, contexte } = req.query;

    if (!mois || !annee) {
      sendErrorClient(res, "Les paramètres mois et année sont requis");
      return;
    }

    const dateDebut = new Date(`${annee}-${mois}-01`);
    const dateFin = new Date(`${annee}-${mois}-31`);

    const userContext = await getUserIdsFromContext(
      req,
      res,
      contexte as string | undefined,
    );
    if (!userContext) {
      return;
    }

    const repartition = await StatistiquesService.getRepartitionParCategorie(
      userContext.userIds,
      dateDebut,
      dateFin,
      "depense",
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.REPARTITION_CATEGORIE, repartition);
  },
);

export const repartitionRevenusParCategorie = createAsyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    logger.info("[TEST LOG] Entrée dans repartitionRevenusParCategorie");
    logger.debug("[ctrl.repartitionRevenusParCategorie] req.query reçu:", req.query);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("[ctrl.repartitionRevenusParCategorie] Erreurs de validation", { errors: errors.array(), query: req.query });
      sendErrorClient(res, STATISTIQUES.ERRORS.VALIDATION_ERROR, errors.array());
      return;
    }

    if (!req.user) {
      logger.warn("[ctrl.repartitionRevenusParCategorie] Utilisateur non authentifié tenté d'accéder");
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    logger.debug('[ctrl.repartitionRevenusParCategorie] Requête reçue', { query: req.query, userId: req.user.id });

    const { mois: moisQuery, annee: anneeQuery, contexte } = req.query;
    logger.debug("[ctrl.repartitionRevenusParCategorie] Paramètres extraits:", { moisQuery, anneeQuery, contexte });

    if (!moisQuery || !anneeQuery) {
        logger.warn("[ctrl.repartitionRevenusParCategorie] Paramètres mois ou année manquants", { query: req.query });
        sendErrorClient(res, "Les paramètres mois et année sont requis");
        return;
    }

    const moisNum = parseInt(moisQuery as string, 10);
    const anneeNum = parseInt(anneeQuery as string, 10);

    if (isNaN(moisNum) || isNaN(anneeNum) || moisNum < 1 || moisNum > 12) {
        logger.warn("[ctrl.repartitionRevenusParCategorie] Paramètres mois ou année invalides", { moisQuery, anneeQuery });
        sendErrorClient(res, "Les paramètres mois et année doivent être des nombres valides (mois entre 1 et 12).");
        return;
    }

    const dateDebutMois = new Date(anneeNum, moisNum - 1, 1);
    const dateFinMois = new Date(anneeNum, moisNum, 0, 23, 59, 59, 999);
    logger.debug("[ctrl.repartitionRevenusParCategorie] Période de calcul:", { dateDebutMois: dateDebutMois.toISOString(), dateFinMois: dateFinMois.toISOString() });

    const userContextResult = await getUserIdsFromContext(req, res, contexte as string | undefined);
    if (userContextResult) {
      logger.debug("[ctrl.repartitionRevenusParCategorie] userIds obtenus de getUserIdsFromContext:", userContextResult.userIds);
    } else {
      logger.warn("[ctrl.repartitionRevenusParCategorie] userContextResult est null ou undefined après appel à getUserIdsFromContext");
    }

    logger.debug('[ctrl.repartitionRevenusParCategorie] Contexte utilisateur déterminé', { userContextResult, originalContext: contexte });

    if (!userContextResult) {
      logger.warn("[ctrl.repartitionRevenusParCategorie] Contexte utilisateur non résolu", { userId: req.user.id, contexte });
      sendErrorClient(res, STATISTIQUES.ERRORS.VALIDATION_ERROR, "Contexte utilisateur non valide ou paramètres invalides");
      return;
    }

    const repartition = await StatistiquesService.getRepartitionRevenusParCategorie(
      userContextResult.userIds,
      dateDebutMois,
      dateFinMois,
    );
    logger.debug("[ctrl.repartitionRevenusParCategorie] Résultat obtenu de StatistiquesService.getRepartitionRevenusParCategorie:", repartition);
    logger.debug('[ctrl.repartitionRevenusParCategorie] Répartition obtenue du service', { nombreCategories: repartition.length });

    sendSuccess(res, STATISTIQUES.SUCCESS.REPARTITION_CATEGORIE, repartition);
  },
);

export const getSoldeMensuel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const {
      mois: moisQuery,
      annee: anneeQuery,
      contexte,
    } = req.query as { mois?: string; annee?: string; contexte?: string };

    logger.info("Début getSoldeMensuel - Query params:", {
      moisQuery,
      anneeQuery,
      contexte,
    });

    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    logger.info("Dates calculées pour le mois:", {
      dateDebutMois: dateDebutMois.toISOString(),
      dateFinMois: dateFinMois.toISOString(),
    });

    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      logger.warn("Contexte utilisateur non résolu dans getSoldeMensuel");
      return;
    }
    logger.info("User context résolu:", { userIds: userContext.userIds });

    const resultatSolde = await StatistiquesService.getSoldePourPeriode(
      userContext.userIds,
      dateDebutMois,
      dateFinMois,
    );
    logger.info(
      "Résultat de StatistiquesService.getSoldePourPeriode:",
      resultatSolde,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.SOLDE_MENSUEL, {
      mois: format(dateDebutMois, "yyyy-MM"),
      ...resultatSolde,
    });
  } catch (error) {
    logger.error("Erreur lors du calcul du solde mensuel:", error);
    next(new AppError(STATISTIQUES.ERRORS.SOLDE_MENSUEL, 500));
  }
};

export const comparaisonMois = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const { contexte, type = "depenses" } = req.query as {
      contexte?: string;
      type?: "depenses" | "revenus" | "solde";
    };

    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }

    let dateQueryActuelle: Date;
    let dateQueryPrecedente: Date;
    const {
      moisActuel: moisActuelQuery,
      anneeActuelle: anneeActuelleQuery,
      moisPrecedent: moisPrecedentQuery,
      anneePrecedente: anneePrecedenteQuery,
    } = req.query;

    if (
      moisActuelQuery &&
      anneeActuelleQuery &&
      moisPrecedentQuery &&
      anneePrecedenteQuery
    ) {
      const mA = parseInt(moisActuelQuery as string, 10);
      const aA = parseInt(anneeActuelleQuery as string, 10);
      const mP = parseInt(moisPrecedentQuery as string, 10);
      const aP = parseInt(anneePrecedenteQuery as string, 10);
      dateQueryActuelle = new Date(aA, mA - 1, 1);
      dateQueryPrecedente = new Date(aP, mP - 1, 1);
    } else {
      dateQueryActuelle = new Date();
      dateQueryPrecedente = subMonths(dateQueryActuelle, 1);
    }

    const result = StatistiquesService.getComparaisonMois(
      userContext.userIds,
      dateQueryActuelle,
      dateQueryPrecedente,
      type,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.COMPARAISON_MOIS, result);
  } catch (error) {
    logger.error("Erreur lors de la comparaison des mois:", error);
    next(new AppError(STATISTIQUES.ERRORS.COMPARAISON_MOIS, 500));
  }
};

export const getEvolutionDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const nbMoisQuery = req.query.nbMois as string | undefined;
    let nbMois = 6;
    const { contexte, dataType } = req.query;

    const fluxType =
      (dataType as string) === "revenus" || (dataType as string) === "solde"
        ? (dataType as "depenses" | "revenus" | "solde")
        : "depenses";

    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        sendErrorClient(
          res,
          "Le paramètre nbMois doit être un nombre entre 1 et 24.",
        );
        return;
      }
    }

    const userContext = await getUserIdsFromContext(
      req,
      res,
      contexte as string | undefined,
    );
    if (!userContext) {
      return;
    }

    const dateActuelle = new Date();

    const options: { estRecurrent?: boolean } = {};
    if (req.query.estRecurrent !== undefined) {
      options.estRecurrent = req.query.estRecurrent === "true";
    }

    const evolution = await StatistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      fluxType,
      options,
    );

    const formattedEvolution = evolution.map((item) => {
      const totalRevenus =
        typeof item.totalRevenus === "number" ? item.totalRevenus : 0;
      const totalDepenses =
        typeof item.totalDepenses === "number" ? item.totalDepenses : 0;
      const soldeMensuel =
        typeof item.solde === "number"
          ? item.solde
          : totalRevenus - totalDepenses;

      return {
        mois: `${item.annee}-${String(item.mois).padStart(2, "0")}`,
        totalDepenses,
        totalRevenus,
        soldeMensuel,
      };
    });

    let successMessage;
    switch (fluxType) {
      case "revenus":
        successMessage = STATISTIQUES.SUCCESS.EVOLUTION_REVENUS;
        break;
      case "solde":
        successMessage = STATISTIQUES.SUCCESS.EVOLUTION_SOLDES;
        break;
      default:
        successMessage = STATISTIQUES.SUCCESS.EVOLUTION_DEPENSES;
    }

    sendSuccess(res, successMessage, formattedEvolution);
  } catch (error) {
    logger.error(
      `Erreur lors du calcul de l'évolution des flux mensuels (${req.query.dataType}):`,
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_DEPENSES, 500));
  }
};

export const getEvolutionRevenusMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const {
      nbMois: nbMoisQuery,
      contexte,
      estRecurrent,
    } = req.query as {
      nbMois?: string;
      contexte?: string;
      estRecurrent?: string;
    };
    let nbMois = 6;

    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        sendErrorClient(
          res,
          "Le paramètre nbMois doit être un nombre entre 1 et 24.",
        );
        return;
      }
    }

    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }

    const dateActuelle = new Date();
    const options: { estRecurrent?: boolean } = {};

    if (typeof estRecurrent !== "undefined") {
      options.estRecurrent = estRecurrent === "true";
    }

    const evolution = await StatistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      "revenus",
      options,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_REVENUS, evolution);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de l'évolution des revenus mensuels:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_REVENUS, 500));
  }
};

export const getEvolutionSoldesMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const { nbMois: nbMoisQuery, contexte } = req.query as {
      nbMois?: string;
      contexte?: string;
    };
    let nbMois = 6;

    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        sendErrorClient(
          res,
          "Le paramètre nbMois doit être un nombre entre 1 et 24.",
        );
        return;
      }
    }

    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }

    const dateActuelle = new Date();
    const evolution = await StatistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      "solde",
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.EVOLUTION_SOLDES, evolution);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de l'évolution des soldes mensuels:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.EVOLUTION_SOLDES, 500));
  }
};

export const getCoupleContributionsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const fullCurrentUser = await User.findById(req.user.id).populate<{
      partenaireId: IUser;
    }>("partenaireId");
    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      sendErrorClient(
        res,
        "Partenaire non défini pour l'utilisateur ou non trouvé.",
      );
      return;
    }

    const { mois: moisQuery, annee: anneeQuery } = req.query as {
      mois?: string;
      annee?: string;
    };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const userId = String(req.user.id);
    const partenaireId = String(fullCurrentUser.partenaireId._id);

    const result = await StatistiquesService.getContributionsCouple(
      userId,
      partenaireId,
      dateDebutMois,
      dateFinMois,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.CONTRIBUTIONS_COUPLE, result);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul du résumé des contributions du couple:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.CONTRIBUTIONS_COUPLE, 500));
  }
};

export const getCoupleFixedCharges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const fullCurrentUser = await User.findById(req.user.id);
    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      sendErrorClient(res, "Partenaire non défini pour l'utilisateur.");
      return;
    }

    const { mois: moisQuery, annee: anneeQuery } = req.query as {
      mois?: string;
      annee?: string;
    };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const userId = String(req.user.id);
    const partenaireId = String(fullCurrentUser.partenaireId);

    const result = await StatistiquesService.getChargesFixesCouple(
      userId,
      partenaireId,
      dateDebutMois,
      dateFinMois,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.CHARGES_FIXES, result);
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération des charges fixes du couple:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.CHARGES_FIXES, 500));
  }
};

export const getSyntheseMensuelle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
      return;
    }

    const {
      mois: moisQuery,
      annee: anneeQuery,
      contexte,
    } = req.query as { mois?: string; annee?: string; contexte?: string };

    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    let partenaireId = "";
    if (contexte === "couple") {
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        partenaireId = String(fullCurrentUser.partenaireId);
      }
    }

    const result = await StatistiquesService.getSyntheseMensuelleCouple(
      String(req.user.id),
      partenaireId,
      dateDebutMois,
      dateFinMois,
    );

    sendSuccess(res, STATISTIQUES.SUCCESS.SYNTHESE_MENSUELLE, result);
  } catch (error) {
    logger.error(
      "Erreur lors de la génération de la synthèse mensuelle:",
      error,
    );
    next(new AppError(STATISTIQUES.ERRORS.SYNTHESE_MENSUELLE, 500));
  }
};
