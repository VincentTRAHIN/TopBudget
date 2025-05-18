
import Depense from "../models/depense.model";
import Categorie from "../models/categorie.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { DEPENSE, AUTH, CATEGORIE, COMMON } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";
import { TypeCompte, TypeDepense, IDepensePopulated } from "../types/depense.types";
import { ICategorie } from "../types/categorie.types";
import { IUser } from "../types/user.types";
import { importService } from "../services/ImportService";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { IdParams, TypedAuthRequest, DepenseRequest } from '../types/typed-request';
import { createAsyncHandler } from '../utils/async.utils';

export const ajouterDepense = createAsyncHandler<DepenseRequest.CreateBody>(
  async (req, res): Promise<void> => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
      sendErrorClient(res, COMMON.ERROR_MESSAGES.VALIDATION_ERROR, 400, erreurs.array());
      return;
    }

    try {
      const {
        montant,
        date,
        commentaire,
        typeCompte,
        typeDepense,
        recurrence,
        categorie,
        description,
        estChargeFixe = false,
      } = req.body;

      // Validation du montant
      if (
        montant < DEPENSE.VALIDATION.MIN_MONTANT ||
        montant > DEPENSE.VALIDATION.MAX_MONTANT
      ) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.INVALID_MONTANT);
        return;
      }

      // Validation du type de compte
      if (!Object.values(DEPENSE.TYPES_COMPTE).includes(typeCompte)) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE);
        return;
      }

      // Validation du type de dépense
      if (!Object.values(DEPENSE.TYPES_DEPENSE).includes(typeDepense)) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.INVALID_TYPE_DEPENSE);
        return;
      }

      const categorieExistante = await Categorie.findById(categorie);
      if (!categorieExistante) {
        sendErrorClient(res, CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND);
        return;
      }

      const nouvelleDepense = await Depense.create({
        montant,
        date,
        commentaire,
        typeCompte,
        typeDepense,
        recurrence,
        categorie,
        description,
        utilisateur: req.user ? req.user.id : null,
        estChargeFixe,
      });

      const populatedDepense = await Depense.findById(nouvelleDepense._id)
        .populate<{ categorie: IDepensePopulated['categorie'] }>("categorie", "nom description image")
        .lean<IDepensePopulated>();
      sendSuccess(res, populatedDepense, 'Dépense créée', 201);
    } catch (error) {
      logger.error(error);
      sendErrorClient(res, DEPENSE.ERROR_MESSAGES.SERVER_ERROR_ADD, 500);
    }
  }
);

