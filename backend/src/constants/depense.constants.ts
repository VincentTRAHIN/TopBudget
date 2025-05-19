import { TypeCompte, TypeDepense } from "../types/depense.types";

export const DEPENSE = {
  // Types de comptes disponibles
  TYPES_COMPTE: {
    PERSO: "Perso" as TypeCompte,
    CONJOINT: "Conjoint" as TypeCompte,
  },

  // Types de dépenses disponibles
  TYPES_DEPENSE: {
    PERSO: "Perso" as TypeDepense,
    COMMUNE: "Commune" as TypeDepense,
  },

  // Messages de succès
  SUCCESS: {
    CREATED: "Dépense créée avec succès",
    FETCHED: "Dépense(s) récupérée(s) avec succès",
    UPDATED: "Dépense mise à jour avec succès",
    DELETED: "Dépense supprimée avec succès",
    IMPORTED: "Dépenses importées avec succès",
  },

  // Messages d'erreur
  ERRORS: {
    NOT_FOUND: "Dépense non trouvée",
    INVALID_MONTANT: "Le montant doit être positif",
    INVALID_DATE: "La date est invalide",
    INVALID_TYPE_COMPTE: "Type de compte invalide",
    INVALID_TYPE_DEPENSE: "Type de dépense invalide",
    CATEGORIE_NOT_FOUND: "Catégorie non trouvée",
    INVALID_DESCRIPTION: "La description est invalide",
    INVALID_ID: "ID de dépense invalide",
    NOT_AUTHORIZED: "Action non autorisée. Vous ne pouvez modifier que vos propres dépenses.",
    ACCESS_DENIED: "Accès non autorisé à cette ressource.",
    CREATE_ERROR: "Erreur serveur lors de l'ajout de la dépense",
    FETCH_ERROR: "Erreur serveur lors de la récupération des dépenses",
    UPDATE_ERROR: "Erreur serveur lors de la modification de la dépense",
    DELETE_ERROR: "Erreur serveur lors de la suppression de la dépense",
  },

  // Validation
  VALIDATION: {
    MIN_MONTANT: 0,
    MAX_MONTANT: 1000000, // 1 million
    MAX_COMMENTAIRE_LENGTH: 500,
    MAX_DESCRIPTION_LENGTH: 500,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
  },
} as const;
