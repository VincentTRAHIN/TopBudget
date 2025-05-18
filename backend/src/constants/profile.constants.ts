
export const PROFILE = {
  ERROR_MESSAGES: {
    SERVER_ERROR_UPDATE: "Erreur lors de la mise à jour du profil",
    SERVER_ERROR_UPLOAD_AVATAR: "Erreur lors de l'upload de l'avatar",
    SERVER_ERROR_PASSWORD_CHANGE: "Erreur lors du changement de mot de passe",
    CURRENT_PASSWORD_INCORRECT: "Le mot de passe actuel est incorrect",
    PASSWORD_MATCH: "Le nouveau mot de passe ne peut pas être identique à l'ancien",
  },
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 50,
  },
} as const;
