import { TypeCompteRevenu } from '../types/revenu.types';

export const REVENU = {
  TYPES_COMPTE: {
    PERSO: 'Perso' as TypeCompteRevenu,
    CONJOINT: 'Conjoint' as TypeCompteRevenu,
  },
  ERROR_MESSAGES: {
    REVENU_NOT_FOUND: 'Revenu non trouvé',
    INVALID_MONTANT: 'Le montant du revenu doit être positif',
    CATEGORIE_REVENU_NOT_FOUND: 'Catégorie de revenu associée non trouvée',
    ALREADY_EXISTS: 'Un revenu similaire existe déjà',
    INVALID_TYPE_COMPTE: 'Type de compte invalide pour le revenu',
    INVALID_TYPE: 'Type de revenu invalide',
    INVALID_ID: 'ID de revenu invalide',
    NOT_AUTHORIZED: 'Action non autorisée. Vous ne pouvez modifier que vos propres revenus.',
    ACCESS_DENIED: 'Accès non autorisé à cette ressource',
    IMPORT_INVALID_FILE: 'Fichier CSV manquant ou invalide',
    SERVER_ERROR_ADD: "Erreur serveur lors de l'ajout du revenu",
    SERVER_ERROR_GET_LIST: "Erreur serveur lors de la récupération des revenus",
    SERVER_ERROR_GET_ONE: "Erreur serveur lors de la récupération du revenu",
    SERVER_ERROR_UPDATE: "Erreur serveur lors de la modification du revenu",
    SERVER_ERROR_DELETE: "Erreur serveur lors de la suppression du revenu",
    UNAUTHORIZED_USER: "Utilisateur non authentifié",
  },
  VALIDATION: {
    MIN_MONTANT: 0.01,
    MAX_DESCRIPTION_LENGTH: 100,
    MAX_COMMENTAIRE_LENGTH: 500,
  },
  PAGINATION: {
    DEFAULT_LIMIT: 10,
  },
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
