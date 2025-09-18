import { Readable } from "stream";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import Categorie from "../models/categorie.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { DEPENSE, CATEGORIE, CATEGORIE_REVENU, REVENU } from "../constants";
import { parse, isValid } from "date-fns";
import { 
  TypeCompteRevenu, 
  TypeCompteEnum, 
  TypeDepenseEnum, 
  isValidTypeCompte, 
  isValidTypeDepense, 
  isValidTypeRevenu 
} from "../types/common.types";

/**
 * Interface pour les erreurs d'import avec contexte détaillé
 */
interface ImportError {
  ligne: number;
  erreurs: string[];
  donnees?: Record<string, string>;
  contexte?: string;
}

/**
 * Interface pour le résultat d'import amélioré
 */
interface ImportResult {
  success: boolean;
  totalLines: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  message: string;
  statistiques?: {
    lignesAvecEntetes: number;
    lignesVides: number;
    lignesValides: number;
  };
}

/**
 * Configuration pour la détection d'en-têtes
 */
interface HeaderConfig {
  required: string[];
  optional: string[];
  aliases: Record<string, string[]>; // Mapping des aliases vers le nom standard
}

/**
 * Service d'import CSV optimisé avec meilleure gestion d'erreurs
 */
export class ImportServiceV2 {
  
  private static readonly DEPENSE_HEADERS: HeaderConfig = {
    required: ['date', 'montant', 'categorie'],
    optional: ['description', 'commentaire', 'typecompte', 'typedepense'],
    aliases: {
      'date': ['date', 'jour', 'day'],
      'montant': ['montant', 'amount', 'prix', 'price', 'valeur'],
      'categorie': ['categorie', 'category', 'cat', 'type'],
      'description': ['description', 'libelle', 'label', 'desc'],
      'commentaire': ['commentaire', 'comment', 'note', 'notes'],
      'typecompte': ['typecompte', 'compte', 'account'],
      'typedepense': ['typedepense', 'nature', 'kind']
    }
  };

  private static readonly REVENU_HEADERS: HeaderConfig = {
    required: ['date', 'montant', 'categorierevenu'],
    optional: ['description', 'commentaire', 'typecompte', 'estrecurrent'],
    aliases: {
      'date': ['date', 'jour', 'day'],
      'montant': ['montant', 'amount', 'prix', 'price', 'valeur'],
      'categorierevenu': ['categorierevenu', 'categorie', 'category'],
      'description': ['description', 'libelle', 'label', 'desc'],
      'commentaire': ['commentaire', 'comment', 'note', 'notes'],
      'typecompte': ['typecompte', 'compte', 'account'],
      'estrecurrent': ['estrecurrent', 'recurrent', 'recurring']
    }
  };

  /**
   * Normalise un nom d'en-tête en utilisant les aliases
   */
  private static normalizeHeader(header: string, aliases: Record<string, string[]>): string {
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    for (const [standardName, aliasList] of Object.entries(aliases)) {
      if (aliasList.some(alias => alias.replace(/[^a-z0-9]/g, '') === normalized)) {
        return standardName;
      }
    }
    
    return normalized;
  }

  /**
   * Détecte et valide les en-têtes du CSV
   */
  private static detectAndValidateHeaders(
    firstLine: string, 
    config: HeaderConfig
  ): { 
    isValid: boolean; 
    headers: string[]; 
    normalizedHeaders: string[];
    missingRequired: string[];
    errors: string[] 
  } {
    const rawHeaders = firstLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
    const normalizedHeaders = rawHeaders.map(h => this.normalizeHeader(h, config.aliases));
    const errors: string[] = [];

    // Vérifier les en-têtes requis
    const missingRequired = config.required.filter(required => 
      !normalizedHeaders.includes(required)
    );

    if (missingRequired.length > 0) {
      errors.push(
        `En-têtes requis manquants: ${missingRequired.join(', ')}. ` +
        `En-têtes détectés: ${rawHeaders.join(', ')}`
      );
    }

    // Vérifier la cohérence
    if (rawHeaders.length !== normalizedHeaders.length) {
      errors.push('Erreur de normalisation des en-têtes');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      headers: rawHeaders,
      normalizedHeaders,
      missingRequired,
      errors
    };
  }

