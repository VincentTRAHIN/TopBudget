import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import Categorie from "../models/categorie.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { DEPENSE, CATEGORIE, CATEGORIE_REVENU, REVENU } from "../constants";
import { parse, isValid } from "date-fns";
import { TypeCompteRevenu } from "../types/revenu.types";

export type ImportResultType = {
  message: string;
  totalLignesLues: number;
  importedCount: number;
  errorCount: number;
  erreurs: Array<{
    ligne: number;
    data: Record<string, string>;
    erreur: string;
  }>;

  [key: string]: unknown;
};

interface MongoError extends Error {
  code?: number;
}

export class ImportService {
  static async processCsvImport({
    csvBuffer,
    userId,
    model,
    entityName,
    csvHeaders,
    mapHeadersConfig,
    processRowFn,
    parsingOptions = {},
    additionalContext = {},
  }: {
    csvBuffer: Buffer;
    userId: string;
    model: mongoose.Model<Record<string, unknown>>;
    entityName: string;
    csvHeaders: string[];
    mapHeadersConfig?: { header: string; newHeader?: string }[];
    processRowFn: (
      row: Record<string, string>,
      userId: string,
      context?: Record<string, unknown>
    ) => Promise<Record<string, unknown> | null>;
    parsingOptions?: csvParser.Options;
    additionalContext?: Record<string, unknown>;
  }): Promise<ImportResultType> {
    const itemsAImporter: Record<string, unknown>[] = [];
    const erreursImport: Array<{
      ligne: number;
      data: Record<string, string>;
      erreur: string;
    }> = [];
    let ligneCourante = 0;
    const readableStream = Readable.from(csvBuffer);
    const lineProcessingPromises: Promise<void>[] = [];

    await new Promise<void>((resolveStream, rejectStream) => {
      readableStream
        .pipe(
          csvParser({
            ...parsingOptions,
            separator:";",
            ...(!parsingOptions.headers && {
              mapHeaders: mapHeadersConfig
                ? ({ header }: { header: string }) => {
                    const found = mapHeadersConfig.find(
                      (conf) => conf.header === header
                    );
                    return found?.newHeader || header.trim().toLowerCase();
                  }
                : ({ header }: { header: string }) =>
                    header.trim().toLowerCase(),
              headers: csvHeaders.length > 0 ? csvHeaders : undefined,
            }),
          })
        )
        .on("data", (row) => {
          ligneCourante++;
          const currentLine = ligneCourante;
          const processLine = async () => {
            try {
              const item = await processRowFn(row, userId, additionalContext);
              if (item) {
                              console.table(`--> [DEBUG] ImportService: ${item} à importer.`);

                itemsAImporter.push(item);
              }
            } catch (err) {
              erreursImport.push({
                ligne: currentLine,
                data: row,
                erreur:
                  err instanceof Error
                    ? err.message
                    : "Erreur inconnue de traitement de ligne",
              });
            }
          };
          lineProcessingPromises.push(processLine());
        })
        .on("end", async () => {
          try {
            await Promise.allSettled(lineProcessingPromises);

            if (itemsAImporter.length > 0) {
              
              try {
                await model.create(itemsAImporter);
                return resolveStream();
              } catch (dbError) {
                if (dbError instanceof Error) {
                  erreursImport.push({
                    ligne: 0,
                    data: {},
                    erreur: `Erreur d'insertion en base de données: ${dbError.message}`,
                  });
                }
                return rejectStream(dbError);
              }
            } else {
              return resolveStream();
            }
          } catch (error) {
            return rejectStream(error);
          }
        })
        .on("error", (err) => {
          rejectStream(err);
        });
    });

    return {
      message: `Import terminé. ${itemsAImporter.length} ${entityName}s importés. ${erreursImport.length} erreurs.`,
      totalLignesLues: ligneCourante,
      importedCount: itemsAImporter.length,
      errorCount: erreursImport.length,
      erreurs: erreursImport,
    };
  }

