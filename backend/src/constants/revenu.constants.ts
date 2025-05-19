import { TypeCompteRevenu } from '../types/revenu.types';

export const REVENU = {
  // Types de comptes disponibles
  TYPES_COMPTE: {
    PERSO: 'Perso' as TypeCompteRevenu,
    CONJOINT: 'Conjoint' as TypeCompteRevenu,
  },

  // Messages de succès
  SUCCESS: {
    CREATED: "Revenu créé avec succès",
    FETCHED: "Revenu(s) récupéré(s) avec succès",
    UPDATED: "Revenu mis à jour avec succès",
    DELETED: "Revenu supprimé avec succès",
    IMPORTED: "Revenus importés avec succès",
  },

  // Messages d'erreur
  ERRORS: {
    NOT_FOUND: "Revenu non trouvé",
    INVALID_MONTANT: "Le montant du revenu doit être positif",
    INVALID_DATE: "La date est invalide",
    CATEGORIE_REVENU_NOT_FOUND: "Catégorie de revenu associée non trouvée",
    ALREADY_EXISTS: "Un revenu similaire existe déjà",
    INVALID_TYPE_COMPTE: "Type de compte invalide pour le revenu",
    INVALID_TYPE: "Type de revenu invalide",
    INVALID_DESCRIPTION: "La description est invalide",
    INVALID_ID: "ID de revenu invalide",
    NOT_AUTHORIZED: "Action non autorisée. Vous ne pouvez modifier que vos propres revenus.",
    ACCESS_DENIED: "Accès non autorisé à cette ressource",
    IMPORT_INVALID_FILE: "Fichier CSV manquant ou invalide",
    CREATE_ERROR: "Erreur serveur lors de l'ajout du revenu",
    FETCH_ERROR: "Erreur serveur lors de la récupération des revenus",
    UPDATE_ERROR: "Erreur serveur lors de la modification du revenu",
    DELETE_ERROR: "Erreur serveur lors de la suppression du revenu",
    UNAUTHORIZED_USER: "Utilisateur non authentifié",
  },

  // Validation
  VALIDATION: {
    MIN_MONTANT: 0.01,
    MAX_MONTANT: 1000000, // 1 million
    MAX_DESCRIPTION_LENGTH: 100,
    MAX_COMMENTAIRE_LENGTH: 500,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
  },

  // En-têtes CSV pour l'import
  IMPORT_CSV_HEADERS: [
    'date',
    'montant',
    'description',
    'categorierevenu',
    'typecompte',
    'commentaire',
    'estrecurrent',
  ],
} as const;
