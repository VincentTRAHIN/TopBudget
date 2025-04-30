
export const CATEGORIE = {
  ERROR_MESSAGES: {
    CATEGORIE_NOT_FOUND: 'Catégorie non trouvée',
    CATEGORIE_ALREADY_EXISTS: 'Cette catégorie existe déjà ou un conflit est survenu (vérifiez la casse ou les caractères spéciaux)',
    CATEGORIE_IN_USE: 'Cette catégorie est utilisée par des dépenses et ne peut être supprimée', 
    VALIDATION_ERROR: 'Erreur de validation lors de la création/modification de la catégorie.',
  },

  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  },

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

  IMPORT: {
    DEFAULT_DESCRIPTION_AUTOCREATE: "Catégorie créée automatiquement lors de l'import CSV.",
    
  }

} as const; 