  static async importDepensesCsv(
    csvBuffer: Buffer,
    userId: string
  ): Promise<ImportResultType> {
    const categorieDocs = await Categorie.find()
      .select("nom _id")
      .lean();
    const categorieMap = new Map(
      categorieDocs.map((cat) => [
        String(cat.nom).toLowerCase(),
        String(cat._id),
      ])
    );

    const getOrCreateCategorieId = async (nom: string) => {
      const nomLower = nom.toLowerCase();

      if (categorieMap.has(nomLower)) {
        return new mongoose.Types.ObjectId(categorieMap.get(nomLower));
      }

      const escapedNom = nom.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const existingCat = await Categorie.findOne({
        nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
      })
        .select("_id")
        .lean();

      if (existingCat && existingCat._id) {
        const idStr = String(existingCat._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      const exactMatch = await Categorie.findOne({ nom: nom })
        .select("_id")
        .lean();
      if (exactMatch && exactMatch._id) {
        const idStr = String(exactMatch._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      try {
        const newCat = await Categorie.create({
          nom,
          description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
        });

        if (newCat && newCat._id) {
          const idStr = String(newCat._id);
          categorieMap.set(nomLower, idStr);
          return new mongoose.Types.ObjectId(idStr);
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error as MongoError).code === 11000
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));

          const duplicateCat = await Categorie.findOne({
            nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
          }).lean();

          if (duplicateCat && duplicateCat._id) {
            const idStr = String(duplicateCat._id);
            categorieMap.set(nomLower, idStr);
            return new mongoose.Types.ObjectId(idStr);
          }
        }
      }

      return null;
    };
    const processDepenseRow = async (
      row: Record<string, string>,
      userId: string
    ): Promise<Record<string, unknown> | null> => {
      const {
        date: dateStr,
        montant: montantStr,
        categorie: categorieStr,
        description,
      } = row;
      if (!dateStr || !montantStr || !categorieStr)
        throw new Error("Données manquantes (date, montant, catégorie)");
      const expectedDateFormat = "dd/MM/yyyy";
      const date = parse(dateStr, expectedDateFormat, new Date());
      if (!isValid(date))
        throw new Error(
          `Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat}`
        );
      const montantNumerique = parseFloat(montantStr.replace(",", "."));
      if (isNaN(montantNumerique) || montantNumerique <= 0)
        throw new Error(`${DEPENSE.ERRORS.INVALID_MONTANT}: ${montantStr}`);
      const categorieId = await getOrCreateCategorieId(categorieStr.trim());
      if (!categorieId)
        throw new Error(
          `Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`
        );
      return {
        date,
        montant: montantNumerique,
        categorie: categorieId,
        description: description ? description.trim() : undefined,
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeDepense: DEPENSE.TYPES_DEPENSE.PERSO,
        typeCompte: DEPENSE.TYPES_COMPTE.PERSO,
        estChargeFixe: false,
      };
    };
    // Mapping des en-têtes pour accepter les colonnes du CSV bancaire
    const mapHeadersConfig = [
      { header: "date", newHeader: "date" },
      { header: "montant", newHeader: "montant" },
      { header: "Categorie", newHeader: "categorie" },
      { header: "Categorie ", newHeader: "categorie" }, // gestion espace éventuel
      { header: "libellé", newHeader: "description" },
      { header: "libelle", newHeader: "description" },
      { header: "description", newHeader: "description" },
    ];
    return this.processCsvImport({
      csvBuffer,
      userId,
      model: DepenseModel as unknown as mongoose.Model<Record<string, unknown>>,
      entityName: "dépense",
      csvHeaders: ["date", "montant", "categorie", "description"],
      mapHeadersConfig,
      processRowFn: processDepenseRow,
    });
  }

  static async importRevenusCsv(
    csvBuffer: Buffer,
    userId: string
  ): Promise<ImportResultType> {
    const categorieRevenuDocs = await CategorieRevenuModel.find({
      utilisateur: userId,
    })
      .select("nom _id")
      .lean();

    const categorieRevenuMap = new Map(
      categorieRevenuDocs.map((cat) => [
        String(cat.nom).toLowerCase(),
        String(cat._id),
      ])
    );

    const getOrCreateCategorieRevenuId = async (nom: string) => {
      const nomLower = nom.toLowerCase();

      if (categorieRevenuMap.has(nomLower)) {
        return new mongoose.Types.ObjectId(categorieRevenuMap.get(nomLower));
      }

      const escapedNom = nom.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      const existingCatRegex = await CategorieRevenuModel.findOne({
        $or: [{ utilisateur: userId }, { utilisateur: { $exists: false } }],
        nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
      })
        .select("_id")
        .lean();

      if (existingCatRegex && existingCatRegex._id) {
        const idStr = String(existingCatRegex._id);
        categorieRevenuMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }
      const exactMatch = await CategorieRevenuModel.findOne({
        nom: nom,
        $or: [{ utilisateur: userId }, { utilisateur: { $exists: false } }],
      })
        .select("_id")
        .lean();

      if (exactMatch && exactMatch._id) {
        const idStr = String(exactMatch._id);
        categorieRevenuMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      try {
        const newCatData = {
          nom,
          description: CATEGORIE_REVENU.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
          utilisateur: userId,
        };

        const newCat = await CategorieRevenuModel.create(newCatData);

        if (newCat && newCat._id) {
          const idStr = String(newCat._id);
          categorieRevenuMap.set(nomLower, idStr);
          return new mongoose.Types.ObjectId(idStr);
        } else {
          throw new Error(
            `Échec de la création de la catégorie de revenu "${nom}" : pas d'ID retourné.`
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
          const mongoError = error as MongoError;

          if (mongoError.code === 11000) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            const duplicateCat = await CategorieRevenuModel.findOne({
              nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
              $or: [
                { utilisateur: userId },
                { utilisateur: { $exists: false } },
              ],
            })
              .select("_id")
              .lean();

            if (duplicateCat && duplicateCat._id) {
              const idStr = String(duplicateCat._id);
              categorieRevenuMap.set(nomLower, idStr);
              return new mongoose.Types.ObjectId(idStr);
            }
          } else {
            throw new Error(
              `Erreur lors de la création de la catégorie de revenu "${nom}". Détails: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        } else {
          throw new Error(
            `Erreur inconnue lors de la création de la catégorie de revenu "${nom}". Détails: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
        throw new Error(
          `Échec de la création/récupération de la catégorie de revenu "${nom}". Détails: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      return null;
    };
    const processRevenuRow = async (
      row: Record<string, string>,
      userId: string
    ): Promise<Record<string, unknown> | null> => {
      if (
        Object.keys(row).length === 0 ||
        Object.values(row).every(
          (val) => val === "" || val === null || val === undefined
        )
      ) {
        return null;
      }

      const dateRaw = row['date'];
      const montantRaw = row['montant'];
      const descriptionRaw = row['description'];
      const categorieNomRaw = row['categorie'] || row['catégorie'];
      const typeCompteRaw = row['type de compte'] || row['typecompte'] || 'Perso';
      const estRecurrentRaw = row['récurrent'] || row['recurrent'] || 'non';

      if (!montantRaw || !descriptionRaw || !dateRaw || !categorieNomRaw) {
        throw new Error(`Champs requis manquants: date, montant, description, catégorie sont requis.`);
      }

      const categorieId = await getOrCreateCategorieRevenuId(categorieNomRaw.trim());

      if (!categorieId) {
        throw new Error(`Catégorie de revenu non trouvée ou impossible à créer: '${categorieNomRaw}'`);
      }
      
      const parseDateLocal = (dateStr: string): Date | null => {
        const expectedFormats = ["dd/MM/yyyy", "yyyy-MM-dd"];
        for (const format of expectedFormats) {
          const parsed = parse(dateStr, format, new Date());
          if (isValid(parsed)) {
            return parsed;
          }
        }
        return null;
      };

      const parsedDate = parseDateLocal(dateRaw.trim());
      if (!parsedDate) {
        throw new Error(
          `Format de date invalide pour la date: ${dateRaw}. Formats attendus: dd/MM/yyyy ou yyyy-MM-dd`
        );
      }

      const montantNumerique = parseFloat(montantRaw.replace(",", ".").replace(/\s/g, ''));
      if (isNaN(montantNumerique) || montantNumerique <= 0) {
        throw new Error(`${REVENU.ERRORS.INVALID_MONTANT}: ${montantRaw}`);
      }
      
      const parseBooleanLocal = (value: string): boolean => {
        if (!value) return false;
        const lowerValue = value.trim().toLowerCase();
        return ['vrai', 'true', 'oui', '1', 'yes'].includes(lowerValue);
      };

      const estRecurrentBool = parseBooleanLocal(estRecurrentRaw);
      
      const trimmedTypeCompte = typeCompteRaw.trim() as TypeCompteRevenu;
      const typeCompteValide = Object.values(REVENU.TYPES_COMPTE).includes(trimmedTypeCompte)
        ? trimmedTypeCompte
        : REVENU.TYPES_COMPTE.PERSO;

      const revenuObj = {
        date: parsedDate,
        montant: montantNumerique,
        categorieRevenu: categorieId,
        description: descriptionRaw.trim(),
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeCompte: typeCompteValide,
        estRecurrent: estRecurrentBool,
      };

      return revenuObj;
    };

    const result = await this.processCsvImport({
      csvBuffer,
      userId,
      model: RevenuModel as unknown as mongoose.Model<Record<string, unknown>>,
      entityName: "Revenu",
      csvHeaders: [],
      processRowFn: processRevenuRow,
      additionalContext: { getOrCreateCategorieRevenuId },
    });

    return result;
  }
}
