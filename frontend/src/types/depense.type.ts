import { ICategorie } from './categorie.type';

export type TypeCompte = 'Perso' | 'Conjoint' | 'Commun';

export interface IDepense {
  _id: string;
  montant: number;
  date: string;
  commentaire?: string;
  typeCompte: TypeCompte;
  recurrence?: boolean;
  categorie: ICategorie | string;
  utilisateur: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DepensePayload = Omit<
  IDepense,
  '_id' | 'utilisateur' | 'createdAt' | 'updatedAt'
>;
