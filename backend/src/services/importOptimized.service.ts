// Fichier optimisé et refactorisé à partir de import.service.ts
// Ce fichier sépare les fonctions utilitaires, le mapping, et les processRowFn pour une meilleure lisibilité.

import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import { parse, isValid } from "date-fns";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import Categorie from "../models/categorie.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { DEPENSE, CATEGORIE, CATEGORIE_REVENU, REVENU } from "../constants";
import { TypeCompteRevenu } from "../types/revenu.types";
import { TypeCompteEnum, TypeDepenseEnum } from "../types/depense.types";

// --- Types ---
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
interface MongoError extends Error { code?: number; }
interface ProcessImportProps {
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
  separator?: string;
}

interface CategorieGenericProps {
  nom: string;
  map: Map<string, string>;
  model: mongoose.Model<Record<string, unknown>>;
  userId?: string;
  description: string;
  userField?: string;
}

// --- Utilitaires génériques ---
function normalize(str: string) {
  return (str || "").trim().toLowerCase();
}

async function getOrCreateCategorieGeneric({
  nom,
  map,
  model,
  userId,
  description,
  userField
}: CategorieGenericProps): Promise<mongoose.Types.ObjectId | null> {
  const nomLower = normalize(nom);
  if (map.has(nomLower)) return new mongoose.Types.ObjectId(map.get(nomLower));
  const escapedNom = nom.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const query: Record<string, unknown> = { nom: { $regex: new RegExp(`^${escapedNom}$`, "i") } };
  if (userField && userId) query[userField] = userId;
  let found = await model.findOne(query).select("_id").lean();
  if (!found && userField && userId) {
    // Essai sans userId si pas trouvé
    found = await model.findOne({ nom: query.nom }).select("_id").lean();
  }
  if (found && found._id) {
    const idStr = String(found._id);
    map.set(nomLower, idStr);
    return new mongoose.Types.ObjectId(idStr);
  }
  try {
  const data: Record<string, unknown> = { nom, description };
    if (userField && userId) data[userField] = userId;
    const newCat = await model.create(data);
    if (newCat && newCat._id) {
      const idStr = String(newCat._id);
      map.set(nomLower, idStr);
      return new mongoose.Types.ObjectId(idStr);
    }
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as MongoError).code === 11000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const dupl = await model.findOne(query).select("_id").lean();
      if (dupl && dupl._id) {
        const idStr = String(dupl._id);
        map.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }
    }
  }
  return null;
}

function getCommonMapHeaders(type: "depense" | "revenu") {
  const base = [
    { header: "date", newHeader: "date" },
    { header: "type de compte", newHeader: "typeCompte" },
    { header: "typecompte", newHeader: "typeCompte" },
    { header: "Categorie", newHeader: "categorie" },
    { header: "Categorie ", newHeader: "categorie" },
    { header: "catégorie", newHeader: "categorie" },
    { header: "libellé", newHeader: "description" },
    { header: "libelle", newHeader: "description" },
    { header: "description", newHeader: "description" },
    { header: "récurrent", newHeader: "estRecurrent" },
    { header: "recurrent", newHeader: "estRecurrent" }
  ];
  if (type === "depense") {
    base.push(
      ...DEPENSE.ALLOWED_HEADER.map((header) => ({ header, newHeader: "debit" })),
    );
  }
  if (type === "revenu") {
    base.push(
        ...REVENU.ALLOWED_HEADER.map((header) => ({ header, newHeader: "credit" })),

    );
  }
  return base;
}

