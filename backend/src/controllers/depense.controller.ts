import { Response, NextFunction } from "express";
import Depense from "../models/depense.model";
import Categorie from "../models/categorie.model";
import { validationResult } from "express-validator";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DEPENSE, AUTH, CATEGORIE } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose, { Error } from "mongoose";
import { parse, isValid } from "date-fns";
import { TypeCompte, TypeDepense, IDepenseInput } from "../types/depense.types";
import { ICategorie } from "../types/categorie.types";

export const ajouterDepense = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    res.status(400).json({ erreurs: erreurs.array() });
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
      res.status(400).json({ message: DEPENSE.ERROR_MESSAGES.INVALID_MONTANT });
      return;
    }

    // Validation du type de compte
    if (!Object.values(DEPENSE.TYPES_COMPTE).includes(typeCompte)) {
      res
        .status(400)
        .json({ message: DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE });
      return;
    }

    // Validation du type de dépense
    if (!Object.values(DEPENSE.TYPES_DEPENSE).includes(typeDepense)) {
      res
        .status(400)
        .json({ message: DEPENSE.ERROR_MESSAGES.INVALID_TYPE_DEPENSE });
      return;
    }

    const categorieExistante = await Categorie.findById(categorie);
    if (!categorieExistante) {
      res
        .status(404)
        .json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND });
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
      .populate<{
        categorie: Pick<ICategorie, "_id" | "nom" | "description" | "image">;
      }>("categorie", "nom description image")
      .lean();
    res.status(201).json(populatedDepense);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de la dépense" });
  }
};

export const obtenirDepenses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    // Ajout du paramètre de vue (moi, partenaire, couple_complet)
    const vue = typeof req.query.vue === 'string' ? req.query.vue : 'moi';
    // On recharge l'utilisateur complet pour avoir le partenaireId
    const User = (await import('../models/user.model')).default;
    const fullCurrentUser = await User.findById(req.user.id);
    if (!fullCurrentUser) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    // Utilisation de Record<string, unknown> pour le typage du filtre
    const matchFilter: Record<string, unknown> = {};
    // Gestion du filtre utilisateur selon la vue
    if (vue === 'partenaire') {
      if (!fullCurrentUser.partenaireId) {
        res.status(400).json({ message: 'Aucun partenaire lié' });
        return;
      }
      matchFilter.utilisateur = fullCurrentUser.partenaireId;
    } else if (vue === 'couple_complet') {
      if (!fullCurrentUser.partenaireId) {
        matchFilter.utilisateur = fullCurrentUser._id;
      } else {
        matchFilter.utilisateur = { $in: [fullCurrentUser._id, fullCurrentUser.partenaireId] };
      }
    } else { // vue par défaut: moi
      matchFilter.utilisateur = fullCurrentUser._id;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || DEPENSE.PAGINATION.DEFAULT_LIMIT;
    const {
      categorie,
      dateDebut,
      dateFin,
      typeCompte,
      typeDepense,
      search,
      sortBy = "date",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * limit;
    const orderValue = order === "asc" ? 1 : -1;

    // Ajout du filtrage typeDepense TOUJOURS si fourni et valide
    if (typeof typeDepense === 'string' && typeDepense && ['Perso', 'Commune'].includes(typeDepense)) {
      matchFilter.typeDepense = typeDepense as TypeDepense;
    }

    if (typeof categorie === "string" && categorie) {
      // S'assurer que l'ID est valide avant de l'utiliser dans le filtre
      if (mongoose.Types.ObjectId.isValid(categorie)) {
        matchFilter.categorie = new mongoose.Types.ObjectId(categorie);
      } else {
        // Gérer le cas d'un ID de catégorie invalide si nécessaire (ex: ignorer le filtre)
        logger.warn(
          `ID de catégorie invalide fourni pour le filtre: ${categorie}`
        );
      }
    }
    if (dateDebut || dateFin) {
      matchFilter.date = {};
      if (dateDebut) (matchFilter.date as Record<string, Date>)["$gte"] = new Date(dateDebut as string);
      if (dateFin) (matchFilter.date as Record<string, Date>)["$lte"] = new Date(dateFin as string);
    }
    if (typeof typeCompte === "string" && typeCompte) {
      matchFilter.typeCompte = typeCompte as TypeCompte;
    }
    if (typeof search === "string" && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      matchFilter.$or = [{ description: regex }, { commentaire: regex }];
    }

    let depenses;
    let total: number;

    if (sortBy === "categorie") {
      logger.debug("Utilisation de l'agrégation pour trier par catégorie");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipeline: any[] = [
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
            as: "utilisateurDetails"
          }
        },
        { $unwind: { path: "$utilisateurDetails", preserveNullAndEmptyArrays: true } },
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
                    nom: "$utilisateurDetails.nom"
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
      total = aggregationResult[0]?.totalCount[0]?.count || 0;
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
        .populate<{
          categorie: Pick<ICategorie, "_id" | "nom" | "description" | "image">;
        }>("categorie", "nom description image")
        .populate({
          path: "utilisateur",
          select: "nom _id"
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(); // lean pour les performances

      total = await Depense.countDocuments(matchFilter);
    }

    res.json({
      depenses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error("Erreur dans obtenirDepenses:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des dépenses" });
  }
};

export const modifierDepense = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const depense = await Depense.findById(req.params.id);

    if (!depense) {
      res
        .status(404)
        .json({ message: DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND });
      return;
    }

    if (
      !req.user ||
      depense.utilisateur.toString() !== req.user.id.toString()
    ) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    if (
      req.body.typeDepense &&
      !Object.values(DEPENSE.TYPES_DEPENSE).includes(
        req.body.typeDepense as TypeDepense
      )
    ) {
      res
        .status(400)
        .json({ message: DEPENSE.ERROR_MESSAGES.INVALID_TYPE_DEPENSE });
      return;
    }
    if (
      req.body.typeCompte &&
      !Object.values(DEPENSE.TYPES_COMPTE).includes(
        req.body.typeCompte as TypeCompte
      )
    ) {
      res
        .status(400)
        .json({ message: DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE });
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
      res
        .status(404)
        .json({ message: DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND });
      return;
    }

    res.json(updated);
  } catch (error) {
    logger.error("Erreur lors de la modification de la dépense:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de la dépense" });
  }
};