export const obtenirDepenses = createAsyncHandler<Record<string, never>, Record<string, never>, DepenseRequest.QueryParams>(
  async (req, res): Promise<void> => {
    try {
      if (!req.user) {
        sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401);
        return;
      }

      const vue = typeof req.query.vue === "string" ? req.query.vue : "moi";
      const User = (await import("../models/user.model")).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (!fullCurrentUser) {
        sendErrorClient(res, AUTH.ERROR_MESSAGES.USER_NOT_FOUND, 404);
        return;
      }

      const matchFilter: Record<string, unknown> = {};
      if (vue === "partenaire") {
        if (!fullCurrentUser.partenaireId) {
          sendErrorClient(res, COMMON.ERROR_MESSAGES.NO_PARTNER_LINKED, 400);
          return;
        }
        matchFilter.utilisateur = fullCurrentUser.partenaireId;
      } else if (vue === "couple_complet") {
        if (!fullCurrentUser.partenaireId) {
          matchFilter.utilisateur = fullCurrentUser._id;
        } else {
          matchFilter.utilisateur = {
            $in: [fullCurrentUser._id, fullCurrentUser.partenaireId],
          };
        }
      } else {
        // vue par défaut: moi
        matchFilter.utilisateur = fullCurrentUser._id;
      }

      const { 
        categorie,
        dateDebut,
        dateFin,
        typeCompte,
        typeDepense,
        search,
        page: pageStr,
        limit: limitStr,
        sortBy = "date",
        order = "desc",
      } = req.query;
      
      const page = Number(pageStr) || 1;
      const limit = Number(limitStr) || DEPENSE.PAGINATION.DEFAULT_LIMIT;

      const skip = (page - 1) * limit;
      const orderValue = order === "asc" ? 1 : -1;

      // Ajout du filtrage typeDepense TOUJOURS si fourni et valide
      if (
        typeof typeDepense === "string" &&
        typeDepense &&
        ["Perso", "Commune"].includes(typeDepense)
      ) {
        matchFilter.typeDepense = typeDepense as TypeDepense;
      }

      if (typeof categorie === "string" && categorie) {
        // S'assurer que l'ID est valide avant de l'utiliser dans le filtre
        if (mongoose.Types.ObjectId.isValid(categorie)) {
          matchFilter.categorie = new mongoose.Types.ObjectId(categorie);
        } else {
          // Gérer le cas d'un ID de catégorie invalide si nécessaire (ex: ignorer le filtre)
          logger.warn(
            `ID de catégorie invalide fourni pour le filtre: ${categorie}`,
          );
        }
      }
      if (dateDebut || dateFin) {
        matchFilter.date = {};
        if (dateDebut)
          (matchFilter.date as Record<string, Date>)["$gte"] = new Date(
            dateDebut as string,
          );
        if (dateFin)
          (matchFilter.date as Record<string, Date>)["$lte"] = new Date(
            dateFin as string,
          );
      }
      if (typeof typeCompte === "string" && typeCompte) {
        matchFilter.typeCompte = typeCompte as TypeCompte;
      }
      if (typeof search === "string" && search.trim()) {
        const regex = { $regex: search.trim(), $options: "i" };
        matchFilter.$or = [{ description: regex }, { commentaire: regex }];
      }

      let depenses;

      if (sortBy === "categorie") {
        logger.debug("Utilisation de l'agrégation pour trier par catégorie");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pipeline: ReadonlyArray<any> = [
          { $match: matchFilter },
          {
            $lookup: {
              from: "categories",
              localField: "categorie",
              foreignField: "_id",
              as: "categorieDetails",
            },
          },
          {
            $unwind: {
              path: "$categorieDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              lowerCaseCatName: { $toLower: "$categorieDetails.nom" },
            },
          },
          { $sort: { lowerCaseCatName: orderValue, _id: 1 } },
          {
            $lookup: {
              from: "users",
              localField: "utilisateur",
              foreignField: "_id",
              as: "utilisateurDetails",
            },
          },
          {
            $unwind: {
              path: "$utilisateurDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $facet: {
              paginatedResults: [
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    _id: 1,
                    montant: 1,
                    date: 1,
                    description: 1,
                    commentaire: 1,
                    typeCompte: 1,
                    typeDepense: 1,
                    recurrence: 1,
                    utilisateur: {
                      _id: "$utilisateurDetails._id",
                      nom: "$utilisateurDetails.nom",
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    categorie: {
                      _id: "$categorieDetails._id",
                      nom: "$categorieDetails.nom",
                      description: "$categorieDetails.description",
                      image: "$categorieDetails.image",
                    },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ];

        const aggregationResult = await Depense.aggregate(pipeline);

        depenses = aggregationResult[0]?.paginatedResults || [];
      } else {
        logger.debug(`Utilisation de find() pour trier par ${sortBy}`);
        // Utilisation de find() pour les autres tris
        const sortOptions: { [key: string]: 1 | -1 } = {};
        if (typeof sortBy === "string") {
          sortOptions[sortBy] = orderValue;
        } else {
          sortOptions["date"] = -1;
        }

        depenses = await Depense.find(matchFilter)
          .populate<{ categorie: IDepensePopulated['categorie'] }>("categorie", "nom description image")
          .populate<{ utilisateur: IDepensePopulated['utilisateur'] }>({
            path: "utilisateur",
            select: "nom _id",
          })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean<IDepensePopulated[]>(); // lean pour les performances
      }

      sendSuccess(res, depenses, 'Liste des dépenses');
    } catch (error) {
      logger.error("Erreur dans obtenirDepenses:", error);
      res
        .status(500)
        .json({ message: "Erreur lors de la récupération des dépenses" });
    }
  }
);

export const modifierDepense = createAsyncHandler<DepenseRequest.UpdateBody, IdParams>(
  async (req, res): Promise<void> => {
    try {
      const depense = await Depense.findById(req.params.id);

      if (!depense) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND, 404);
        return;
      }

      if (
        !req.user ||
        depense.utilisateur.toString() !== req.user.id.toString()
      ) {
        sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401);
        return;
      }
      if (
        req.body.typeDepense &&
        !Object.values(DEPENSE.TYPES_DEPENSE).includes(
          req.body.typeDepense as TypeDepense,
        )
      ) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.INVALID_TYPE_DEPENSE, 400);
        return;
      }
      if (
        req.body.typeCompte &&
        !Object.values(DEPENSE.TYPES_COMPTE).includes(
          req.body.typeCompte as TypeCompte,
        )
      ) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE, 400);
        return;
      }
      const updated = await Depense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
        .populate<{
          categorie: Pick<ICategorie, "_id" | "nom" | "description" | "image">;
        }>("categorie", "nom description image")
        .lean();

      if (!updated) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND, 404);
        return;
      }

      sendSuccess(res, updated, 'Dépense modifiée');
    } catch (error) {
      logger.error("Erreur lors de la modification de la dépense:", error);
      res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour de la dépense" });
    }
  }
);

export const supprimerDepense = createAsyncHandler<Record<string, never>, IdParams>(
  async (req, res): Promise<void> => {
    try {
      const depense = await Depense.findById(req.params.id);

      if (!depense) {
        sendErrorClient(res, DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND, 404);
        return;
      }

      if (
        !req.user ||
        depense.utilisateur.toString() !== req.user.id.toString()
      ) {
        sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401);
        return;
      }

      await depense.deleteOne();
      sendSuccess(res, { message: 'Dépense supprimée' });
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ message: "Erreur lors de la suppression de la dépense" });
    }
  }
);

// Import avec Multer qui ajoute req.file
interface MulterRequest extends TypedAuthRequest {
  file?: Express.Multer.File;
}

export const importerDepenses = createAsyncHandler(
  async (req: MulterRequest, res, next): Promise<void> => {
    if (!req.file) return next(new AppError(COMMON.ERROR_MESSAGES.NO_CSV_FILE, 400));
    if (!req.user)
      return next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));
    try {
      const result = await importService.importDepensesCsv(req.file.buffer, req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);
