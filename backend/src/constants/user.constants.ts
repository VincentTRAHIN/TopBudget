import { UserRole } from "../types/user.types";
import { COMMON } from "./common.constants";

export const USER = {
  // Rôles disponibles
  ROLES: {
    PERSO: "Perso" as UserRole,
    CONJOINT: "Conjoint" as UserRole,
    ADMIN: "Admin" as UserRole,
  },

  // Messages d'erreur
  ERROR_MESSAGES: {
    USER_NOT_FOUND: COMMON.ERROR_MESSAGES.USER_NOT_FOUND,
    EMAIL_ALREADY_EXISTS: COMMON.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
    INVALID_ROLE: "Rôle invalide",
    CANNOT_DELETE_SELF: "Vous ne pouvez pas supprimer votre propre compte",
    CANNOT_MODIFY_ADMIN: "Vous ne pouvez pas modifier un administrateur",
  },

  // Validation
  VALIDATION: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;
