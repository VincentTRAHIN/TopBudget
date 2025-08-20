import { CategorieBase } from './categorie.type';
import { UserElementChild } from './user.type';

export type TypeCompte = 'Perso' | 'Conjoint';
export type TypeDepense = 'Perso' | 'Commune';

export interface IDepense {
  _id: string;
  montant: number;
  date: string;
  description?: string;
  commentaire?: string;
  typeCompte: TypeCompte;
  typeDepense: TypeDepense;
  recurrence?: boolean;
  categorie: CategorieBase;
  utilisateur: UserElementChild;
  createdAt?: string;
  updatedAt?: string;
  estChargeFixe?: boolean;
}

export type DepensePayload = Omit<
  IDepense,
  '_id' | 'utilisateur' | 'createdAt' | 'updatedAt'
>;
