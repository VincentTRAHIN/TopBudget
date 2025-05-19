export const PROFILE = {
  SUCCESS: {
    UPDATED: "Profil mis à jour avec succès",
    AVATAR_UPDATED: "Avatar mis à jour avec succès",
    PASSWORD_CHANGED: "Mot de passe modifié avec succès",
  },

  ERRORS: {
    UPDATE_ERROR: "Erreur lors de la mise à jour du profil",
    AVATAR_UPDATE_ERROR: "Erreur lors de l'upload de l'avatar",
    PASSWORD_CHANGE_ERROR: "Erreur lors du changement de mot de passe",
    CURRENT_PASSWORD_INCORRECT: "Le mot de passe actuel est incorrect",
    PASSWORD_MATCH:
      "Le nouveau mot de passe ne peut pas être identique à l'ancien",
    NO_FILE: "Aucun fichier n'a été fourni",
  },

  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 50,
  },
} as const;
