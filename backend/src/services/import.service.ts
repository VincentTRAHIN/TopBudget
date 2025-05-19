import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import Categorie from "../models/categorie.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { DEPENSE, CATEGORIE, CATEGORIE_REVENU } from "../constants";
import { parse, isValid } from "date-fns";
import {  TypeCompteRevenu } from "../types/revenu.types";

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

// Interface pour les erreurs MongoDB avec un code
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
      context?: Record<string, unknown>,
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

    try {
      await new Promise<void>((resolveStream, rejectStream) => {
        readableStream
          .pipe(
            csvParser({
              ...parsingOptions,
              // Si headers est déjà défini dans parsingOptions, l'utiliser
              // Sinon, utiliser le mapHeadersConfig s'il est défini
              ...(!parsingOptions.headers && {
                mapHeaders: mapHeadersConfig
                  ? ({ header }: { header: string }) => {
                      const found = mapHeadersConfig.find(
                        (conf) => conf.header === header,
                      );
                      return found?.newHeader || header.trim().toLowerCase();
                    }
                  : ({ header }: { header: string }) => header.trim().toLowerCase(),
                headers: csvHeaders.length > 0 ? csvHeaders : undefined,
              }),
            }),
          )
          .on("data", (row) => {
            ligneCourante++;
            const currentLine = ligneCourante;
            const processLine = async () => {
              try {
                console.log(`[DEBUG] Traitement ligne ${currentLine}:`, JSON.stringify(row));
                const item = await processRowFn(row, userId, additionalContext);
                if (item) {
                  console.log(`[DEBUG] Ligne ${currentLine} validée:`, JSON.stringify(item));
                  itemsAImporter.push(item);
                }
              } catch (err) {
                console.error(`[ERROR] Erreur lors du traitement de la ligne ${currentLine}:`, err);
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
                console.log(`[DEBUG] Tentative d'insertion de ${itemsAImporter.length} ${entityName}s en base de données...`);
                console.log('[DEBUG] Premier document à insérer:', JSON.stringify(itemsAImporter[0]));
                
                try {
                  const insertResult = await model.create(itemsAImporter);
                  const insertedCount = Array.isArray(insertResult) ? insertResult.length : 1;
                  console.log(`[DEBUG] Insertion réussie de ${insertedCount} documents en base de données`);
                  
                  return resolveStream();
                } catch (dbError) {
                  console.error('[ERROR] Erreur lors de l\'insertion en base de données:', dbError);
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
                console.log('[DEBUG] Aucun document à insérer');
                return resolveStream();
              }
            } catch (error) {
              console.error(`[ERROR] Erreur lors du traitement final:`, error);
              return rejectStream(error);
            }
          })
          .on("error", (err) => {
            console.error(`[ERROR] Erreur lors du parsing du CSV:`, err);
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
    } catch (error) {
      console.error(`[ERROR] Erreur globale lors de l'import:`, error);
      throw error;
    }
  }

  static async importDepensesCsv(
    csvBuffer: Buffer,
    userId: string,
  ): Promise<ImportResultType> {
    const categorieDocs = await Categorie.find().lean();
    const categorieMap = new Map(
      categorieDocs.map((cat) => [
        String(cat.nom).toLowerCase(),
        String(cat._id),
      ]),
    );

    const getOrCreateCategorieId = async (nom: string) => {
      const nomLower = nom.toLowerCase();
      
      // 1. Vérifier d'abord dans le cache en mémoire si la catégorie existe déjà
      if (categorieMap.has(nomLower)) {
        return new mongoose.Types.ObjectId(categorieMap.get(nomLower));
      }

      // 2. Rechercher la catégorie dans la base de données de manière insensible à la casse
      const escapedNom = nom.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const existingCat = await Categorie.findOne({
        nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
      }).lean();

      if (existingCat && existingCat._id) {
        const idStr = String(existingCat._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      // 3. Rechercher une deuxième fois avec une requête exacte pour éviter les conflits
      const exactMatch = await Categorie.findOne({ nom: nom }).lean();
      if (exactMatch && exactMatch._id) {
        const idStr = String(exactMatch._id);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      // 4. Si la catégorie n'existe pas, la créer avec gestion de conflit
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
        // En cas d'erreur de duplication, rechercher à nouveau la catégorie
        if (error instanceof Error && 'code' in error && (error as MongoError).code === 11000) {
          // Attendre un petit délai pour laisser la base de données se mettre à jour
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
      userId: string,
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
          `Date invalide: ${dateStr}. Format attendu: ${expectedDateFormat}`,
        );
      const montantNumerique = parseFloat(montantStr.replace(",", "."));
      if (isNaN(montantNumerique) || montantNumerique <= 0)
        throw new Error(`${DEPENSE.ERRORS.INVALID_MONTANT}: ${montantStr}`);
      const categorieId = await getOrCreateCategorieId(categorieStr.trim());
      if (!categorieId)
        throw new Error(
          `Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`,
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
    userId: string,
  ): Promise<ImportResultType> {
    console.log('[DEBUG] Début de l\'import des revenus');
    
    // Analyser les premières lignes du CSV pour comprendre sa structure
    const bufferString = csvBuffer.toString('utf-8');
    const lines = bufferString.split('\n').slice(0, 5); // Prendre les 5 premières lignes
    console.log('[DEBUG] Aperçu du fichier CSV:');
    lines.forEach((line, index) => {
      console.log(`[DEBUG] Ligne ${index}: ${line}`);
    });
    
    const categorieDocs = await CategorieRevenuModel.find({ utilisateur: userId }).lean();
    console.log(`[DEBUG] ${categorieDocs.length} catégories de revenus trouvées`);
    
    const categorieMap = new Map(
      categorieDocs.map((cat) => [
        String(cat.nom).toLowerCase(),
        String(cat._id),
      ]),
    );

    const getOrCreateCategorieRevenuId = async (nom: string) => {
      console.log(`[DEBUG] Recherche/création de la catégorie de revenu: ${nom}`);
      const nomLower = nom.toLowerCase();
      
      // 1. Vérifier d'abord dans le cache en mémoire si la catégorie existe déjà
      if (categorieMap.has(nomLower)) {
        console.log(`[DEBUG] Catégorie trouvée dans le cache: ${nom} => ${categorieMap.get(nomLower)}`);
        return new mongoose.Types.ObjectId(categorieMap.get(nomLower));
      }

      // 2. Rechercher la catégorie dans la base de données de manière insensible à la casse
      const escapedNom = nom.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      console.log(`[DEBUG] Recherche par regex: ${escapedNom}`);
      
      // Recherche exacte insensible à la casse
      const existingCat = await CategorieRevenuModel.findOne({
        nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
        utilisateur: userId
      }).lean();
      
      // Si pas trouvé, essayer une recherche plus souple (contient le nom)
      if (!existingCat) {
        console.log(`[DEBUG] Recherche étendue pour: ${nom}`);
        const similarCats = await CategorieRevenuModel.find({
          nom: { $regex: new RegExp(escapedNom, "i") },
          utilisateur: userId
        }).lean();
        
        if (similarCats && similarCats.length > 0) {
          // Prendre la correspondance la plus proche
          console.log(`[DEBUG] ${similarCats.length} catégories similaires trouvées`);
          const closestMatch = similarCats[0];
          const idStr = String(closestMatch._id);
          console.log(`[DEBUG] Correspondance la plus proche: ${closestMatch.nom} => ${idStr}`);
          categorieMap.set(nomLower, idStr);
          return new mongoose.Types.ObjectId(idStr);
        }
      }

      if (existingCat && existingCat._id) {
        const idStr = String(existingCat._id);
        console.log(`[DEBUG] Catégorie trouvée par regex: ${nom} => ${idStr}`);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      // 3. Rechercher une deuxième fois avec une requête exacte pour éviter les conflits
      console.log(`[DEBUG] Recherche exacte: ${nom}`);
      const exactMatch = await CategorieRevenuModel.findOne({ 
        nom: nom,
        utilisateur: userId
      }).lean();
      if (exactMatch && exactMatch._id) {
        const idStr = String(exactMatch._id);
        console.log(`[DEBUG] Catégorie trouvée par recherche exacte: ${nom} => ${idStr}`);
        categorieMap.set(nomLower, idStr);
        return new mongoose.Types.ObjectId(idStr);
      }

      // 4. Si la catégorie n'existe pas, la créer avec gestion de conflit
      console.log(`[DEBUG] Création d'une nouvelle catégorie de revenu: ${nom}`);
      try {
        // Valider le nom selon les contraintes du modèle CategorieRevenu
        if (!nom || nom.length < CATEGORIE_REVENU.VALIDATION.MIN_NOM_LENGTH || 
            nom.length > CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH) {
          console.log(`[DEBUG] Nom de catégorie invalide: ${nom}, longueur: ${nom?.length}`);
          return null;
        }
        
        const newCatData = {
          nom,
          description: CATEGORIE_REVENU.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE,
          utilisateur: userId
        };
        console.log(`[DEBUG] Données pour nouvelle catégorie:`, newCatData);
        
        const newCat = await CategorieRevenuModel.create(newCatData);
        console.log(`[DEBUG] Nouvelle catégorie créée:`, newCat);

        if (newCat && newCat._id) {
          const idStr = String(newCat._id);
          console.log(`[DEBUG] ID de la nouvelle catégorie: ${idStr}`);
          categorieMap.set(nomLower, idStr);
          return new mongoose.Types.ObjectId(idStr);
        } else {
          console.log(`[DEBUG] Échec de la création: pas d'ID retourné`);
        }
      } catch (error: unknown) {
        console.error(`[ERROR] Erreur lors de la création de la catégorie:`, error);
        
        // En cas d'erreur de duplication, rechercher à nouveau la catégorie
        if (error instanceof Error && 'code' in error) {
          const mongoError = error as MongoError;
          console.log(`[DEBUG] Code d'erreur MongoDB: ${mongoError.code}`);
          
          if (mongoError.code === 11000) {
            console.log(`[DEBUG] Erreur de duplication détectée, nouvelle tentative de recherche après délai`);
            // Attendre un petit délai pour laisser la base de données se mettre à jour
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Rechercher à nouveau dans la base de données
            console.log(`[DEBUG] Recherche après erreur de duplication: ${nom}`);
                          const duplicateCat = await CategorieRevenuModel.findOne({
                nom: { $regex: new RegExp(`^${escapedNom}$`, "i") },
                utilisateur: userId
              }).lean();

            if (duplicateCat && duplicateCat._id) {
              const idStr = String(duplicateCat._id);
              console.log(`[DEBUG] Catégorie trouvée après erreur de duplication: ${nom} => ${idStr}`);
              categorieMap.set(nomLower, idStr);
              return new mongoose.Types.ObjectId(idStr);
            } else {
              console.log(`[DEBUG] Catégorie non trouvée après erreur de duplication, recherche de correspondance proche`);
              // Dernière tentative: rechercher des correspondances similaires
              const similarCat = await CategorieRevenuModel.findOne({
                nom: { $regex: new RegExp(escapedNom.substring(0, Math.max(3, escapedNom.length - 3)), "i") },
                utilisateur: userId
              }).lean();
              
              if (similarCat && similarCat._id) {
                const idStr = String(similarCat._id);
                console.log(`[DEBUG] Catégorie similaire trouvée: ${similarCat.nom} => ${idStr}`);
                categorieMap.set(nomLower, idStr);
                return new mongoose.Types.ObjectId(idStr);
              }
            }
          }
        } else {
          console.log(`[DEBUG] L'erreur n'est pas une erreur MongoDB avec code`);
        }
      }

      // 5. Dernière tentative: forcer une création avec un suffixe de sécurité
      try {
        console.log(`[DEBUG] Tentative de création avec un suffixe de sécurité`);
        const timestamp = Date.now().toString().slice(-4);
        const suffixedNom = `${nom} (${timestamp})`;
        
        if (suffixedNom.length <= CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH) {
          const newSuffixedCat = await CategorieRevenuModel.create({
            nom: suffixedNom,
            description: `${CATEGORIE_REVENU.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE}`,
            utilisateur: userId
          });

          if (newSuffixedCat && newSuffixedCat._id) {
            const idStr = String(newSuffixedCat._id);
            console.log(`[DEBUG] Catégorie créée avec suffixe: ${suffixedNom} => ${idStr}`);
            categorieMap.set(nomLower, idStr); // On garde quand même la référence avec le nom original
            return new mongoose.Types.ObjectId(idStr);
          }
        } else {
          // Si le nom avec suffixe est trop long, essayer une version tronquée
          const maxLength = CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH - 7; // -7 pour " (XXXX)"
          const truncatedName = nom.substring(0, maxLength);
          const truncatedSuffixedNom = `${truncatedName} (${timestamp})`;
          
          console.log(`[DEBUG] Tentative avec nom tronqué: ${truncatedSuffixedNom}`);
          const newTruncatedCat = await CategorieRevenuModel.create({
            nom: truncatedSuffixedNom,
            description: `${CATEGORIE_REVENU.IMPORT.DEFAULT_DESCRIPTION_AUTOCREATE} (Nom original: ${nom})`,
            utilisateur: userId
          });
          
          if (newTruncatedCat && newTruncatedCat._id) {
            const idStr = String(newTruncatedCat._id);
            console.log(`[DEBUG] Catégorie créée avec nom tronqué: ${truncatedSuffixedNom} => ${idStr}`);
            categorieMap.set(nomLower, idStr);
            return new mongoose.Types.ObjectId(idStr);
          }
        }
      } catch (finalError) {
        console.error(`[ERROR] Échec final de la création de catégorie:`, finalError);
      }

      console.log(`[DEBUG] Échec complet, retourne null`);
      return null;
    };
    const processRevenuRow = async (
      row: Record<string, string>,
      userId: string,
    ): Promise<Record<string, unknown> | null> => {
      // Afficher le contenu complet et les clés disponibles
      console.log('[DEBUG] Contenu complet de la ligne:', JSON.stringify(row));
      console.log('[DEBUG] Clés disponibles dans row:', Object.keys(row));
      
      // Si l'objet est vide ou n'a pas de clés, on ignore cette ligne
      if (Object.keys(row).length === 0) {
        console.log('[DEBUG] Ligne ignorée: objet vide');
        return null;
      }
      
      // Approche alternative: traiter l'objet comme un tableau et prendre les valeurs par index
      // Cela peut aider si les en-têtes ne sont pas correctement détectés
      const rowValues = Object.values(row);
      console.log('[DEBUG] Valeurs disponibles par index:', rowValues);
      
      // Tenter d'extraire les données des colonnes qu'on espère être dans un ordre standard
      // Généralement: Date, Montant, Catégorie, Description, Type Compte
      let dateStr, montantStr, categorieStr, descriptionStr, typeCompteStr;
      
      if (rowValues.length >= 3) {
        // On suppose que les 3 premières colonnes sont date, montant, catégorie
        dateStr = rowValues[0];
        montantStr = rowValues[1];
        categorieStr = rowValues[2];
        
        if (rowValues.length >= 4) {
          descriptionStr = rowValues[3];
        }
        
        if (rowValues.length >= 5) {
          typeCompteStr = rowValues[4];
        }
      } else {
        // Essayer l'approche précédente basée sur les noms des colonnes
        const detectColumn = (possibleNames: string[]): string | undefined => {
          for (const name of possibleNames) {
            if (row[name] !== undefined) {
              return row[name];
            }
          }
          return undefined;
        };
        
        dateStr = detectColumn(['date', 'Date', 'DATE']);
        montantStr = detectColumn(['montant', 'Montant', 'MONTANT', 'amount', 'Amount', 'AMOUNT']);
        categorieStr = detectColumn(['categorie', 'Categorie', 'CATEGORIE', 'categorieRevenu', 'CategorieRevenu']);
        descriptionStr = detectColumn(['description', 'Description', 'DESCRIPTION', 'desc', 'Desc', 'libelle', 'Libelle', 'LIBELLE']);
        typeCompteStr = detectColumn(['type_compte', 'TypeCompte', 'typeCompte', 'Type compte', 'type compte', 'TYPE COMPTE']);
      }
      
      console.log('[DEBUG] Champs détectés:', { dateStr, montantStr, categorieStr, descriptionStr, typeCompteStr });
      
      if (!dateStr || !montantStr || !categorieStr)
        throw new Error("Données manquantes (date, montant, catégorie)");

      // Essayer différents formats de date
      let date: Date | null = null;
      const dateFormats = ["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy"];
      
      for (const format of dateFormats) {
        const parsedDate = parse(dateStr, format, new Date());
        if (isValid(parsedDate)) {
          date = parsedDate;
          break;
        }
      }
      
      if (!date || !isValid(date)) {
        throw new Error(`Date invalide: ${dateStr}. Formats acceptés: ${dateFormats.join(", ")}`);
      }

      // Nettoyer et convertir le montant
      const montantClean = montantStr.replace(/[^\d.,]/g, "").replace(",", ".");
      const montantNumerique = parseFloat(montantClean);
      
      if (isNaN(montantNumerique) || montantNumerique <= 0)
        throw new Error(`Montant invalide: ${montantStr}`);

      console.log(`[DEBUG] Récupération/création de la catégorie: ${categorieStr.trim()}`);
      const categorieId = await getOrCreateCategorieRevenuId(
        categorieStr.trim(),
      );
      
      if (!categorieId) {
        console.log(`[ERROR] Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`);
        throw new Error(
          `Impossible d'obtenir l'ID pour la catégorie '${categorieStr}'`,
        );
      }
      
      console.log(`[DEBUG] ID de catégorie obtenu: ${categorieId}`);

      let typeCompte: TypeCompteRevenu = "Perso";
      if (typeCompteStr) {
        const typeCompteValue = typeCompteStr.trim();
        if (typeCompteValue.toLowerCase() === "perso") {
          typeCompte = "Perso";
        } else if (typeCompteValue.toLowerCase() === "conjoint") {
          typeCompte = "Conjoint";
        } else {
          typeCompte = "Perso"; // Par défaut Perso même si la valeur n'est pas reconnue
        }
      }

      const description = descriptionStr 
        ? descriptionStr.trim() 
        : `Revenu de ${categorieStr.trim()}`;

      console.log(`[DEBUG] Données validées: date=${dateStr} (${date.toISOString()}), montant=${montantNumerique}, categorie=${categorieStr}, description=${description}`);
      
      const revenuObj = {
        date,
        montant: montantNumerique,
        categorieRevenu: categorieId,
        description,
        utilisateur: new mongoose.Types.ObjectId(userId),
        typeCompte,
      };
      
      console.log(`[DEBUG] Objet revenu final:`, JSON.stringify(revenuObj, null, 2));
      
      // Vérification du schéma avant retour
      if (!revenuObj.date || !revenuObj.montant || !revenuObj.categorieRevenu || !revenuObj.description) {
        console.log(`[ERROR] Validation de l'objet revenu échouée:`, revenuObj);
        throw new Error(`Données de revenu incomplètes ou invalides`);
      }
      
      return revenuObj;
    };

    const result = await this.processCsvImport({
      csvBuffer,
      userId,
      model: RevenuModel as unknown as mongoose.Model<Record<string, unknown>>,
      entityName: "revenu",
      csvHeaders: [] as string[],
      processRowFn: processRevenuRow,
      parsingOptions: {
        headers: true,
        skipLines: 0,
      },
    });

    console.log('[DEBUG] Résultat de l\'import:', result);
    return result;
  }
}
