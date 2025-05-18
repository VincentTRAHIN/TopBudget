import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import RevenuModel from "../models/revenu.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { IRevenuInput, TypeCompteRevenu } from "../types/revenu.types";
import { AUTH, REVENU, COMMON } from "../constants";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { importService } from "../services/ImportService";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';

const buildRevenuQuery = (req: AuthRequest): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  const {
    dateDebut,
    dateFin,
    typeCompte,
    search,
    categorieRevenu,
    estRecurrent,
  } = req.query;

  if (dateDebut) {
    if (!query.date) query.date = {} as { $gte?: Date; $lte?: Date };
    (query.date as { $gte?: Date; $lte?: Date }).$gte = new Date(
      dateDebut as string,
    );
  }
  if (dateFin) {
    if (!query.date) query.date = {} as { $gte?: Date; $lte?: Date };
    (query.date as { $gte?: Date; $lte?: Date }).$lte = new Date(
      dateFin as string,
    );
  }
  if (typeCompte) query.typeCompte = typeCompte as TypeCompteRevenu;
  if (categorieRevenu) query.categorieRevenu = categorieRevenu;
  if (typeof estRecurrent !== "undefined") {
    if (Array.isArray(estRecurrent)) {
      query.estRecurrent = estRecurrent[0] === "true";
    } else if (typeof estRecurrent === "string") {
      query.estRecurrent = estRecurrent === "true";
    } else {
      query.estRecurrent = Boolean(estRecurrent);
    }
  }

  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    query.$or = [{ description: searchRegex }, { commentaire: searchRegex }];
  }
  return query;
};

export const ajouterRevenu = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, errors.array());
    return;
  }

  if (!req.user) {
    next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));
    return;
  }

  const {
    montant,
    description,
    date,
    typeCompte,
    commentaire,
    categorieRevenu,
    estRecurrent,
  } = req.body;

  try {
    // Validation de la catégorie de revenu
    const categorie = await CategorieRevenuModel.findById(categorieRevenu);
    if (!categorie) {
      sendErrorClient(res, REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_NOT_FOUND);
      return;
    }
    const nouveauRevenu = new RevenuModel({
      montant,
      description,
      date: new Date(date as string),
      typeCompte,
      commentaire,
      utilisateur: req.user.id,
      categorieRevenu,
      estRecurrent: typeof estRecurrent === "undefined" ? false : estRecurrent,
    });

    await nouveauRevenu.save();
    const revenuPopule = await RevenuModel.findById(nouveauRevenu._id)
      .populate("utilisateur", "nom _id")
      .populate("categorieRevenu", "nom _id");

    sendSuccess(res, revenuPopule, 'Revenu créé', 201);
    return;
  } catch (error) {
    logger.error("Erreur lors de l'ajout du revenu:", error);
    next(new AppError(REVENU.ERROR_MESSAGES.SERVER_ERROR_ADD, 500));
    return;
  }
};

export const obtenirRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));
    return;
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { sortBy = "date", order = "desc", vue = "moi" } = req.query;

    const queryFilters = buildRevenuQuery(req);
    const userIdsToQuery: mongoose.Types.ObjectId[] = [];

    if (vue === "moi" && req.user.id) {
      userIdsToQuery.push(new mongoose.Types.ObjectId(req.user.id));
    } else if (vue === "partenaire") {
      const currentUser = await UserModel.findById(req.user.id).select(
        "partenaireId",
      );
      if (currentUser?.partenaireId) {
        const partenaireId =
          typeof currentUser.partenaireId === "string"
            ? new mongoose.Types.ObjectId(currentUser.partenaireId)
            : new mongoose.Types.ObjectId(currentUser.partenaireId.toString());
        userIdsToQuery.push(partenaireId);
      } else {
        sendSuccess(res, {
          revenus: [],
          pagination: { total: 0, page, limit, pages: 0 },
        });
        return;
      }
    } else if (vue === "couple_complet" && req.user.id) {
      userIdsToQuery.push(new mongoose.Types.ObjectId(req.user.id));
      const currentUser = await UserModel.findById(req.user.id).select(
        "partenaireId",
      );
      if (currentUser?.partenaireId) {
        const partenaireId =
          typeof currentUser.partenaireId === "string"
            ? new mongoose.Types.ObjectId(currentUser.partenaireId)
            : new mongoose.Types.ObjectId(currentUser.partenaireId.toString());
        userIdsToQuery.push(partenaireId);
      }
    }

    if (userIdsToQuery.length > 0) {
      queryFilters.utilisateur = { $in: userIdsToQuery };
    } else if (vue !== "moi") {
      sendSuccess(res, { revenus: [], pagination: { total: 0, page, limit, pages: 0 } });
      return;
    }

    const sortOptions: { [key: string]: "asc" | "desc" } = {};
    if (typeof sortBy === "string" && (order === "asc" || order === "desc")) {
      sortOptions[sortBy] = order;
    }

    const totalRevenus = await RevenuModel.countDocuments(queryFilters);
    const revenus = await RevenuModel.find(queryFilters)
      .populate("utilisateur", "nom _id")
      .populate("categorieRevenu", "nom _id")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      revenus,
      pagination: {
        total: totalRevenus,
        page,
        limit,
        pages: Math.ceil(totalRevenus / limit),
      },
    }, 'Liste des revenus');
    return;
  } catch (error) {
    logger.error("Erreur lors de la récupération des revenus:", error);
    next(
      new AppError(REVENU.ERROR_MESSAGES.SERVER_ERROR_GET_LIST, 500),
    );
    return;
  }
};

