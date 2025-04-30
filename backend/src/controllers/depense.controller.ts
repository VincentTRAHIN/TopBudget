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
import mongoose from "mongoose";
import { parse, isValid } from "date-fns";
import { TypeCompte } from '../types/depense.types';
import { ICategorie } from '../types/categorie.types';

// Interface pour typer le filtre matchFilter plus précisément
interface MatchFilter {
  utilisateur: mongoose.Types.ObjectId;
  categorie?: mongoose.Types.ObjectId;
  date?: { $gte?: Date; $lte?: Date };
  typeCompte?: TypeCompte; 
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

    const categorieExistante = await Categorie.findById(categorie);
     if (!categorieExistante) {
        res.status(404).json({ message: CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND });
        return;
     }

    const nouvelleDepense = await Depense.create({
      montant,
      date,
      commentaire,
      typeCompte,
      recurrence,
      categorie,
      description,
      utilisateur: req.user ? req.user.id : null,
    });

    res.status(201).json(nouvelleDepense);
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
      search,
      sortBy = "date",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * limit;
    const orderValue = order === "asc" ? 1 : -1;

    // --- Construction du filtre $match (commun à find et aggregate) ---
    const matchFilter: MatchFilter = { utilisateur: new mongoose.Types.ObjectId(req.user.id) };


    if (typeof categorie === "string" && categorie) {
      // S'assurer que l'ID est valide avant de l'utiliser dans le filtre
      if (mongoose.Types.ObjectId.isValid(categorie)) {
        matchFilter.categorie = new mongoose.Types.ObjectId(categorie);
      } else {
         // Gérer le cas d'un ID de catégorie invalide si nécessaire (ex: ignorer le filtre)
         logger.warn(`ID de catégorie invalide fourni pour le filtre: ${categorie}`);
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
    if (typeof search === "string" && search.trim()) {
        const regex = { $regex: search.trim(), $options: 'i' };
        matchFilter.$or = [ { description: regex }, { commentaire: regex } ];
    }

    let depenses;
    let total: number;

    // --- Logique conditionnelle : Agrégation pour tri par catégorie, Find sinon ---
    if (sortBy === 'categorie') {
      logger.debug("Utilisation de l'agrégation pour trier par catégorie");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipeline: any[] = [ 
        { $match: matchFilter },
        {
          $lookup: {
            from: 'categories',
            localField: 'categorie',
            foreignField: '_id',
            as: 'categorieDetails'
          }
        },
        { $unwind: { path: '$categorieDetails', preserveNullAndEmptyArrays: true } },
        { $addFields: { lowerCaseCatName: { $toLower: '$categorieDetails.nom' } } },
        { $sort: { lowerCaseCatName: orderValue, _id: 1 } },
        {
          $facet: {
            paginatedResults: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                    _id: 1, montant: 1, date: 1, description: 1, commentaire: 1, typeCompte: 1, recurrence: 1, utilisateur: 1, createdAt: 1, updatedAt: 1,
                    categorie: { _id: '$categorieDetails._id', nom: '$categorieDetails.nom', description: '$categorieDetails.description', image: '$categorieDetails.image' } 
                }
              }
            ],
            totalCount: [ { $count: 'count' } ]
          }
        }
      ];


      const aggregationResult = await Depense.aggregate(pipeline);

