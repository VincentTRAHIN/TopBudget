// backend/src/constants/categorie.constants.ts

export const CATEGORIE = {
  // Messages d'erreur (inchangés pour l'instant, mais on pourrait en ajouter si besoin)
  ERROR_MESSAGES: {
    CATEGORIE_NOT_FOUND: 'Catégorie non trouvée',
    CATEGORIE_ALREADY_EXISTS: 'Cette catégorie existe déjà ou un conflit est survenu (vérifiez la casse ou les caractères spéciaux)', // Message légèrement affiné pour le cas 11000
    CATEGORIE_IN_USE: 'Cette catégorie est utilisée par des dépenses et ne peut être supprimée', // Précision
    VALIDATION_ERROR: 'Erreur de validation lors de la création/modification de la catégorie.', // Ajout potentiel
  },

  // Validation (inchangées)
  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // Catégories par défaut (inchangées, utilité potentielle pour UI ou seeding initial)
  DEFAULT_CATEGORIES: [
    'Alimentation',
    'Transport',
    'Logement',
    'Loisirs',
    'Santé',
    'Éducation',
    'Vêtements',
    'Services',
    'Autres',
  ],

  // --- AJOUT : Constantes liées à l'Import CSV ---
  IMPORT: {
    DEFAULT_DESCRIPTION_AUTOCREATE: "Catégorie créée automatiquement lors de l'import CSV.",
    
  }

} as const; 