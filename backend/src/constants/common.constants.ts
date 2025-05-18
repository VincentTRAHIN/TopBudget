
/**
 * Constantes communes partagées entre plusieurs modules
 * Permet d'éviter la duplication de messages d'erreur
 */
export const COMMON = {
  ERROR_MESSAGES: {
    USER_NOT_FOUND: "Utilisateur non trouvé",
    EMAIL_ALREADY_EXISTS: "Cet email est déjà utilisé",
    UNAUTHORIZED: "Non autorisé",
    UNAUTHORIZED_USER: "Utilisateur non authentifié",
    VALIDATION_ERROR: "Erreur de validation",
    SERVER_ERROR: "Erreur serveur",
    ACCESS_DENIED: "Accès non autorisé à cette ressource",
    NO_PARTNER_LINKED: "Aucun partenaire lié",
    NO_CSV_FILE: "Aucun fichier CSV fourni",
  },
} as const;
