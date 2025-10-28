/**
 * Types communs partagés dans l'application TopBudget
 * Ces types doivent être synchronisés avec les types frontend
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

/**
 * Fréquences de récurrence pour les dépenses et revenus récurrents
 */
export enum RecurringFrequencyEnum {
  DAILY = 'Daily',           // Quotidien
  WEEKLY = 'Weekly',         // Hebdomadaire
  BIWEEKLY = 'BiWeekly',     // Toutes les 2 semaines
  MONTHLY = 'Monthly',       // Mensuel
  QUARTERLY = 'Quarterly',   // Trimestriel
  BIANNUAL = 'BiAnnual',     // Semestriel
  ANNUAL = 'Annual',         // Annuel
}

// Types string pour compatibilité avec l'existant
export type TypeCompte = keyof typeof TypeCompteEnum;
export type TypeDepense = keyof typeof TypeDepenseEnum; 
export type TypeRevenu = keyof typeof TypeRevenuEnum;
export type RecurringFrequency = keyof typeof RecurringFrequencyEnum;

// Alias pour compatibilité ascendante
export type TypeCompteRevenu = TypeRevenu;

/**
 * Constantes pour les valeurs des enums (utiles pour les validations)
 */
export const TYPE_COMPTE_VALUES = Object.values(TypeCompteEnum);
export const TYPE_DEPENSE_VALUES = Object.values(TypeDepenseEnum);
export const TYPE_REVENU_VALUES = Object.values(TypeRevenuEnum);
export const RECURRING_FREQUENCY_VALUES = Object.values(RecurringFrequencyEnum);

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

export const isValidRecurringFrequency = (value: string): value is RecurringFrequency => {
  return RECURRING_FREQUENCY_VALUES.includes(value as RecurringFrequencyEnum);
};