      depenses = aggregationResult[0]?.paginatedResults || [];
      total = aggregationResult[0]?.totalCount[0]?.count || 0;

    } else {
      logger.debug(`Utilisation de find() pour trier par ${sortBy}`);
      // Utilisation de find() pour les autres tris
      const sortOptions: { [key: string]: 1 | -1 } = {};
      if (typeof sortBy === 'string') {
          sortOptions[sortBy] = orderValue;
      } else {
          sortOptions["date"] = -1; 
      }

      depenses = await Depense.find(matchFilter)
      .populate<{ categorie: Pick<ICategorie, '_id' | 'nom' | 'description' | 'image'> }>("categorie", "nom description image")
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
    res.status(500).json({ message: "Erreur lors de la récupération des dépenses" });
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

    const updated = await Depense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    logger.error(error);
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

  if (!req.file) {
    throw new AppError("Aucun fichier CSV fourni", 400);
  }

  if (!req.user) {
    throw new AppError(AUTH.ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  const userId = req.user.id;
  const csvBuffer = req.file.buffer;

  const depensesAImporter: {
    date: Date;
    montant: number;
    categorie: mongoose.Types.ObjectId;
    description?: string;
    utilisateur: mongoose.Types.ObjectId;
  }[] = [];
  const erreursImport: {
    ligne: number;
    data: { [key: string]: string | number };
    erreur: string;
  }[] = [];
  let ligneCourante = 0;

  const categorieDisponible = await Categorie.find();
  const categorieMap = new Map(
    categorieDisponible.map((cat) => [cat.nom.toLowerCase(), cat._id])
  );

  const readableStream = Readable.from(csvBuffer);

  readableStream
    .pipe(
      csvParser({
        separator: ",",
        mapHeaders: ({ header }) => header.trim(),
        headers: ["date", "montant", "categorie", "description"],
      })
    )
    .on("data", async (row) => {
      ligneCourante++;
      logger.debug(`Ligne ${ligneCourante} lue: ${JSON.stringify(row)}`);
      const {
        date: dateStr,
        montant: montantStr,
        categorie: categorieStrRow,
        description: description,
      } = row;

      if (!dateStr || !montantStr || !categorieStrRow) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: "Données manquantes (date, montant, categorie)",
        });
        return;
      }

      const expectedDateFormat = "dd/MM/yyyy";
      const date = parse(dateStr, expectedDateFormat, new Date());
      if (!isValid(date)) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat.toUpperCase()}`,
        });
        return;
      }

      const montantNumerique = parseFloat(montantStr.replace(",", "."));
      if (
        isNaN(montantNumerique) ||
        montantNumerique <= DEPENSE.VALIDATION.MIN_MONTANT
      ) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `${DEPENSE.ERROR_MESSAGES.INVALID_MONTANT}: ${montantStr}`,
        });
        return;
      }

      const categorieNomNettoye = categorieStrRow.trim();
      if (
        categorieNomNettoye.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH ||
        categorieNomNettoye.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH
      ) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `Nom de catégorie invalide: '${categorieNomNettoye}'. Doit contenir entre ${CATEGORIE.VALIDATION.MIN_NOM_LENGTH} et ${CATEGORIE.VALIDATION.MAX_NOM_LENGTH} caractères.`,
        });
        return;
      }

      let categorieId: mongoose.Types.ObjectId | undefined = categorieMap.get(
        categorieNomNettoye.toLowerCase()
      ) as mongoose.Types.ObjectId | undefined;
      if (!categorieId) {
        logger.info(
          `Catégorie '${categorieNomNettoye}' non trouvée, tentative de création.`
        );
        try {
          const categorieDejaCreee = await Categorie.findOne({
            nom: { $regex: new RegExp(`^${categorieNomNettoye}$`, "i") },
          });

          if (categorieDejaCreee) {
            categorieId = categorieDejaCreee._id as mongoose.Types.ObjectId;
            logger.info(
              `Catégorie '${categorieNomNettoye}' trouvée après vérification (créée récemment).`
            );
            categorieMap.set(categorieNomNettoye.toLowerCase(), categorieId);
          } else {
            const nouvelleCategorie = await Categorie.create({
              nom: categorieNomNettoye,
              description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
            });
            categorieId = nouvelleCategorie._id as mongoose.Types.ObjectId;
            categorieMap.set(nouvelleCategorie.nom.toLowerCase(), categorieId);
            logger.info(
              `Catégorie '${nouvelleCategorie.nom}' créée avec succès (ID: ${categorieId}).`
            );
          }
        } catch (error: unknown) {
          let messageErreur = `Erreur lors de la création de la catégorie '${categorieNomNettoye}'`;

          // Utilisation constante CATEGORIE pour l'erreur de validation Mongoose
          if (error instanceof mongoose.Error.ValidationError) {
            messageErreur = `${CATEGORIE.ERROR_MESSAGES.VALIDATION_ERROR} ('${categorieNomNettoye}'): ${error.message}`;
            // Utilisation constante CATEGORIE pour l'erreur de doublon
          } else if (
            error instanceof Error &&
            "code" in error &&
            error.code === 11000
          ) {
            messageErreur = `${CATEGORIE.ERROR_MESSAGES.CATEGORIE_ALREADY_EXISTS} ('${categorieNomNettoye}')`;
            logger.warn(messageErreur, error);
          } else if (error instanceof Error) {
            messageErreur += `: ${error.message}`;
            logger.error(messageErreur, error);
          } else {
            logger.error(messageErreur, error);
          }

          erreursImport.push({
            ligne: ligneCourante,
            data: row,
            erreur: messageErreur,
          });
          return;
        }
      }

      if (!categorieId) {
        logger.error(
          `Erreur critique: categorieId est null/undefined pour la ligne ${ligneCourante} après tentative de création/recherche.`
        );
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `Impossible de déterminer l'ID de la catégorie '${categorieNomNettoye}'.`,
        });
        return;
      }

      if (!categorieId) {
        logger.error(
          `Erreur critique: categorieId est null/undefined pour la ligne ${ligneCourante} après tentative de création/recherche.`
        );
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `${CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND}: Impossible de déterminer l'ID pour '${categorieNomNettoye}'.`,
        });
        return;
      }

      depensesAImporter.push({
        date,
        montant: montantNumerique,
        categorie: categorieId as mongoose.Types.ObjectId,
        description: description ? description.trim() : undefined,
        utilisateur: new mongoose.Types.ObjectId(userId),
      });
      logger.debug(`Dépense ajoutée: ${JSON.stringify(depensesAImporter)}`);
    })
    .on("end", async () => {
      logger.info(
        `Fin du parsing CSV. ${depensesAImporter.length} dépenses validées, ${erreursImport.length} erreurs.`
      );
      let importedCount = 0;
      if (depensesAImporter.length > 0) {
        try {
          const result = await Depense.insertMany(depensesAImporter, {
            ordered: false,
          });
          importedCount = result.length;
          logger.info(
            `${importedCount} dépenses importées avec succès pour l'utilisateur ${userId}.`
          );
        } catch (dbError: unknown) {
          if (dbError instanceof mongoose.Error) {
            logger.error(
              `Erreur lors de l'insertion en masse: ${dbError.message}`
            );
          } else {
            logger.error(`Erreur inconnue: ${dbError}`);
          }
          return res.status(500).json({
            message:
              "Erreur lors de l'enregistrement des dépenses en base de données.",
            details:
              dbError instanceof mongoose.Error ? dbError.message : dbError,
            importedCount:
              dbError instanceof mongoose.Error && "insertedDocs" in dbError
                ? (dbError.insertedDocs as { length: number }[])?.length || 0
                : 0,
            erreursParsing: erreursImport,
          });
        }
      }
      res.status(200).json({
        message: `Import terminé. ${importedCount} dépenses importées, ${erreursImport.length} lignes ignorées.`,
        totalLignesLues: ligneCourante,
        importedCount,
        errorCount: erreursImport.length,
        erreurs: erreursImport,
      });
    })
    .on("error", (error) => {
      logger.error(`Erreur lors du parsing CSV: ${error.message}`);
      next(
        new AppError(
          `Erreur lors de la lecture du fichier CSV: ${error.message}`,
          500
        )
      );
    });
};
