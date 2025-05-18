import { ICategorieRevenu } from './categorieRevenu.type';

export type TypeCompteRevenu = 'Perso' | 'Conjoint';

export interface IRevenu {
  _id: string;
  montant: number;
  description: string;
  date: string;
  typeCompte: TypeCompteRevenu;
  utilisateur: { _id: string; nom: string } | string;
  commentaire?: string;
  categorieRevenu: ICategorieRevenu | string;
  estRecurrent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RevenuPayload = {
  montant: number | string;
  description: string;
  date: string;
  typeCompte: TypeCompteRevenu;
  commentaire?: string;
  categorieRevenu: string;
  estRecurrent: boolean;
};