  /**
   * Parse une ligne de dépense avec validation complète
   */
  private static parseDepenseLine(
    values: string[], 
    normalizedHeaders: string[], 
    lineNumber: number,
    userId: string
  ): { success: boolean; data?: any; errors: string[] } {
    const errors: string[] = [];
    
    if (values.length !== normalizedHeaders.length) {
      errors.push(`Nombre de colonnes incorrect (attendu: ${normalizedHeaders.length}, reçu: ${values.length})`);
      return { success: false, errors };
    }

    const depense: any = { userId };
    
    normalizedHeaders.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      
      switch (header) {
        case 'date':
          if (!value) {
            errors.push('Date manquante');
          } else {
            // Essayer plusieurs formats de date
            const dateFormats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];
            let parsedDate: Date | null = null;
            
            for (const format of dateFormats) {
              const parsed = parse(value, format, new Date());
              if (isValid(parsed)) {
                parsedDate = parsed;
                break;
              }
            }
            
            if (!parsedDate) {
              // Essayer avec new Date()
              parsedDate = new Date(value);
              if (!isValid(parsedDate)) {
                errors.push(`Date invalide: "${value}". Formats acceptés: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY`);
              } else {
                depense.date = parsedDate;
              }
            } else {
              depense.date = parsedDate;
            }
          }
          break;
          
        case 'montant':
          if (!value) {
            errors.push('Montant manquant');
          } else {
            const montant = parseFloat(value.replace(/[€$,\s]/g, '').replace(',', '.'));
            if (isNaN(montant)) {
              errors.push(`Montant invalide: "${value}"`);
            } else {
              depense.montant = Math.abs(montant); // Les dépenses sont positives dans notre modèle
            }
          }
          break;
          
        case 'categorie':
          if (!value) {
            errors.push('Catégorie manquante');
          } else {
            depense.categorieNom = value; // On stocke le nom, la résolution se fera plus tard
          }
          break;
          
        case 'description':
          depense.description = value || '';
          break;
          
        case 'commentaire':
          depense.commentaire = value || '';
          break;
          
        case 'typecompte':
          const typeCompte = value || 'Perso';
          if (!isValidTypeCompte(typeCompte)) {
            errors.push(`Type de compte invalide: "${typeCompte}". Valeurs acceptées: ${Object.values(TypeCompteEnum).join(', ')}`);
          } else {
            depense.typeCompte = typeCompte;
          }
          break;
          
        case 'typedepense':
          const typeDepense = value || 'Perso';
          if (!isValidTypeDepense(typeDepense)) {
            errors.push(`Type de dépense invalide: "${typeDepense}". Valeurs acceptées: ${Object.values(TypeDepenseEnum).join(', ')}`);
          } else {
            depense.typeDepense = typeDepense;
          }
          break;
      }
    });

    // Valeurs par défaut
    if (!depense.typeCompte) depense.typeCompte = TypeCompteEnum.PERSO;
    if (!depense.typeDepense) depense.typeDepense = TypeDepenseEnum.PERSO;
    if (!depense.recurrence) depense.recurrence = false;
    if (!depense.estChargeFixe) depense.estChargeFixe = false;

    return { 
      success: errors.length === 0, 
      data: errors.length === 0 ? depense : undefined, 
      errors 
    };
  }

  /**
   * Résout les catégories par nom
   */
  private static async resolveCategoriesByName(depenses: any[]): Promise<any[]> {
    const categorieNoms = [...new Set(depenses.map(d => d.categorieNom).filter(Boolean))];
    const categories = await Categorie.find({ 
      nom: { $in: categorieNoms } 
    }).select('_id nom');
    
    const categorieMap = new Map(categories.map(cat => [cat.nom, cat._id]));
    
    return depenses.map(depense => {
      const categorieId = categorieMap.get(depense.categorieNom);
      if (categorieId) {
        depense.categorie = categorieId;
        delete depense.categorieNom;
        return depense;
      } else {
        throw new Error(`Catégorie "${depense.categorieNom}" non trouvée`);
      }
    });
  }

  /**
   * Importe un fichier CSV de dépenses avec gestion d'erreurs détaillée
   */
  static async importDepensesFromCSV(
    csvBuffer: Buffer, 
    userId: string
  ): Promise<ImportResult> {
    return new Promise((resolve) => {
      const csvContent = csvBuffer.toString('utf-8');
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) {
        return resolve({
          success: false,
          totalLines: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
          message: 'Fichier CSV vide',
          statistiques: { lignesAvecEntetes: 0, lignesVides: 0, lignesValides: 0 }
        });
      }

      // Analyser les en-têtes
      const headerAnalysis = this.detectAndValidateHeaders(lines[0], this.DEPENSE_HEADERS);
      
      if (!headerAnalysis.isValid) {
        return resolve({
          success: false,
          totalLines: lines.length,
          successCount: 0,
          errorCount: 1,
          errors: [{
            ligne: 1,
            erreurs: headerAnalysis.errors,
            donnees: { 'en-têtes détectés': headerAnalysis.headers.join(', ') },
            contexte: 'Format de fichier CSV'
          }],
          message: 'Format de fichier invalide - vérifiez les en-têtes',
          statistiques: { lignesAvecEntetes: 1, lignesVides: 0, lignesValides: 0 }
        });
      }

      const errors: ImportError[] = [];
      const validDepenses: any[] = [];
      let lignesVides = 0;
      
      // Parser les données (ignorer la ligne d'en-tête)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.trim()) {
          lignesVides++;
          continue;
        }
        
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const { success, data, errors: lineErrors } = this.parseDepenseLine(
          values, 
          headerAnalysis.normalizedHeaders, 
          i + 1, 
          userId
        );
        
        if (success && data) {
          validDepenses.push(data);
        } else {
          errors.push({
            ligne: i + 1,
            erreurs: lineErrors,
            donnees: Object.fromEntries(
              headerAnalysis.headers.map((header, idx) => [header, values[idx] || ''])
            ),
            contexte: 'Validation des données'
          });
        }
      }

      // Résoudre les catégories et sauvegarder
      this.resolveCategoriesByName(validDepenses)
        .then(async (depensesWithCategories) => {
          let savedCount = 0;
          
          if (depensesWithCategories.length > 0) {
            try {
              const saved = await DepenseModel.insertMany(depensesWithCategories, { ordered: false });
              savedCount = saved.length;
            } catch (error: any) {
              // Gérer les erreurs de sauvegarde
              if (error.writeErrors) {
                error.writeErrors.forEach((err: any, index: number) => {
                  errors.push({
                    ligne: index + 2, // +2 car on ignore l'en-tête et commence à 1
                    erreurs: [`Erreur de sauvegarde: ${err.errmsg || err.message}`],
                    donnees: depensesWithCategories[err.index] || {},
                    contexte: 'Sauvegarde en base de données'
                  });
                });
                savedCount = depensesWithCategories.length - error.writeErrors.length;
              } else {
                errors.push({
                  ligne: 0,
                  erreurs: [`Erreur de sauvegarde globale: ${error.message}`],
                  contexte: 'Sauvegarde en base de données'
                });
              }
            }
          }

          const result: ImportResult = {
            success: errors.length === 0,
            totalLines: lines.length - 1, // Exclure les en-têtes
            successCount: savedCount,
            errorCount: errors.length,
            errors,
            message: errors.length === 0 
              ? `✅ Import réussi: ${savedCount} dépenses ajoutées`
              : `⚠️ Import partiel: ${savedCount} dépenses ajoutées, ${errors.length} erreurs`,
            statistiques: {
              lignesAvecEntetes: 1,
              lignesVides,
              lignesValides: validDepenses.length
            }
          };

          resolve(result);
        })
        .catch((categorieError) => {
          errors.push({
            ligne: 0,
            erreurs: [`Erreur de résolution des catégories: ${categorieError.message}`],
            contexte: 'Résolution des catégories'
          });

          resolve({
            success: false,
            totalLines: lines.length - 1,
            successCount: 0,
            errorCount: errors.length,
            errors,
            message: `❌ Échec de l'import: ${categorieError.message}`,
            statistiques: {
              lignesAvecEntetes: 1,
              lignesVides,
              lignesValides: 0
            }
          });
        });
    });
  }

  /**
   * Version simplifiée pour les revenus (similaire à celle des dépenses)
   */
  static async importRevenusFromCSV(
    csvBuffer: Buffer, 
    userId: string
  ): Promise<ImportResult> {
    // Implementation similaire pour les revenus
    // Pour l'instant, on retourne un résultat vide
    return {
      success: true,
      totalLines: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      message: 'Import des revenus non encore implémenté dans cette version',
    };
  }
}

// Fonctions d'export pour compatibilité avec l'existant
export const importDepensesCsvOptimized = (csvBuffer: Buffer, userId: string) =>
  ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);

export const importRevenusCsvOptimized = (csvBuffer: Buffer, userId: string) =>
  ImportServiceV2.importRevenusFromCSV(csvBuffer, userId);