export const obtenirRevenuParId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED_USER, 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError(REVENU.ERROR_MESSAGES.INVALID_ID, 400));
    return;
  }

  try {
    const revenu = await RevenuModel.findById(id).populate(
      "utilisateur",
      "nom _id",
    );

    if (!revenu) {
      next(new AppError(REVENU.ERROR_MESSAGES.REVENU_NOT_FOUND, 404));
      return;
    }

    const utilisateurId = req.user.id.toString();
    const revenuUtilisateurId = (
      revenu.utilisateur as { _id: mongoose.Types.ObjectId }
    )._id.toString(); // _id car populé

    let hasAccess = utilisateurId === revenuUtilisateurId;

    if (!hasAccess) {
      const fullCurrentUser = await UserModel.findById(req.user.id).select(
        "partenaireId",
      );
      if (
        fullCurrentUser?.partenaireId &&
        fullCurrentUser.partenaireId.toString() === revenuUtilisateurId
      ) {
        hasAccess = true;
      }
    }
    if (!hasAccess) {
      next(new AppError(REVENU.ERROR_MESSAGES.ACCESS_DENIED, 403));
      return;
    }

    sendSuccess(res, revenu);
    return;
  } catch (error) {
    logger.error("Erreur lors de la récupération du revenu par ID:", error);
    next(
      new AppError(REVENU.ERROR_MESSAGES.SERVER_ERROR_GET_ONE, 500),
    );
    return;
  }
};

export const modifierRevenu = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, errors.array());
    return;
  }

  if (!req.user) {
    next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED_USER, 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError(REVENU.ERROR_MESSAGES.INVALID_ID, 400));
    return;
  }

  const updates = req.body as Partial<
    IRevenuInput & {
      description?: string;
      categorieRevenu?: string;
      estRecurrent?: boolean;
    }
  >;
  if (updates.date && typeof updates.date === "string") {
    updates.date = new Date(updates.date);
  }

  try {
    const revenu = await RevenuModel.findById(id);

    if (!revenu) {
      next(new AppError(REVENU.ERROR_MESSAGES.REVENU_NOT_FOUND, 404));
      return;
    }

    if (revenu.utilisateur.toString() !== req.user.id.toString()) {
      next(
        new AppError(
          REVENU.ERROR_MESSAGES.NOT_AUTHORIZED,
          403,
        ),
      );
      return;
    }

    // Si la catégorie change, valider qu'elle existe
    if (updates.categorieRevenu) {
      const categorie = await CategorieRevenuModel.findById(
        updates.categorieRevenu,
      );
      if (!categorie) {
        sendErrorClient(res, REVENU.ERROR_MESSAGES.CATEGORIE_REVENU_NOT_FOUND);
        return;
      }
    }

    Object.assign(revenu, updates);
    await revenu.save();
    const revenuPopule = await RevenuModel.findById(revenu._id)
      .populate("utilisateur", "nom _id")
      .populate("categorieRevenu", "nom _id");

    sendSuccess(res, revenuPopule, 'Revenu modifié');
    return;
  } catch (error) {
    logger.error("Erreur lors de la modification du revenu:", error);
    next(
      new AppError(REVENU.ERROR_MESSAGES.SERVER_ERROR_UPDATE, 500),
    );
    return;
  }
};

export const supprimerRevenu = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED_USER, 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError(REVENU.ERROR_MESSAGES.INVALID_ID, 400));
    return;
  }

  try {
    const revenu = await RevenuModel.findById(id);

    if (!revenu) {
      next(new AppError(REVENU.ERROR_MESSAGES.REVENU_NOT_FOUND, 404));
      return;
    }

    if (revenu.utilisateur.toString() !== req.user.id.toString()) {
      next(
        new AppError(
          REVENU.ERROR_MESSAGES.NOT_AUTHORIZED,
          403,
        ),
      );
      return;
    }

    await RevenuModel.findByIdAndDelete(id);
    sendSuccess(res, { message: "Revenu supprimé avec succès." });
    return;
  } catch (error) {
    logger.error("Erreur lors de la suppression du revenu:", error);
    next(new AppError(REVENU.ERROR_MESSAGES.SERVER_ERROR_DELETE, 500));
    return;
  }
};

// Importation CSV de revenus
export const importerRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.file) return next(new AppError(COMMON.ERROR_MESSAGES.NO_CSV_FILE, 400));
  if (!req.user)
    return next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));
  try {
    const result = await importService.importRevenusCsv(req.file.buffer, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
