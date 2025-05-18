import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import RevenuModel from "../models/revenu.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { IRevenuInput, TypeCompteRevenu } from "../types/revenu.types";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { parse, isValid } from "date-fns";
import { AUTH } from "../constants";
import CategorieRevenuModel from "../models/categorieRevenu.model";

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
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (!req.user) {
    next(new AppError("Utilisateur non authentifié.", 401));
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
      res.status(404).json({ message: "Catégorie de revenu non trouvée." });
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

    res.status(201).json(revenuPopule);
    return;
  } catch (error) {
    logger.error("Erreur lors de l'ajout du revenu:", error);
    next(new AppError("Erreur serveur lors de l'ajout du revenu.", 500));
    return;
  }
};

export const obtenirRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new AppError("Utilisateur non authentifié.", 401));
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
        res
          .status(200)
          .json({
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
      res
        .status(200)
        .json({ revenus: [], pagination: { total: 0, page, limit, pages: 0 } });
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

    res.status(200).json({
      revenus,
      pagination: {
        total: totalRevenus,
        page,
        limit,
        pages: Math.ceil(totalRevenus / limit),
      },
    });
    return;
  } catch (error) {
    logger.error("Erreur lors de la récupération des revenus:", error);
    next(
      new AppError("Erreur serveur lors de la récupération des revenus.", 500),
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
    next(new AppError("Utilisateur non authentifié.", 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("ID de revenu invalide.", 400));
    return;
  }

  try {
    const revenu = await RevenuModel.findById(id).populate(
      "utilisateur",
      "nom _id",
    );

    if (!revenu) {
      next(new AppError("Revenu non trouvé.", 404));
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
      next(new AppError("Accès non autorisé à cette ressource.", 403));
      return;
    }

    res.status(200).json(revenu);
    return;
  } catch (error) {
    logger.error("Erreur lors de la récupération du revenu par ID:", error);
    next(
      new AppError("Erreur serveur lors de la récupération du revenu.", 500),
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
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (!req.user) {
    next(new AppError("Utilisateur non authentifié.", 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("ID de revenu invalide.", 400));
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
      next(new AppError("Revenu non trouvé.", 404));
      return;
    }

    if (revenu.utilisateur.toString() !== req.user.id.toString()) {
      next(
        new AppError(
          "Action non autorisée. Vous ne pouvez modifier que vos propres revenus.",
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
        res.status(404).json({ message: "Catégorie de revenu non trouvée." });
        return;
      }
    }

    Object.assign(revenu, updates);
    await revenu.save();
    const revenuPopule = await RevenuModel.findById(revenu._id)
      .populate("utilisateur", "nom _id")
      .populate("categorieRevenu", "nom _id");

    res.status(200).json(revenuPopule);
    return;
  } catch (error) {
    logger.error("Erreur lors de la modification du revenu:", error);
    next(
      new AppError("Erreur serveur lors de la modification du revenu.", 500),
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
    next(new AppError("Utilisateur non authentifié.", 401));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("ID de revenu invalide.", 400));
    return;
  }

  try {
    const revenu = await RevenuModel.findById(id);

    if (!revenu) {
      next(new AppError("Revenu non trouvé.", 404));
      return;
    }

    if (revenu.utilisateur.toString() !== req.user.id.toString()) {
      next(
        new AppError(
          "Action non autorisée. Vous ne pouvez supprimer que vos propres revenus.",
          403,
        ),
      );
      return;
    }

    await RevenuModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Revenu supprimé avec succès." });
    return;
  } catch (error) {
    logger.error("Erreur lors de la suppression du revenu:", error);
    next(new AppError("Erreur serveur lors de la suppression du revenu.", 500));
    return;
  }
};

// Importation CSV de revenus
export const importerRevenus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  logger.info(`Tentative d'importation de revenus par ${req.user?.email}`);

  if (!req.file) return next(new AppError("Aucun fichier CSV fourni", 400));
  if (!req.user)
    return next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));

  const userId = req.user.id;
  const csvBuffer = req.file.buffer;

  const revenusAImporter: Array<
    IRevenuInput & { utilisateur: mongoose.Types.ObjectId }
  > = [];
  const erreursImport: Array<{
    ligne: number;
    data: Record<string, string>;
    erreur: string;
  }> = [];
  let ligneCourante = 0;

  // Pré-chargement des catégories de revenus existantes (nom -> _id)
  const categoriesDocs = await CategorieRevenuModel.find().lean();
  const categorieMap = new Map<string, mongoose.Types.ObjectId>();
  categoriesDocs.forEach((cat) => {
    categorieMap.set(
      cat.nom.trim().toLowerCase(),
      cat._id as mongoose.Types.ObjectId,
    );
  });

  const lineProcessingPromises: Promise<void>[] = [];

  await new Promise<void>((resolveStream, rejectStream) => {
    Readable.from(csvBuffer)
      .pipe(
        csvParser({
          separator: ",",
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          headers: [
            "date",
            "montant",
            "description",
            "categorierevenu",
            "typecompte",
            "commentaire",
            "estrecurrent",
          ],
          skipLines: 0,
        }),
      )
      .on("data", (row) => {
        ligneCourante++;
        const currentLine = ligneCourante;
        const processLine = async () => {
          try {
            const {
              date: dateStr,
              montant: montantStr,
              description,
              categorierevenu,
              typecompte: typeCompteStr,
              commentaire: commentaireStr,
              estrecurrent,
            } = row;
            if (!dateStr || !montantStr || !description || !categorierevenu)
              throw new Error(
                "Données manquantes (date, montant, description, categorieRevenu)",
              );

            const expectedDateFormat = "dd/MM/yyyy";
            const date = parse(dateStr, expectedDateFormat, new Date());
            if (!isValid(date))
              throw new Error(
                `Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat.toUpperCase()}`,
              );

            const montantNumerique = parseFloat(montantStr.replace(",", "."));
            if (isNaN(montantNumerique) || montantNumerique <= 0)
              throw new Error(`Montant invalide: ${montantStr}`);

            let typeCompte: TypeCompteRevenu = "Perso";
            if (
              typeCompteStr &&
              (typeCompteStr === "Perso" || typeCompteStr === "Conjoint")
            ) {
              typeCompte = typeCompteStr as TypeCompteRevenu;
            }

            // Gestion de la catégorie de revenu (ID ou nom)
            let categorieRevenuId: mongoose.Types.ObjectId | null = null;
            if (categorierevenu) {
              const trimmed = categorierevenu.trim();
              if (mongoose.Types.ObjectId.isValid(trimmed)) {
                // Recherche par ID
                const cat = await CategorieRevenuModel.findById(trimmed).lean();
                if (cat) {
                  categorieRevenuId = cat._id as mongoose.Types.ObjectId;
                }
              }
              if (!categorieRevenuId) {
                // Recherche par nom (insensible à la casse)
                const lower = trimmed.toLowerCase();
                if (categorieMap.has(lower)) {
                  categorieRevenuId = categorieMap.get(lower)!;
                } else {
                  // Création atomique ou récupération de la catégorie (évite les doublons)
                  const cat = await CategorieRevenuModel.findOneAndUpdate(
                    { nom: { $regex: new RegExp(`^${trimmed}$`, "i") } },
                    {
                      $setOnInsert: {
                        nom: trimmed,
                        description:
                          "Catégorie créée automatiquement lors de l'import CSV.",
                      },
                    },
                    { new: true, upsert: true, lean: true },
                  );
                  if (!cat)
                    throw new Error(
                      `Erreur inattendue lors de la création ou récupération de la catégorie: ${trimmed}`,
                    );
                  categorieRevenuId = cat._id as mongoose.Types.ObjectId;
                  categorieMap.set(lower, cat._id as mongoose.Types.ObjectId);
                }
              }
            }
            if (!categorieRevenuId)
              throw new Error(
                "Erreur inattendue : categorieRevenuId null après création ou recherche.",
              );

            // Gestion du booléen estRecurrent
            let estRecurrentBool = false;
            if (typeof estrecurrent === "string") {
              estRecurrentBool =
                estrecurrent.trim().toLowerCase() === "true" ||
                estrecurrent.trim() === "1";
            }

            const revenuToInsert: IRevenuInput & {
              utilisateur: mongoose.Types.ObjectId;
            } = {
              date,
              montant: montantNumerique,
              description,
              typeCompte,
              commentaire: commentaireStr || "",
              categorieRevenu: categorieRevenuId.toString(),
              estRecurrent: estRecurrentBool,
              utilisateur: new mongoose.Types.ObjectId(userId),
            };
            revenusAImporter.push(revenuToInsert);
          } catch (lineError: unknown) {
            const errorMessage =
              lineError instanceof Error
                ? lineError.message
                : "Erreur inconnue de traitement de ligne";
            logger.warn(
              `Erreur traitement ligne ${currentLine}: ${errorMessage}`,
            );
            erreursImport.push({
              ligne: currentLine,
              data: row,
              erreur: errorMessage,
            });
          }
        };
        lineProcessingPromises.push(processLine());
      })
      .on("end", async () => {
        logger.info("Fin du stream CSV (événement end reçu).");
        await Promise.allSettled(lineProcessingPromises);
        let importedCount = 0;
        if (revenusAImporter.length > 0) {
          try {
            const result = await RevenuModel.insertMany(revenusAImporter, {
              ordered: false,
            });
            importedCount = result.length;
            logger.info(`${importedCount} revenus importés avec succès.`);
          } catch (dbError: unknown) {
            let errorMessage = "Erreur inconnue lors de l'insertion en masse";
            let successfulInserts = 0;
            if (dbError instanceof Error) {
              errorMessage = dbError.message;
              logger.error(
                `Erreur Mongoose/Mongo lors de l'insertion en masse: ${errorMessage}`,
                dbError,
              );
              if (typeof dbError === "object" && dbError !== null) {
                const resultObj = (
                  dbError as { result?: { nInserted?: number } }
                ).result;
                if (resultObj && typeof resultObj.nInserted === "number") {
                  successfulInserts = resultObj.nInserted;
                }
              }
            } else {
              logger.error(
                "Erreur inattendue lors de l'insertion en masse:",
                dbError,
              );
            }
            res.status(500).json({
              message: "Erreur lors de l'enregistrement des revenus.",
              details: errorMessage,
              importedCount: successfulInserts,
              errorCount:
                revenusAImporter.length -
                successfulInserts +
                erreursImport.length,
              erreursParsing: erreursImport,
            });
            return;
          }
        } else {
          logger.info("Aucun revenu valide à importer.");
        }
        res.status(200).json({
          message: `Import terminé. ${importedCount} revenus importés. ${erreursImport.length} lignes avec erreurs.`,
          totalLignesLues: ligneCourante,
          importedCount,
          errorCount: erreursImport.length,
          erreurs: erreursImport,
        });
        resolveStream();
      })
      .on("error", (err) => {
        logger.error("Erreur Stream CSV:", err);
        rejectStream(err);
      });
  });
};