function parseDateFlexible(dateStr: string): Date | null {
  const formats = ["dd/MM/yyyy", "yyyy-MM-dd"];
  for (const format of formats) {
    const parsed = parse(dateStr, format, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

function parseMontant(montant: string): number {
  return parseFloat(montant.replace(",", ".").replace(/\s/g, ""));
}

function parseBoolean(value: string): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return ["vrai", "true", "oui", 1, "yes"].includes(lower);
}

// --- Générique : import CSV ---
export async function processCsvImport({
  csvBuffer,
  userId,
  model,
  entityName,
  mapHeadersConfig,
  processRowFn,
  parsingOptions = {},
  additionalContext = {},
  separator = ";"
}: ProcessImportProps): Promise<ImportResultType> {
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
          separator,
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
          }),
        })
      )
      .on("data", (row) => {
        ligneCourante++;
        const processLine = async () => {
          try {
            const item = await processRowFn(row, userId, additionalContext);
            if (item) itemsAImporter.push(item);
          } catch (err) {
            erreursImport.push({
              ligne: ligneCourante,
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

// --- Import Dépenses ---
export async function importDepensesCsvOptimized(
  csvBuffer: Buffer,
  userId: string
): Promise<ImportResultType> {
  const categorieDocs = await Categorie.find().select("nom _id").lean();
  const categorieMap = new Map(
    categorieDocs.map((cat) => [normalize(cat.nom), String(cat._id)])
  );
  return processCsvImport({
    csvBuffer,
    userId,
    model: DepenseModel as unknown as mongoose.Model<Record<string, unknown>>,
    entityName: "dépense",
    csvHeaders: ["date", ...DEPENSE.ALLOWED_HEADER, "categorie", "description"],
    mapHeadersConfig: [
      ...getCommonMapHeaders("depense"),
      ...DEPENSE.ALLOWED_HEADER.map((header) => ({ header, newHeader: "montant" })),
    ],
    processRowFn: async (row, userId): Promise<{
      date: Date;
      montant: number;
      categorie: mongoose.Types.ObjectId
      description?: string
      utilisateur: mongoose.Types.ObjectId
      typeDepense: TypeDepenseEnum
      typeCompte: TypeCompteEnum
      estChargeFixe: boolean
    }> => {
      // On accepte "Débit"/"debit" comme champ montant
      const { date, categorie, description } = row;
      
      let montant = row["debit"];
      if (!montant) {
        for (const alias of DEPENSE.ALLOWED_HEADER) {
          if (row[alias] !== undefined) {
            montant = row[alias];
            break;
          }
        }
      }
      if (!date || !montant || !categorie)
        throw new Error("Données manquantes (date, montant, catégorie)");
      const parsedDate = parseDateFlexible(date);
      if (!parsedDate)
        throw new Error(`Date invalide: ${date}. Format attendu: dd/MM/yyyy ou yyyy-MM-dd`);
      const montantNumerique = parseMontant(montant);
      if (isNaN(montantNumerique) || montantNumerique >= 0)
        throw new Error(`${DEPENSE.ERRORS.INVALID_MONTANT}: ${montant}`);
      const categorieId = await getOrCreateCategorieGeneric({
        nom: categorie,
        map: categorieMap,
        model: Categorie as unknown as mongoose.Model<Record<string, unknown>>,
        description: CATEGORIE.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
      });
      if (!categorieId)
        throw new Error(`Impossible d'obtenir l'ID pour la catégorie '${categorie}'`);

      console.log(`Import de dépense: date=${parsedDate}, montant=${montantNumerique}, catégorie=${categorieId}, description=${description}, utilisateur=${userId}`);
    
      return {
        date: parsedDate,
        montant: montantNumerique,
        categorie: categorieId,
        description: description ? description.trim() : undefined,
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeDepense: DEPENSE.TYPES_DEPENSE.PERSO,
        typeCompte: row["typeCompte"]?.trim() as TypeCompteEnum || DEPENSE.TYPES_COMPTE.PERSO,
        estChargeFixe: parseBoolean(row["estChargeFixe"]),
      };
    },
  });
}


// --- Import Revenus ---
export async function importRevenusCsvOptimized(
  csvBuffer: Buffer,
  userId: string
): Promise<ImportResultType> {
  const categorieRevenuDocs = await CategorieRevenuModel.find({ utilisateur: userId })
    .select("nom _id")
    .lean();
  const categorieRevenuMap = new Map(
    categorieRevenuDocs.map((cat) => [normalize(cat.nom), String(cat._id)])
  );
  return processCsvImport({
    csvBuffer,
    userId,
    model: RevenuModel as unknown as mongoose.Model<Record<string, unknown>>,
    entityName: "Revenu",
    csvHeaders: ["date", ...REVENU.ALLOWED_HEADER, "categorie", "description", "typeCompte", "estRecurrent"],
    mapHeadersConfig: [
      ...getCommonMapHeaders("revenu"),
      ...REVENU.ALLOWED_HEADER.map((header) => ({ header, newHeader: "credit" })),
    ],
    processRowFn: async (row, userId) => {
      if (
        Object.keys(row).length === 0 ||
        Object.values(row).every((val) => val === "" || val === null || val === undefined)
      ) {
        return null;
      }
      const { date, description, categorie, typeCompte, estRecurrent } = row;
      // Cherche la clé du montant ("credit" ou un alias)
      let montant = row["credit"];
      if (!montant) {
        for (const alias of REVENU.ALLOWED_HEADER) {
          if (row[alias] !== undefined) {
            montant = row[alias];
            break;
          }
        }
      }
      if (!montant || !description || !date || !categorie) {
        throw new Error(`Champs requis manquants: date, montant, description, catégorie sont requis.`);
      }
      const categorieId = await getOrCreateCategorieGeneric({
        nom: categorie,
        map: categorieRevenuMap,
        model: CategorieRevenuModel as unknown as mongoose.Model<Record<string, unknown>>,
        userId,
        description: CATEGORIE_REVENU.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
        userField: "utilisateur",
      });
      if (!categorieId) {
        throw new Error(`Catégorie de revenu non trouvée ou impossible à créer: '${categorie}'`);
      }
      const parsedDate = parseDateFlexible(date);
      if (!parsedDate) {
        throw new Error(`Format de date invalide pour la date: ${date}. Formats attendus: dd/MM/yyyy ou yyyy-MM-dd`);
      }
      const montantNumerique = parseMontant(montant);
      if (isNaN(montantNumerique) || montantNumerique <= 0) {
        throw new Error(`${REVENU.ERRORS.INVALID_MONTANT}: ${montant}`);
      }
      const estRecurrentBool = parseBoolean(estRecurrent);
      const trimmedTypeCompte = (typeCompte || "Perso").trim() as TypeCompteRevenu;
      const typeCompteValide = Object.values(REVENU.TYPES_COMPTE).includes(trimmedTypeCompte)
        ? trimmedTypeCompte
        : REVENU.TYPES_COMPTE.PERSO;
      return {
        date: parsedDate,
        montant: montantNumerique,
        categorieRevenu: categorieId,
        description: description.trim(),
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeCompte: typeCompteValide,
        estRecurrent: estRecurrentBool,
      };
    },
  });
}
