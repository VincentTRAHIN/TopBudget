import { Types } from "mongoose";

export type TypeCompteRevenu = "Perso" | "Conjoint";

export interface ICategorieRevenu {
  _id: string | Types.ObjectId;
  nom: string;
  description?: string;
  image?: string;
}

export interface IRevenu {
  _id: string | Types.ObjectId;
  montant: number;
  description: string;
  date: Date;
  typeCompte: TypeCompteRevenu;
  utilisateur: Types.ObjectId;
  commentaire?: string;
  categorieRevenu: Types.ObjectId | ICategorieRevenu;
  estRecurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRevenuInput {
  montant: number;
  description: string;
  date: string | Date;
  typeCompte: TypeCompteRevenu;
  commentaire?: string;
  categorieRevenu: string;
  estRecurrent?: boolean;
}

export interface IRevenuResponse {
  _id: string;
  montant: number;
  description: string;
  date: string;
  typeCompte: TypeCompteRevenu;
  utilisateur: {
    _id: string;
    nom: string;
    email?: string;
  };
  commentaire?: string;
  categorieRevenu: {
    _id: string;
    nom: string;
    description?: string;
    image?: string;
  };
  estRecurrent: boolean;
  createdAt: string;
  updatedAt: string;
}
