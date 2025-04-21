export const CATEGORIE = {
  // Messages d'erreur
  ERROR_MESSAGES: {
    CATEGORIE_NOT_FOUND: 'Catégorie non trouvée',
    CATEGORIE_ALREADY_EXISTS: 'Cette catégorie existe déjà',
    CATEGORIE_IN_USE: 'Cette catégorie est utilisée par des dépenses',
  },
  
  // Validation
  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  },
  
  // Catégories par défaut
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
} as const; 