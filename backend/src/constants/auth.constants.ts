import { COMMON } from "./common.constants";

export const AUTH = {
  // Durée de validité du token JWT (24 heures)
  JWT_EXPIRES_IN: "24h",

  // Longueur minimale du mot de passe
  MIN_PASSWORD_LENGTH: 8,

  // Messages d'erreur d'authentification
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
    USER_NOT_FOUND: COMMON.ERROR_MESSAGES.USER_NOT_FOUND,
    EMAIL_ALREADY_EXISTS: COMMON.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
    UNAUTHORIZED: COMMON.ERROR_MESSAGES.UNAUTHORIZED,
    UNAUTHORIZED_USER: COMMON.ERROR_MESSAGES.UNAUTHORIZED_USER,
    TOKEN_EXPIRED: "Token expiré",
    INVALID_TOKEN: "Token invalide",
    SERVER_ERROR_SIGNUP: "Erreur lors de l'inscription",
    SERVER_ERROR_LOGIN: "Erreur lors de la connexion",
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
