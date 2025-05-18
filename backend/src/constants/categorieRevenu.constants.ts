
export const CATEGORIE_REVENU = {
  ERROR_MESSAGES: {
    CATEGORIE_REVENU_NOT_FOUND: "Catégorie de revenu non trouvée",
    CATEGORIE_REVENU_ALREADY_EXISTS: "Une catégorie de revenu avec ce nom existe déjà",
    CATEGORIE_REVENU_IN_USE: "Catégorie de revenu utilisée par des revenus, impossible de la supprimer",
    SERVER_ERROR_ADD: "Erreur lors de l'ajout de la catégorie de revenu",
    SERVER_ERROR_GET_LIST: "Erreur lors de la récupération des catégories de revenu",
    SERVER_ERROR_UPDATE: "Erreur lors de la modification de la catégorie de revenu",
    SERVER_ERROR_DELETE: "Erreur lors de la suppression de la catégorie de revenu",
  },
  VALIDATION: {
    MIN_NOM_LENGTH: 2,
    MAX_NOM_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 200,
  },
} as const;
