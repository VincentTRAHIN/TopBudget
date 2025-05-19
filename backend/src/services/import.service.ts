import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import Categorie from "../models/categorie.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { DEPENSE, CATEGORIE } from "../constants";
import { parse, isValid } from "date-fns";
import { IDepenseInput } from "../types/depense.types";
import { IRevenuInput, TypeCompteRevenu } from "../types/revenu.types";

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
    const headers = csvHeaders;
    const mapHeaders = mapHeadersConfig
      ? ({ header }: { header: string }) => {
          const found = mapHeadersConfig.find(
            (conf) => conf.header === header
          );
          return found?.newHeader || header.trim().toLowerCase();
        }
      : ({ header }: { header: string }) => header.trim().toLowerCase();
    await new Promise<void>((resolveStream, rejectStream) => {
      readableStream
        .pipe(
          csvParser({
            ...parsingOptions,
            mapHeaders,
            headers,
          })
        )
        .on("data", (row) => {
          ligneCourante++;
          const currentLine = ligneCourante;
          const processLine = async () => {
            try {
              const item = await processRowFn(row, userId, additionalContext);
              if (item) itemsAImporter.push(item);
            } catch (err) {
              erreursImport.push({
                ligne: currentLine,
                data: row,
                erreur: err instanceof Error ? err.message : "Erreur inconnue de traitement de ligne",
              });
            }
          };
          lineProcessingPromises.push(processLine());
        })
        .on("end", async () => {
          await Promise.allSettled(lineProcessingPromises);
          if (itemsAImporter.length > 0) {
            try {
              await model.insertMany(itemsAImporter, {
                ordered: false,
              });
            } catch {
              // Optionally handle dbError
            }
          }
          resolveStream();
        })
        .on("error", (err) => {
          rejectStream(err);
        });
    });
    return {
      message: `Import terminé. ${itemsAImporter.length} ${entityName}s à importer. ${erreursImport.length} erreurs.`,
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
    const categorieDocs = await Categorie.find().lean();
    const categorieMap = new Map(
      categorieDocs.map((cat) => [String(cat.nom).toLowerCase(), String(cat._id)])
    );
    const getOrCreateCategorieId = async (nom: string) => {
      const nomLower = nom.toLowerCase();
      if (categorieMap.has(nomLower)) return new mongoose.Types.ObjectId(categorieMap.get(nomLower));
      const cat = await Categorie.findOneAndUpdate(
        { nom: { $regex: new RegExp(`^${nom}$`, "i") } },
        {
          $setOnInsert: {
            nom,
            description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
          },
        },
        { new: true, upsert: true, lean: true }
      );
      if (cat && cat._id) {
        const idStr = String(cat._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }
      return null;
    };
    const processDepenseRow = async (
      row: Record<string, string>,
      userId: string
    ): Promise<Record<string, unknown> | null> => {
      const { date: dateStr, montant: montantStr, categorie: categorieStr, description } = row;
      if (!dateStr || !montantStr || !categorieStr)
        throw new Error("Données manquantes (date, montant, catégorie)");
      const expectedDateFormat = "dd/MM/yyyy";
      const date = parse(dateStr, expectedDateFormat, new Date());
      if (!isValid(date))
        throw new Error(`Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat}`);
      const montantNumerique = parseFloat(montantStr.replace(",", "."));
      if (isNaN(montantNumerique) || montantNumerique <= 0)
        throw new Error(`${DEPENSE.ERRORS.INVALID_MONTANT}: ${montantStr}`);
      const categorieId = await getOrCreateCategorieId(categorieStr.trim());
      if (!categorieId)
        throw new Error(`Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`);
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
    return this.processCsvImport({
      csvBuffer,
      userId,
      model: DepenseModel as unknown as mongoose.Model<Record<string, unknown>>,
      entityName: "dépense",
      csvHeaders: ["date", "montant", "categorie", "description"],
      processRowFn: processDepenseRow,
    });
  }

  static async importRevenusCsv(
    csvBuffer: Buffer,
    userId: string
  ): Promise<ImportResultType> {
    const categorieDocs = await CategorieRevenuModel.find().lean();
    const categorieMap = new Map(
      categorieDocs.map((cat) => [String(cat.nom).toLowerCase(), String(cat._id)])
    );
    const getOrCreateCategorieRevenuId = async (nom: string) => {
      const nomLower = nom.toLowerCase();
      if (categorieMap.has(nomLower)) return new mongoose.Types.ObjectId(categorieMap.get(nomLower));
      const cat = await CategorieRevenuModel.findOneAndUpdate(
        { nom: { $regex: new RegExp(`^${nom}$`, "i") } },
        {
          $setOnInsert: {
            nom,
            description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
          },
        },
        { new: true, upsert: true, lean: true }
      );
      if (cat && cat._id) {
        const idStr = String(cat._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }
      return null;
    };
    const processRevenuRow = async (
      row: Record<string, string>,
      userId: string
    ): Promise<Record<string, unknown> | null> => {
      const { date: dateStr, montant: montantStr, categorie: categorieStr, description, type_compte: typeCompteStr } = row;
      if (!dateStr || !montantStr || !categorieStr)
        throw new Error("Données manquantes (date, montant, catégorie)");
      
      const expectedDateFormat = "dd/MM/yyyy";
      const date = parse(dateStr, expectedDateFormat, new Date());
      if (!isValid(date))
        throw new Error(`Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat}`);
      
      const montantNumerique = parseFloat(montantStr.replace(",", "."));
      if (isNaN(montantNumerique) || montantNumerique <= 0)
        throw new Error(`Montant invalide: ${montantStr}`);
      
      const categorieId = await getOrCreateCategorieRevenuId(categorieStr.trim());
      if (!categorieId)
        throw new Error(`Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`);
      
      // Validation du type de compte
      let typeCompte: TypeCompteRevenu = "Perso"; // Par défaut
      if (typeCompteStr) {
        const typeCompteValue = typeCompteStr.trim();
        if (typeCompteValue.toLowerCase() === "perso") {
          typeCompte = "Perso";
        } else if (typeCompteValue.toLowerCase() === "conjoint") {
          typeCompte = "Conjoint";
        } else {
          throw new Error(`Type de compte invalide: ${typeCompteStr}. Valeurs acceptées: Perso, Conjoint`);
        }
      }
      
      return {
        date,
        montant: montantNumerique,
        categorie: categorieId,
        description: description ? description.trim() : undefined,
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeCompte,
      };
    };
    
    return this.processCsvImport({
      csvBuffer,
      userId,
      model: RevenuModel as unknown as mongoose.Model<Record<string, unknown>>,
      entityName: "revenu",
      csvHeaders: ["date", "montant", "categorie", "description", "type_compte"],
      processRowFn: processRevenuRow,
    });
  }
} 