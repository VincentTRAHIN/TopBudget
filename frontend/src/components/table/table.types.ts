import type { DataEnum } from './index';
import { IconName } from 'lucide-react/dynamic';
import React from 'react';

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
}

export enum DisplayType {
  DATE = 'date',
  CURRENCY = 'currency',
  ICON = 'icon',
  ENUM = 'enum', // Ajout de la valeur ENUM
}

export type TableCustomFilter =
  | ((value?: any) => Array<{
      label: string;
      type: string;
      onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }>)
  | undefined;

export interface TableColumn<T, D = any> {
  /**
   * Permet d'afficher un filtre personnalisé dans l'en-tête de la colonne (ex: range, datepicker, etc.)
   * Peut être un ReactNode ou une fonction qui reçoit { value, onChange, data }
   */
    customFilter?: TableCustomFilter;
  /**
   * Fonction pour obtenir dynamiquement une icône Lucide (nom, taille, couleur)
   */
  getIcon?: (row: T) => { name: IconName; size?: number; color?: string } | null | undefined;  /**
   * En-tête de la colonne
   * Si non défini, utilise l'accessor comme en-tête
   */
  header?: string;
  /**
   * Accesseur pour la colonne
   * Clé de l'objet
   */
  accessor: keyof T;
   /* Classe supplémentaire CSS pour la cellule
   */
  className?: string;

  /**
   * Fonction pour afficher la valeur de la cellule
   * Si non défini, utilise la valeur brute de l'accessor
   */
  getValue?: (row: T) => string;
  /**
   * Fonction pour obtenir la devise actuelle
   * Si non défini, utilise '€' par défaut
   */
  getCurrentCurrency?: () => string;
  /**
   * Active le tri sur la colonne. Si true, clic sur l'en-tête pour trier
   */
  enableSort?: boolean;
  /**
   * Type de la donnée (pour le traitement/filtrage)
   */
  dataType: DataType;
  /**
   * Type d'affichage (pour le rendu visuel)
   */
  displayType?: DisplayType;
  /**
   * Fonction pour formater la date
   * Utilisation du format de dayjs
   * Exemple : 'DD/MM/YYYY' ou 'YYYY-MM-DD HH:mm:ss'
   * par défaut, "DD/MM/YYYY"
   */
  dateFormat?: string;
}

export interface TableAction<T> {
  header?: string | React.ReactNode;
  accessor: keyof T | ((row: T) => void);
  action: ((row: T) => Promise<void> | void);
  className?: string;
  /**
   * Fonction pour obtenir dynamiquement une icône Lucide (nom, taille, couleur)
   */
  icon: IconName
  color?: string;

  ariaLabel?: string | ((row: T) => string);
  /**
   * Désactive le bouton d'action (booléen ou fonction selon la ligne)
   */
  disabled?: boolean | ((row: T) => boolean);
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  footer?: React.ReactNode;
  rowAction?: TableAction<T>[];
  emptyRender?: React.ReactNode;
}
