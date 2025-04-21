export const AUTH = {
  // Durée de validité du token JWT (24 heures)
  JWT_EXPIRES_IN: '24h',
  
  // Longueur minimale du mot de passe
  MIN_PASSWORD_LENGTH: 8,
  
  // Messages d'erreur d'authentification
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    USER_NOT_FOUND: 'Utilisateur non trouvé',
    EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
    UNAUTHORIZED: 'Non autorisé',
    TOKEN_EXPIRED: 'Token expiré',
    INVALID_TOKEN: 'Token invalide',
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