import { COMMON } from "./common.constants";

export const AUTH = {
  // Durée de validité du token JWT (7 jours)
  JWT_EXPIRES_IN: "7d",

  // Longueur minimale du mot de passe
  MIN_PASSWORD_LENGTH: 8,

  // Messages de succès
  SUCCESS: {
    LOGIN: "Connexion réussie",
    SIGNUP: "Inscription réussie",
    LOGOUT: "Déconnexion réussie",
    PASSWORD_RESET: "Mot de passe réinitialisé avec succès",
    PASSWORD_CHANGED: "Mot de passe modifié avec succès",
    PROFILE_FETCHED: "Profil utilisateur récupéré avec succès"
  },

  // Messages d'erreur
  ERRORS: {
    INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
    NOT_FOUND: "Utilisateur non trouvé",
    ALREADY_EXISTS: "Cette adresse email est déjà utilisée",
    UNAUTHORIZED: "Non authentifié",
    UNAUTHORIZED_USER: COMMON.ERRORS.UNAUTHORIZED_USER,
    TOKEN_EXPIRED: "Token expiré",
    INVALID_TOKEN: "Token invalide",
    SIGNUP_ERROR: "Erreur lors de l'inscription",
    LOGIN_ERROR: "Erreur lors de la connexion",
    PROFILE_FETCH_ERROR: "Erreur lors de la récupération du profil",
    VALIDATION_ERROR: "Erreur de validation"
  },

  // Règles de validation du mot de passe
  PASSWORD_RULES: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
} as const;
