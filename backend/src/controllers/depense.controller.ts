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

// Interface pour typer le filtre matchFilter plus précisément
interface MatchFilter {
  utilisateur: mongoose.Types.ObjectId;
  categorie?: mongoose.Types.ObjectId;
  date?: { $gte?: Date; $lte?: Date };
  typeCompte?: TypeCompte;
  typeDepense?: TypeDepense;
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

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

    // --- Construction du filtre $match (commun à find et aggregate) ---
    const matchFilter: MatchFilter = {
      utilisateur: new mongoose.Types.ObjectId(req.user.id),
    };

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
      if (dateDebut) matchFilter.date.$gte = new Date(dateDebut as string);
      if (dateFin) matchFilter.date.$lte = new Date(dateFin as string);
    }
    if (typeof typeCompte === "string" && typeCompte) {
      matchFilter.typeCompte = typeCompte as TypeCompte;
    }
    if (typeof typeDepense === "string" && typeDepense) {
      matchFilter.typeDepense = typeDepense as TypeDepense;
    }
    if (typeof search === "string" && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      matchFilter.$or = [{ description: regex }, { commentaire: regex }];
    }

    let depenses;
    let total: number;

    // --- Logique conditionnelle : Agrégation pour tri par catégorie, Find sinon ---
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
                  utilisateur: 1,
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

