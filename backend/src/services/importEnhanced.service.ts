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
  TypeRevenuEnum, 
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
      'categorie': ['categorie', 'catgorie', 'category', 'cat', 'type'],
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
    const original = header;
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    console.log(`🔄 [DEBUG] Header normalization:`, {
      original,
      normalized
    });
    
    for (const [standardName, aliasList] of Object.entries(aliases)) {
      if (aliasList.some(alias => alias.replace(/[^a-z0-9]/g, '') === normalized)) {
        console.log(`✅ [DEBUG] Matched '${original}' -> '${standardName}'`);
        return standardName;
      }
    }
    
    console.log(`⚠️ [DEBUG] No match found for '${original}' -> keeping '${normalized}'`);
    return normalized;
  }

  /**
   * Parse une ligne CSV en gérant correctement les guillemets
   */
  private static parseCSVLine(line: string, separator: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Double quote escaped
          current += '"';
          i += 2;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === separator && !inQuotes) {
        // Found separator outside quotes
        values.push(current.trim());
        current = '';
        i++;
      } else {
        // Regular character
        current += char;
        i++;
      }
    }
    
    // Add the last value
    values.push(current.trim());
    
    return values;
  }

  /**
   * Détecte le séparateur CSV (point-virgule ou virgule)
   */
  private static detectSeparator(firstLine: string): string {
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    console.log(`🔍 [DEBUG] Separator detection:`, {
      line: firstLine,
      semicolonCount,
      commaCount
    });
    
    // Priorité au point-virgule (format français)
    // Si on a des point-virgules, on les utilise prioritairement
    if (semicolonCount > 0) {
      console.log(`✅ [DEBUG] Using semicolon separator (French format)`);
      return ';';
    }
    
    console.log(`⚠️ [DEBUG] Fallback to comma separator`);
    return ',';
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
    errors: string[];
    separator: string;
  } {
    const separator = this.detectSeparator(firstLine);
    const rawHeaders = firstLine.split(separator).map(h => h.trim().replace(/['"]/g, ''));
    const normalizedHeaders = rawHeaders.map(h => this.normalizeHeader(h, config.aliases));
    const errors: string[] = [];

    // Vérifier les en-têtes requis
    const missingRequired = config.required.filter(required => 
      !normalizedHeaders.includes(required)
    );

    if (missingRequired.length > 0) {
      errors.push(
        `En-têtes requis manquants: ${missingRequired.join(', ')}. ` +
        `En-têtes détectés: ${rawHeaders.join(', ')} (séparateur: '${separator}')`
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
      errors,
      separator
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

    const depense: any = { utilisateur: userId };
    
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
            // Nettoyer la valeur : supprimer guillemets, devises et espaces
            let cleanValue = value.replace(/["€$\s]/g, '');
            
            // Gérer le format français avec virgule décimale
            // Si il y a une virgule suivie de 1-2 chiffres à la fin, c'est le séparateur décimal
            if (/,\d{1,2}$/.test(cleanValue)) {
              cleanValue = cleanValue.replace(',', '.');
            }
            
            const montant = parseFloat(cleanValue);
            if (isNaN(montant)) {
              errors.push(`Montant invalide: "${value}". Formats acceptés: 10,50 ou 10.50`);
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
   * Parse une ligne de revenu avec validation
   */
  private static parseRevenuLine(
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

    const revenu: any = { utilisateur: userId };
    
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
                revenu.date = parsedDate;
              }
            } else {
              revenu.date = parsedDate;
            }
          }
          break;
          
        case 'montant':
          if (!value) {
            errors.push('Montant manquant');
          } else {
            // Nettoyer la valeur : supprimer guillemets, devises et espaces
            let cleanValue = value.replace(/["€$\s]/g, '');
            
            // Gérer le format français avec virgule décimale
            if (/,\d{1,2}$/.test(cleanValue)) {
              cleanValue = cleanValue.replace(',', '.');
            }
            
            const montant = parseFloat(cleanValue);
            if (isNaN(montant)) {
              errors.push(`Montant invalide: "${value}". Formats acceptés: 10,50 ou 10.50`);
            } else {
              revenu.montant = Math.abs(montant); // Les revenus sont positifs
            }
          }
          break;
          
        case 'categorierevenu':
          if (!value) {
            errors.push('Catégorie de revenu manquante');
          } else {
            revenu.categorieNom = value; // On stocke le nom, la résolution se fera plus tard
          }
          break;
          
        case 'description':
          revenu.description = value || '';
          break;
          
        case 'commentaire':
          revenu.commentaire = value || '';
          break;
          
        case 'typecompte':
          const typeCompte = value || 'Perso';
          if (!isValidTypeRevenu(typeCompte)) {
            errors.push(`Type de compte invalide: "${typeCompte}". Valeurs acceptées: ${Object.values(TypeRevenuEnum).join(', ')}`);
          } else {
            revenu.typeCompte = typeCompte;
          }
          break;
          
        case 'estrecurrent':
          if (value) {
            const recurrent = value.toLowerCase();
            if (['true', '1', 'oui', 'yes'].includes(recurrent)) {
              revenu.estRecurrent = true;
            } else if (['false', '0', 'non', 'no'].includes(recurrent)) {
              revenu.estRecurrent = false;
            } else {
              errors.push(`Valeur EstRecurrent invalide: "${value}". Valeurs acceptées: true/false, 1/0, oui/non`);
            }
          } else {
            revenu.estRecurrent = false;
          }
          break;
      }
    });

    // Valeurs par défaut
    if (!revenu.typeCompte) revenu.typeCompte = TypeRevenuEnum.PERSO;
    if (revenu.estRecurrent === undefined) revenu.estRecurrent = false;

    return { 
      success: errors.length === 0, 
      data: errors.length === 0 ? revenu : undefined, 
      errors 
    };
  }

  /**
   * Résout les catégories par nom et crée celles qui n'existent pas
   */
  private static async resolveCategoriesByName(depenses: any[]): Promise<{ 
    resolvedDepenses: any[], 
    createdCategories: string[] 
  }> {
    const categorieNoms = [...new Set(depenses.map(d => d.categorieNom).filter(Boolean))];
    
    // Chercher les catégories existantes
    const existingCategories = await Categorie.find({ 
      nom: { $in: categorieNoms } 
    }).select('_id nom');
    
    const existingCategorieMap = new Map(existingCategories.map(cat => [cat.nom, cat._id]));
    const existingNames = new Set(existingCategories.map(cat => cat.nom));
    
    // Identifier les catégories manquantes
    const missingCategories = categorieNoms.filter(nom => !existingNames.has(nom));
    const createdCategories: string[] = [];
    
    // Créer les catégories manquantes
    for (const categorieNom of missingCategories) {
      try {
        console.log(`🆕 Création de la catégorie: "${categorieNom}"`);
        const newCategorie = new Categorie({
          nom: categorieNom,
          description: `Catégorie créée automatiquement lors de l'import`,
          couleur: '#6366f1', // Couleur par défaut
          icone: '📦' // Icône par défaut
        });
        
        const savedCategorie = await newCategorie.save();
        existingCategorieMap.set(categorieNom, savedCategorie._id);
        createdCategories.push(categorieNom);
        
        console.log(`✅ Catégorie "${categorieNom}" créée avec ID: ${savedCategorie._id}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la création de la catégorie "${categorieNom}":`, error);
        throw new Error(`Impossible de créer la catégorie "${categorieNom}"`);
      }
    }
    
    // Résoudre toutes les dépenses avec les catégories (existantes + créées)
    const resolvedDepenses = depenses.map(depense => {
      const categorieId = existingCategorieMap.get(depense.categorieNom);
      if (categorieId) {
        depense.categorie = categorieId;
        delete depense.categorieNom;
        return depense;
      } else {
        throw new Error(`Erreur inattendue: catégorie "${depense.categorieNom}" non résolue`);
      }
    });
    
    return { 
      resolvedDepenses, 
      createdCategories 
    };
  }

  /**
   * Résolution des catégories de revenus par nom avec création automatique
   */
  private static async resolveCategoriesRevenuByName(revenus: any[], userId: string): Promise<{ 
    resolvedRevenus: any[], 
    createdCategories: string[] 
  }> {
    const categorieNoms = [...new Set(revenus.map(r => r.categorieNom).filter(Boolean))];
    
    // Chercher les catégories de revenus existantes pour cet utilisateur
    const existingCategories = await CategorieRevenuModel.find({ 
      nom: { $in: categorieNoms },
      utilisateur: userId 
    }).select('_id nom');
    
    const existingCategorieMap = new Map(existingCategories.map(cat => [cat.nom, cat._id]));
    const existingNames = new Set(existingCategories.map(cat => cat.nom));
    
    // Identifier les catégories manquantes
    const missingCategories = categorieNoms.filter(nom => !existingNames.has(nom));
    const createdCategories: string[] = [];
    
    // Créer les catégories manquantes
    for (const categorieNom of missingCategories) {
      try {
        console.log(`🆕 Création de la catégorie de revenu: "${categorieNom}"`);
        const newCategorie = new CategorieRevenuModel({
          nom: categorieNom,
          description: `Catégorie de revenu créée automatiquement lors de l'import`,
          image: '💰', // Icône par défaut pour les revenus
          utilisateur: userId // Champ requis pour les catégories de revenus
        });
        
        const savedCategorie = await newCategorie.save();
        existingCategorieMap.set(categorieNom, savedCategorie._id);
        createdCategories.push(categorieNom);
        
        console.log(`✅ Catégorie de revenu "${categorieNom}" créée avec ID: ${savedCategorie._id}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la création de la catégorie de revenu "${categorieNom}":`, error);
        throw new Error(`Impossible de créer la catégorie de revenu "${categorieNom}"`);
      }
    }
    
    // Résoudre tous les revenus avec les catégories (existantes + créées)
    const resolvedRevenus = revenus.map(revenu => {
      const categorieId = existingCategorieMap.get(revenu.categorieNom);
      if (categorieId) {
        revenu.categorieRevenu = categorieId;
        delete revenu.categorieNom;
        return revenu;
      } else {
        throw new Error(`Erreur inattendue: catégorie de revenu "${revenu.categorieNom}" non résolue`);
      }
    });
    
    return { 
      resolvedRevenus, 
      createdCategories 
    };
  }

  /**
   * Importe un fichier CSV de dépenses avec gestion d'erreurs détaillée
   */
  static async importDepensesFromCSV(
    csvBuffer: Buffer, 
    userId: string
  ): Promise<ImportResult> {
    return new Promise((resolve) => {
      console.log(`🚀 [DEBUG] Import démarré pour userId: ${userId}`);
      const csvContent = csvBuffer.toString('utf-8');
      console.log(`📄 [DEBUG] Contenu CSV (${csvContent.length} caractères):`);
      console.log(csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : ''));
      
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      console.log(`📊 [DEBUG] ${lines.length} lignes détectées après nettoyage`);
      
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
      console.log(`🔍 [DEBUG] Première ligne (en-têtes): ${lines[0]}`);
      const headerAnalysis = this.detectAndValidateHeaders(lines[0], this.DEPENSE_HEADERS);
      console.log(`🔍 [DEBUG] Analyse en-têtes:`, {
        valid: headerAnalysis.isValid,
        separator: headerAnalysis.separator,
        headers: headerAnalysis.headers,
        normalized: headerAnalysis.normalizedHeaders,
        errors: headerAnalysis.errors
      });
      
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
      let lignesTraitees = 0;
      let lignesRejetees = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        lignesTraitees++;
        
        if (!line.trim()) {
          lignesVides++;
          continue;
        }
        
        const values = this.parseCSVLine(line, headerAnalysis.separator);
        const { success, data, errors: lineErrors } = this.parseDepenseLine(
          values, 
          headerAnalysis.normalizedHeaders, 
          i + 1, 
          userId
        );
        
        if (success && data) {
          validDepenses.push(data);
        } else {
          lignesRejetees++;
          // Log des premières erreurs pour diagnostic
          if (lignesRejetees <= 5) {
            console.log(`❌ [DEBUG] Ligne ${i + 1} rejetée:`, {
              ligne: line.substring(0, 100),
              erreurs: lineErrors,
              values: values.slice(0, 4)
            });
          }
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
      console.log(`� [DEBUG] Statistiques parsing:`, {
        lignesTraitees,
        lignesVides,
        lignesRejetees,
        lignesValides: validDepenses.length,
        tauxReussite: `${Math.round((validDepenses.length / lignesTraitees) * 100)}%`
      });
      
      if (lignesRejetees > 5) {
        console.log(`⚠️ [DEBUG] ${lignesRejetees - 5} autres lignes rejetées (non affichées)`);
      }
      
      console.log(`�🔍 [DEBUG] Avant résolution catégories: ${validDepenses.length} dépenses valides`);
      if (validDepenses.length > 0) {
        console.log(`📝 [DEBUG] Première dépense valide:`, JSON.stringify(validDepenses[0], null, 2));
      }
      
      this.resolveCategoriesByName(validDepenses)
        .then(async (categoryResult) => {
          const { resolvedDepenses: depensesWithCategories, createdCategories } = categoryResult;
          console.log(`🔄 [DEBUG] Après résolution: ${depensesWithCategories.length} dépenses résolues`);
          let savedCount = 0;
          
          console.log(`📊 Import stats: ${depensesWithCategories.length} dépenses à sauvegarder, ${createdCategories.length} nouvelles catégories créées`);
          if (createdCategories.length > 0) {
            console.log(`🆕 Nouvelles catégories: ${createdCategories.join(', ')}`);
          }
          
          if (depensesWithCategories.length > 0) {
            try {
              console.log(`💾 [DEBUG] Tentative de sauvegarde de ${depensesWithCategories.length} dépenses...`);
              console.log(`📝 [DEBUG] Première dépense à sauvegarder:`, JSON.stringify(depensesWithCategories[0], null, 2));
              
              const saved = await DepenseModel.insertMany(depensesWithCategories, { ordered: false });
              savedCount = saved.length;
              console.log(`✅ ${savedCount} dépenses sauvegardées avec succès`);
            } catch (error: any) {
              console.error(`❌ Erreur lors de la sauvegarde:`, error);
              console.error(`🔍 [DEBUG] Type d'erreur:`, error.constructor.name);
              console.error(`📋 [DEBUG] Message d'erreur:`, error.message);
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

          const finalResult: ImportResult = {
            success: errors.length === 0,
            totalLines: lines.length - 1, // Exclure les en-têtes
            successCount: savedCount,
            errorCount: errors.length,
            errors,
            message: errors.length === 0 
              ? `✅ Import réussi: ${savedCount} dépenses ajoutées${createdCategories.length > 0 ? `, ${createdCategories.length} nouvelles catégories créées` : ''}`
              : `⚠️ Import partiel: ${savedCount} dépenses ajoutées, ${errors.length} erreurs`,
            statistiques: {
              lignesAvecEntetes: 1,
              lignesVides,
              lignesValides: validDepenses.length
            }
          };

          resolve(finalResult);
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
   * Version complète pour l'import des revenus
   */
  static async importRevenusFromCSV(
    csvBuffer: Buffer, 
    userId: string
  ): Promise<ImportResult> {
    return new Promise((resolve) => {
      console.log(`🚀 [DEBUG] Import revenus démarré pour userId: ${userId}`);
      const csvContent = csvBuffer.toString('utf-8');
      console.log(`📄 [DEBUG] Contenu CSV revenus (${csvContent.length} caractères):`);
      console.log(csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : ''));
      
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      console.log(`📊 [DEBUG] ${lines.length} lignes détectées après nettoyage`);
      
      if (lines.length === 0) {
        return resolve({
          success: false,
          totalLines: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
          message: 'Fichier CSV vide',
        });
      }
      
      // Analyser les en-têtes
      console.log(`🔍 [DEBUG] Première ligne (en-têtes): ${lines[0]}`);
      const headerAnalysis = this.detectAndValidateHeaders(lines[0], this.REVENU_HEADERS);
      console.log(`🔍 [DEBUG] Analyse en-têtes revenus:`, {
        valid: headerAnalysis.isValid,
        separator: headerAnalysis.separator,
        headers: headerAnalysis.headers,
        normalized: headerAnalysis.normalizedHeaders,
        errors: headerAnalysis.errors
      });
      
      const errors: any[] = [];
      const validRevenus: any[] = [];
      let lignesTraitees = 0;
      let lignesVides = 0;
      let lignesRejetees = 0;
      if (!headerAnalysis.isValid) {
        return resolve({
          success: false,
          totalLines: lines.length,
          successCount: 0,
          errorCount: lines.length,
          errors: [{
            ligne: 1,
            erreurs: headerAnalysis.errors,
            donnees: {},
            contexte: 'Validation des en-têtes'
          }],
          message: `En-têtes invalides: ${headerAnalysis.errors.join(', ')}`,
        });
      }
      
      console.log(`✅ [DEBUG] En-têtes validés: ${headerAnalysis.headers.join(', ')}`);
      
      // Traitement des lignes de données
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        lignesTraitees++;
        
        if (!line || line.trim() === '') {
          lignesVides++;
          continue;
        }
        
        const values = this.parseCSVLine(line, headerAnalysis.separator);
        const { success, data, errors: lineErrors } = this.parseRevenuLine(
          values, 
          headerAnalysis.normalizedHeaders, 
          i + 1, 
          userId
        );
        
        if (success && data) {
          validRevenus.push(data);
        } else {
          lignesRejetees++;
          // Log des premières erreurs pour diagnostic
          if (lignesRejetees <= 5) {
            console.log(`❌ [DEBUG] Ligne revenu ${i + 1} rejetée:`, {
              ligne: line.substring(0, 100),
              erreurs: lineErrors,
              values: values.slice(0, 4)
            });
          }
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
      console.log(`📊 [DEBUG] Statistiques parsing revenus:`, {
        lignesTraitees,
        lignesVides, 
        lignesRejetees,
        lignesValides: validRevenus.length,
        tauxReussite: `${Math.round((validRevenus.length / lignesTraitees) * 100)}%`
      });
      
      console.log(`🔍 [DEBUG] Avant résolution catégories revenus: ${validRevenus.length} revenus valides`);
      
      this.resolveCategoriesRevenuByName(validRevenus, userId)
        .then(async (categoryResult: any) => {
          const { resolvedRevenus: revenusWithCategories, createdCategories } = categoryResult;
          console.log(`🔄 [DEBUG] Après résolution: ${revenusWithCategories.length} revenus résolus`);
          let savedCount = 0;
          
          console.log(`📊 Import stats revenus: ${revenusWithCategories.length} revenus à sauvegarder, ${createdCategories.length} nouvelles catégories créées`);
          
          if (revenusWithCategories.length > 0) {
            try {
              console.log(`💾 [DEBUG] Tentative de sauvegarde de ${revenusWithCategories.length} revenus...`);
              
              const saved = await RevenuModel.insertMany(revenusWithCategories, { ordered: false });
              savedCount = saved.length;
              console.log(`✅ ${savedCount} revenus sauvegardés avec succès`);
            } catch (error: any) {
              console.error(`❌ Erreur lors de la sauvegarde des revenus:`, error);
              
              if (error.name === 'BulkWriteError' && error.writeErrors) {
                savedCount = revenusWithCategories.length - error.writeErrors.length;
                console.log(`⚠️ Sauvegarde partielle: ${savedCount}/${revenusWithCategories.length} revenus sauvegardés`);
                
                error.writeErrors.slice(0, 3).forEach((writeError: any, idx: number) => {
                  errors.push({
                    ligne: idx + 2,
                    erreurs: [writeError.errmsg || 'Erreur de sauvegarde'],
                    donnees: writeError.err?.op || {},
                    contexte: 'Sauvegarde en base'
                  });
                });
              }
            }
          }
          
          const result: ImportResult = {
            success: savedCount > 0 || errors.length === 0,
            totalLines: lignesTraitees,
            successCount: savedCount,
            errorCount: lignesRejetees + (revenusWithCategories.length - savedCount),
            errors,
            message: `Import terminé: ${savedCount} revenus importés, ${errors.length} erreurs${createdCategories.length > 0 ? `, ${createdCategories.length} nouvelles catégories créées` : ''}`,
          };
          
          console.log(`🎯 [DEBUG] Résultat final import revenus:`, result);
          resolve(result);
        })
        .catch((error) => {
          console.error(`❌ Erreur lors de la résolution des catégories revenus:`, error);
          resolve({
            success: false,
            totalLines: lignesTraitees,
            successCount: 0,
            errorCount: lignesTraitees,
            errors: [{
              ligne: 0,
              erreurs: ['Erreur lors de la résolution des catégories: ' + error.message],
              donnees: {},
              contexte: 'Résolution des catégories'
            }],
            message: 'Erreur lors de la résolution des catégories de revenus',
          });
        });
    });
  }
}

// Fonctions d'export pour compatibilité avec l'existant
export const importDepensesCsvOptimized = (csvBuffer: Buffer, userId: string) =>
  ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);

export const importRevenusCsvOptimized = (csvBuffer: Buffer, userId: string) =>
  ImportServiceV2.importRevenusFromCSV(csvBuffer, userId);