export const supprimerDepense = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const depense = await Depense.findById(req.params.id);

    if (!depense) {
      res
        .status(404)
        .json({ message: DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND });
      return;
    }

    if (
      !req.user ||
      depense.utilisateur.toString() !== req.user.id.toString()
    ) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    await depense.deleteOne();
    res.json({ message: "Dépense supprimée" });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de la dépense" });
  }
};

export const importerDepenses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info(`Tentative d'importation de dépenses par ${req.user?.email}`);

  if (!req.file) return next(new AppError("Aucun fichier CSV fourni", 400));
  if (!req.user) return next(new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401));

  const userId = req.user.id;
  const csvBuffer = req.file.buffer;

  const depensesAImporter: Array<IDepenseInput> = []; 
  const erreursImport: Array<{ ligne: number; data: Record<string, string>; erreur: string }> = [];
  let ligneCourante = 0;
  let categoriesNouvellementCrees = 0;

  const categoriePromises = new Map<string, Promise<mongoose.Types.ObjectId | null>>();
  let categorieMap: Map<string, mongoose.Types.ObjectId>;

  try {
    const categorieExistantesDocs = await Categorie.find().lean();
    categorieMap = new Map(
      categorieExistantesDocs.map((cat) => [cat.nom.toLowerCase(), cat._id as mongoose.Types.ObjectId])
    );
    logger.info(`Pré-chargement de ${categorieMap.size} catégories existantes.`);

    const readableStream = Readable.from(csvBuffer);

    const getOrCreateCategorieId = (nomNettoye: string): Promise<mongoose.Types.ObjectId | null> => {
      const nomLower = nomNettoye.toLowerCase();
      if (categorieMap.has(nomLower)) {
        return Promise.resolve(categorieMap.get(nomLower)!);
      }
      if (categoriePromises.has(nomLower)) {
        return categoriePromises.get(nomLower)!;
      }

      const categoriePromise = (async (): Promise<mongoose.Types.ObjectId | null> => {
        try {
          const categorieDB = await Categorie.findOneAndUpdate(
            { nom: { $regex: new RegExp(`^${nomNettoye}$`, "i") } },
            { $setOnInsert: { nom: nomNettoye, description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE } },
            { new: true, upsert: true, lean: true }
          );
          if (categorieDB && categorieDB._id) {
            const estNouvelle = !categorieExistantesDocs.some(c => 
              (c._id as mongoose.Types.ObjectId).equals(categorieDB._id as mongoose.Types.ObjectId)
            );
            if (estNouvelle) {
              categoriesNouvellementCrees++;
              logger.info(`Catégorie NOUVELLEMENT créée '${categorieDB.nom}' (ID: ${categorieDB._id}).`);
            } else {
              logger.info(`Catégorie EXISTANTE '${categorieDB.nom}' (ID: ${categorieDB._id}) obtenue/confirmée.`);
            }
            categorieMap.set(nomLower, categorieDB._id as mongoose.Types.ObjectId);
            return categorieDB._id as mongoose.Types.ObjectId;
          }
          return null;
        } catch (error: unknown) {
          logger.error(`Erreur dans findOneAndUpdate pour '${nomNettoye}':`, error);
          return null;
        } finally {
          categoriePromises.delete(nomLower);
        }
      })();
      categoriePromises.set(nomLower, categoriePromise);
      return categoriePromise;
    };

    const lineProcessingPromises: Promise<void>[] = [];

    await new Promise<void>((resolveStream, rejectStream) => {
      readableStream
        .pipe(
          csvParser({
            separator: ",",
            mapHeaders: ({ header }) => header.trim().toLowerCase(),
            headers: ["date", "montant", "categorie", "description"],
            skipLines: 0,
          })
        )
        .on("data", (row) => {
          ligneCourante++;
          const currentLine = ligneCourante;

          const processLine = async () => {
            logger.debug(`Début traitement ligne ${currentLine}: ${JSON.stringify(row)}`);
            try {
              const { date: dateStr, montant: montantStr, categorie: categorieStrRow, description } = row;
              if (!dateStr || !montantStr || !categorieStrRow) throw new Error("Données manquantes (date, montant, catégorie)");
              
              const expectedDateFormat = "dd/MM/yyyy";
              const date = parse(dateStr, expectedDateFormat, new Date());
              if (!isValid(date)) throw new Error(`Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat.toUpperCase()}`);
              
              const montantNumerique = parseFloat(montantStr.replace(",", "."));
              if (isNaN(montantNumerique) || montantNumerique <= 0) throw new Error(`${DEPENSE.ERROR_MESSAGES.INVALID_MONTANT}: ${montantStr}`);
              
              const categorieNomNettoye = categorieStrRow.trim();
              if (categorieNomNettoye.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH || categorieNomNettoye.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH) {
                throw new Error(`Nom de catégorie invalide: '${categorieNomNettoye}'. Doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères.`);
              }

              const categorieId = await getOrCreateCategorieId(categorieNomNettoye);
              if (!categorieId) {
                throw new Error(`Impossible d'obtenir l'ID pour la catégorie '${categorieNomNettoye}'`);
              }

              const typeDepense: TypeDepense = DEPENSE.TYPES_DEPENSE.PERSO;
              const typeCompte: TypeCompte = DEPENSE.TYPES_COMPTE.PERSO;

              depensesAImporter.push({
                date,
                montant: montantNumerique,
                categorie: categorieId, 
                description: description ? description.trim() : undefined,
                utilisateur: new mongoose.Types.ObjectId(userId),
                typeDepense,
                typeCompte,
                estChargeFixe: false, // Valeur par défaut pour les imports CSV en V1
              });
              logger.debug(`Ligne ${currentLine}: Dépense ajoutée à depensesAImporter.`);

            } catch (lineError: unknown) {
              const errorMessage = lineError instanceof Error ? lineError.message : 'Erreur inconnue de traitement de ligne';
              logger.warn(`Erreur traitement ligne ${currentLine}: ${errorMessage}`);
              erreursImport.push({ ligne: currentLine, data: row, erreur: errorMessage });
            }
          };
          lineProcessingPromises.push(processLine());
        })
        .on("end", () => {
          logger.info("Fin du stream CSV (événement 'end' reçu).");
          Promise.allSettled(lineProcessingPromises)
            .then(() => {
              logger.info("Toutes les promesses de traitement de ligne sont terminées.");
              resolveStream(); 
            })
            .catch((err) => {
              logger.error("Erreur inattendue lors de l'attente des promesses de ligne:", err);
              rejectStream(err);
            });
        })
        .on("error", (err) => {
          logger.error("Erreur Stream CSV:", err);
          rejectStream(err); 
        });
    }); 

    logger.info(`Fin du parsing et traitement de toutes les lignes. ${depensesAImporter.length} dépenses prêtes pour insertion, ${erreursImport.length} erreurs de ligne.`);
    logger.info(`${categoriesNouvellementCrees} nouvelles catégories ont été créées.`);

    let importedCount = 0;
    if (depensesAImporter.length > 0) {
      logger.info(`Tentative d'insertion de ${depensesAImporter.length} dépenses...`);
      try {
        const result = await Depense.insertMany(depensesAImporter, { ordered: false });
        importedCount = result.length;
        logger.info(`${importedCount} dépenses importées avec succès.`);
      } catch (dbError: unknown) {
        let errorMessage = "Erreur inconnue lors de l'insertion en masse";
        let successfulInserts = 0;
        if (dbError instanceof Error) {
            errorMessage = dbError.message;
            logger.error(`Erreur Mongoose/Mongo lors de l'insertion en masse: ${errorMessage}`, dbError);
            if (typeof dbError === 'object' && dbError !== null) {
                // Correction du typage de resultObj
                const resultObj = (dbError as { result?: { nInserted?: number } }).result;
                if (resultObj && typeof resultObj.nInserted === 'number') {
                   successfulInserts = resultObj.nInserted;
                }
            }
        } else {
          logger.error("Erreur inattendue lors de l'insertion en masse:", dbError);
        }
        res.status(500).json({
          message: "Erreur lors de l'enregistrement des dépenses.",
          details: errorMessage,
          importedCount: successfulInserts,
          errorCount: depensesAImporter.length - successfulInserts + erreursImport.length,
          erreursParsing: erreursImport,
          categoriesCrees: categoriesNouvellementCrees
        });
        return;
      }
    } else {
      logger.info("Aucune dépense valide à importer.");
    }

    res.status(200).json({
      message: `Import terminé. ${importedCount} dépenses importées. ${erreursImport.length} lignes avec erreurs. ${categoriesNouvellementCrees} nouvelles catégories créées.`,
      totalLignesLues: ligneCourante,
      importedCount,
      errorCount: erreursImport.length,
      erreurs: erreursImport,
      categoriesCrees: categoriesNouvellementCrees,
    });

  } catch (error) {
    logger.error("Erreur générale pendant l'import:", error);
    next(error);
  }
};
