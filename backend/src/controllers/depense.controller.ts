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
    const { montant, date, commentaire, typeCompte, recurrence, categorie, description } =
      req.body;

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
      sortBy = "date",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    const filter: {
      utilisateur: string;
      categorie?: string;
      date?: { $gte?: Date; $lte?: Date };
      typeCompte?: string;
    } = { utilisateur: req.user.id };

    if (typeof categorie === "string") {
      filter.categorie = categorie;
    }

    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) {
        filter.date.$gte = new Date(dateDebut as string);
      }
      if (dateFin) {
        filter.date.$lte = new Date(dateFin as string);
      }
    }

    if (typeCompte) {
      filter.typeCompte = typeCompte as string;
    }

    const depenses = await Depense.find(filter)
      .populate("categorie")
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy as string]: order === "asc" ? 1 : -1 });

    const total = await Depense.countDocuments(filter);

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
    logger.error(error);
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
        separator: ";",
        mapHeaders: ({ header }) => header.trim(),
        headers: ["date", "montant", "categorie", "description"],
      })
    )
    .on("data", (row) => {
      ligneCourante++;
      logger.debug(`Ligne ${ligneCourante} lue: ${JSON.stringify(row)}`);
      const {
        date: dateStr,
        montant: montantStr,
        categorie: categorieStr,
        description: description,
      } = row;

      if (!dateStr || !montantStr || !categorieStr) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: "Données manquantes",
        });
        return;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `Date invalide: ${dateStr}. Format attendu: YYYY-MM-DD`,
        });
        return;
      }

      const montantNumerique = parseFloat(montantStr.replace(',', '.'));
      if (isNaN(montantNumerique) || montantNumerique <= 0) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `Montant invalide: ${montantStr}`,
        });
        return;
      }

      const categorieId = categorieMap.get(categorieStr.toLowerCase());
      if (!categorieId) {
        erreursImport.push({
          ligne: ligneCourante,
          data: row,
          erreur: `${CATEGORIE.ERROR_MESSAGES.CATEGORIE_NOT_FOUND}: '${categorieStr}'`,
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
