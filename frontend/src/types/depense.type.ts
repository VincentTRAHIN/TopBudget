import { ICategorie } from './categorie.type';

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
  categorie: ICategorie | string;
  utilisateur: { _id: string; nom: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

export type DepensePayload = Omit<
  IDepense,
  '_id' | 'utilisateur' | 'createdAt' | 'updatedAt'
>;
