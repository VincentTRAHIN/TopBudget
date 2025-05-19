export const CATEGORIE = {
  SUCCESS: {
    CREATED: "Catégorie créée avec succès",
    FETCHED: "Catégorie(s) récupérée(s) avec succès",
    UPDATED: "Catégorie mise à jour avec succès",
    DELETED: "Catégorie supprimée avec succès",
  },

  ERRORS: {
    NOT_FOUND: "Catégorie non trouvée",
    ALREADY_EXISTS:
      "Cette catégorie existe déjà ou un conflit est survenu (vérifiez la casse ou les caractères spéciaux)",
    IN_USE:
      "Cette catégorie est utilisée par des dépenses et ne peut être supprimée",
    INVALID_ID: "ID de catégorie invalide",
    INVALID_NOM_LENGTH: "Le nom doit contenir entre 2 et 50 caractères",
    INVALID_DESCRIPTION_LENGTH:
      "La description ne peut pas dépasser 500 caractères",
    CREATE_ERROR: "Erreur lors de l'ajout de la catégorie",
    FETCH_ERROR: "Erreur lors de la récupération des catégories",
    UPDATE_ERROR: "Erreur lors de la modification de la catégorie",
    DELETE_ERROR: "Erreur lors de la suppression de la catégorie",
  },

  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif"],
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  },

  DEFAULT_CATEGORIES: [
    "Alimentation",
    "Transport",
    "Logement",
    "Loisirs",
    "Santé",
    "Éducation",
    "Vêtements",
    "Services",
    "Autres",
  ],

  IMPORT: {
    DEFAULT_DESCRIPTION_AUTOCREATE:
      "Catégorie créée automatiquement lors de l'import CSV.",
  },
} as const;
