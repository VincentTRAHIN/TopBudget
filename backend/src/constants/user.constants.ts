import { UserRole } from "../types/user.types";
import { COMMON } from "./common.constants";

export const USER = {
  // Rôles disponibles
  ROLES: {
    PERSO: "Perso" as UserRole,
    CONJOINT: "Conjoint" as UserRole,
    ADMIN: "Admin" as UserRole,
  },

  // Messages de succès
  SUCCESS: {
    FETCHED: "Utilisateur trouvé",
    CREATED: "Utilisateur créé avec succès",
    UPDATED: "Utilisateur mis à jour avec succès",
    DELETED: "Utilisateur supprimé avec succès",
  },

  // Messages d'erreur
  ERRORS: {
    NOT_FOUND: COMMON.ERRORS.USER_NOT_FOUND,
    ALREADY_EXISTS: COMMON.ERRORS.EMAIL_ALREADY_EXISTS,
    INVALID_ROLE: "Rôle invalide",
    CANNOT_DELETE_SELF: "Vous ne pouvez pas supprimer votre propre compte",
    CANNOT_MODIFY_ADMIN: "Vous ne pouvez pas modifier un administrateur",
    QUERY_REQUIRED: "Paramètre query requis",
    SEARCH_ERROR: "Erreur lors de la recherche d'utilisateur",
  },

  // Validation
  VALIDATION: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;
