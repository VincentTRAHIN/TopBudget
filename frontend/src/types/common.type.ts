/**
 * Types communs partagés dans l'application TopBudget
 * Ces types sont synchronisés avec les types backend
 */

/**
 * Types de compte disponibles dans l'application
 */
export enum TypeCompteEnum {
  PERSO = 'Perso',
  CONJOINT = 'Conjoint',
  COMMUN = 'Commun',
}

/**
 * Types de dépense disponibles
 */
export enum TypeDepenseEnum {
  PERSO = 'Perso',
  COMMUNE = 'Commune',
}

/**
 * Types de revenu disponibles - équivalent à TypeCompte mais pour clarification
 */
export enum TypeRevenuEnum {
  PERSO = 'Perso',
  CONJOINT = 'Conjoint',
}

// Types string pour compatibilité avec l'existant
export type TypeCompte = keyof typeof TypeCompteEnum;
export type TypeDepense = keyof typeof TypeDepenseEnum;
export type TypeRevenu = keyof typeof TypeRevenuEnum;

// Alias pour compatibilité ascendante
export type TypeCompteRevenu = TypeRevenu;

/**
 * Constantes pour les valeurs des enums (utiles pour les selects, validations)
 */
export const TYPE_COMPTE_VALUES = Object.values(TypeCompteEnum);
export const TYPE_DEPENSE_VALUES = Object.values(TypeDepenseEnum);
export const TYPE_REVENU_VALUES = Object.values(TypeRevenuEnum);

/**
 * Options pour les composants Select
 */
export const TYPE_COMPTE_OPTIONS = TYPE_COMPTE_VALUES.map(value => ({
  label: value,
  value: value,
}));

export const TYPE_DEPENSE_OPTIONS = TYPE_DEPENSE_VALUES.map(value => ({
  label: value,
  value: value,
}));

export const TYPE_REVENU_OPTIONS = TYPE_REVENU_VALUES.map(value => ({
  label: value,
  value: value,
}));

/**
 * Fonctions utilitaires pour la validation des types
 */
export const isValidTypeCompte = (value: string): value is TypeCompte => {
  return TYPE_COMPTE_VALUES.includes(value as TypeCompteEnum);
};

export const isValidTypeDepense = (value: string): value is TypeDepense => {
  return TYPE_DEPENSE_VALUES.includes(value as TypeDepenseEnum);
};

export const isValidTypeRevenu = (value: string): value is TypeRevenu => {
  return TYPE_REVENU_VALUES.includes(value as TypeRevenuEnum);
};