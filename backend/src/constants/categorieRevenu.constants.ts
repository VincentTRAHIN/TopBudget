export const CATEGORIE_REVENU = {
  SUCCESS: {
    CREATED: "Catégorie de revenu créée avec succès",
    FETCHED: "Catégories de revenu récupérées avec succès",
    UPDATED: "Catégorie de revenu mise à jour avec succès",
    DELETED: "Catégorie de revenu supprimée avec succès",
  },
  ERRORS: {
    NOT_FOUND: "Catégorie de revenu non trouvée",
    ALREADY_EXISTS: "Une catégorie de revenu avec ce nom existe déjà",
    IN_USE:
      "Catégorie de revenu utilisée par des revenus, impossible de la supprimer",
    INVALID_ID: "ID de catégorie de revenu invalide",
    INVALID_NOM_LENGTH: "Le nom doit contenir entre 2 et 50 caractères",
    INVALID_DESCRIPTION_LENGTH:
      "La description ne peut pas dépasser 200 caractères",
    CREATE_ERROR: "Erreur lors de l'ajout de la catégorie de revenu",
    FETCH_ERROR: "Erreur lors de la récupération des catégories de revenu",
    UPDATE_ERROR: "Erreur lors de la modification de la catégorie de revenu",
    DELETE_ERROR: "Erreur lors de la suppression de la catégorie de revenu",
  },
  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 200,
  },

  DEFAULT_CATEGORIES_REVENU: [],

  IMPORT: {
    DEFAULT_DESCRIPTION_AUTOCREATE:
      "Catégorie de revenu créée automatiquement lors de l'import CSV.",
  },
} as const;
