import { CategorieBase } from './categorie.type';
import { ICategorieRevenu } from './categorieRevenu.type';
import { UserElementChild } from './user.type';

export type TypeCompteRevenu = 'Perso' | 'Conjoint';

export interface IRevenu {
  _id: string;
  montant: number;
  description: string;
  date: string;
  typeCompte: TypeCompteRevenu;
  utilisateur: UserElementChild;
  commentaire?: string;
  categorieRevenu: CategorieBase;
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