// --- importerDepenses (corrigée pour race condition et champs par défaut) ---
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
  const erreursImport: Array<{ligne: number; data: Record<string, string>; erreur: string}> = [];
  let ligneCourante = 0;

  // Map pour stocker les promesses de récupération/création d'ID de catégorie
  // Clé: nom de catégorie en minuscule, Valeur: Promesse qui résout vers l'ObjectId ou null si erreur
  const categoriePromises = new Map<string, Promise<mongoose.Types.ObjectId | null>>();
  let categorieMap: Map<string, mongoose.Types.ObjectId>;


  try {
     // Pré-charger les catégories existantes
     const categorieExistantesDocs = await Categorie.find().lean();
     categorieMap = new Map(categorieExistantesDocs.map((cat) => [cat.nom.toLowerCase(), cat._id as mongoose.Types.ObjectId]));
     logger.info(`Pré-chargement de ${categorieMap.size} catégories existantes.`);

    const readableStream = Readable.from(csvBuffer);

    // Fonction pour obtenir/créer une catégorie de manière atomique (par nom)
    const getOrCreateCategorieId = (nomNettoye: string): Promise<mongoose.Types.ObjectId | null> => {
        const nomLower = nomNettoye.toLowerCase();

        // 1. Vérifier le cache initial
        if (categorieMap.has(nomLower)) {
          return Promise.resolve(categorieMap.get(nomLower)!); // Retourne directement l'ID connu
        }

        // 2. Vérifier si une promesse est déjà en cours pour ce nom
        if (categoriePromises.has(nomLower)) {
            logger.debug(`Attente de la promesse existante pour '${nomLower}'...`);
            return categoriePromises.get(nomLower)!;
        }

        // 3. Créer et stocker une nouvelle promesse
        logger.debug(`Création d'une nouvelle promesse pour '${nomLower}'`);
        const categoriePromise = (async (): Promise<mongoose.Types.ObjectId | null> => {
          try {
            // Essayer de créer directement (gère le find+create ou le doublon)
            const categorie = await Categorie.findOneAndUpdate(
                { nom: { $regex: new RegExp(`^${nomNettoye}$`, "i") } }, // Recherche insensible à la casse
                {
                    $setOnInsert: { // Ne définit ces valeurs que si le document est inséré
                        nom: nomNettoye, // Garder la casse originale
                        description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE
                    }
                },
                {
                    new: true, // Retourne le document après update/insert
                    upsert: true, // Crée le document s'il n'existe pas
                    lean: true // Retourne un objet simple
                }
            );

            if (categorie && categorie._id) {
                 logger.info(`Catégorie '${categorie.nom}' (ID: ${categorie._id}) obtenue/créée via findOneAndUpdate.`);
                 // Mettre à jour la map principale de manière fiable
                 categorieMap.set(nomLower, categorie._id as mongoose.Types.ObjectId);
                 return categorie._id as mongoose.Types.ObjectId;
            } else {
                // Ce cas ne devrait pas arriver avec upsert: true, mais sécurité
                logger.error(`Échec de findOneAndUpdate pour la catégorie '${nomNettoye}', aucun document retourné.`);
                return null;
            }
        } catch (error: unknown) {
            logger.error(`Erreur dans findOneAndUpdate pour '${nomNettoye}':`, error);
            return null; // Échec
        } finally {
            // Retirer la promesse de la map une fois terminée pour libérer la mémoire
             categoriePromises.delete(nomLower);
        }
    })();

    categoriePromises.set(nomLower, categoriePromise);
    return categoriePromise;
};


// Traitement du stream
await new Promise<void>((resolve, reject) => {
  readableStream
    .pipe(
      csvParser({ separator: ",", mapHeaders: ({ header }) => header.trim().toLowerCase(), headers: ["date", "montant", "categorie", "description"], skipLines: 0 })
    )
    .on("data", async (row) => {
        ligneCourante++;
        const currentLine = ligneCourante;
        readableStream.pause(); // Pause avant traitement async

        logger.debug(`Traitement ligne ${currentLine}: ${JSON.stringify(row)}`);
        try {
            const { date: dateStr, montant: montantStr, categorie: categorieStrRow, description } = row;

            // --- Validation ---
            if (!dateStr || !montantStr || !categorieStrRow) throw new Error("Données manquantes");
            const expectedDateFormat = "dd/MM/yyyy";
            const date = parse(dateStr, expectedDateFormat, new Date());
            if (!isValid(date)) throw new Error(`Date invalide: ${dateStr}`);
            const montantNumerique = parseFloat(montantStr.replace(",", "."));
            if (isNaN(montantNumerique) || montantNumerique <= 0) throw new Error(`Montant invalide: ${montantStr}`);
            const categorieNomNettoye = categorieStrRow.trim();
            if (categorieNomNettoye.length < 2 || categorieNomNettoye.length > 50) throw new Error(`Nom catégorie invalide: ${categorieNomNettoye}`);

            // --- Obtenir ID Catégorie ---
            const categorieId = await getOrCreateCategorieId(categorieNomNettoye);

            // Si la promesse a retourné null (erreur interne loggée dans getOrCreate...)
            if (!categorieId) {
                throw new Error(`Impossible d'obtenir l'ID pour la catégorie '${categorieNomNettoye}'`);
            }

            // --- Assigner valeurs par défaut et ajouter ---
            const typeDepense: TypeDepense = DEPENSE.TYPES_DEPENSE.PERSO;
            const typeCompte: TypeCompte = DEPENSE.TYPES_COMPTE.PERSO;

            depensesAImporter.push({
                date,
                montant: montantNumerique,
                categorie: categorieId, // C'est maintenant un ObjectId
                description: description ? description.trim() : undefined,
                utilisateur: new mongoose.Types.ObjectId(userId),
                typeDepense,
                typeCompte,
            });
             logger.debug(`Ligne ${currentLine}: Dépense ajoutée à la liste d'import.`);


        } catch (lineError: unknown) {
            logger.warn(`Erreur ligne ${currentLine}: ${lineError instanceof Error ? lineError.message : 'Erreur inconnue'}`);
            erreursImport.push({ ligne: currentLine, data: row, erreur: lineError instanceof Error ? lineError.message : 'Erreur inconnue' });
        } finally {
            readableStream.resume(); // Reprendre pour la ligne suivante
        }
    })
    .on("end", () => { logger.info("Fin du stream CSV."); resolve(); })
    .on("error", (err) => { logger.error("Erreur Stream CSV:", err); reject(err); });
});

// --- Insertion en base ---
logger.info(`Fin du parsing. ${depensesAImporter.length} dépenses prêtes pour insertion, ${erreursImport.length} erreurs de ligne.`);
let importedCount = 0;
if (depensesAImporter.length > 0) {
   // ... (logique insertMany et catch comme avant) ...
   logger.info(`Tentative d'insertion de ${depensesAImporter.length} dépenses...`);
    try {
        const result = await Depense.insertMany(depensesAImporter, { ordered: false });
        importedCount = result.length;
        logger.info(`${importedCount} dépenses importées avec succès.`);
    } catch (dbError: unknown) { /* ... gestion erreur insertMany ... */
        const errorMessage = "Erreur inconnue lors de l'insertion en masse";
        const successfulInserts = 0;
        if (dbError instanceof Error)
        res.status(500).json({
            message: "Erreur lors de l'enregistrement.",
            details: errorMessage,
            importedCount: successfulInserts,
            errorCount: depensesAImporter.length - successfulInserts + erreursImport.length,
            erreursParsing: erreursImport,
        });
        return; // Sortir
    }
} else {
     logger.info("Aucune dépense valide à importer.");
}

// --- Réponse finale ---
res.status(200).json({
  message: `Import terminé. ${importedCount} dépenses importées, ${erreursImport.length} lignes ignorées durant le parsing.`,
  totalLignesLues: ligneCourante,
  importedCount,
  errorCount: erreursImport.length,
  erreurs: erreursImport,
});

} catch (error) {
logger.error("Erreur générale pendant l'import:", error);
next(error);
}
};
