import { Document, Types } from "mongoose";
import { IUser } from "./user.types";

export type TypeCompteRevenu = "Perso" | "Conjoint";

export interface ICategorieRevenu {
  _id: string | Types.ObjectId;
  nom: string;
  description?: string;
  image?: string;
}

export interface IRevenu extends Document {
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

/**
 * Interface pour les documents de revenu avec champs populés
 */
export interface IRevenuPopulated
  extends Omit<IRevenu, "utilisateur" | "categorieRevenu"> {
  utilisateur: Pick<IUser, "_id" | "nom" | "email">;
  categorieRevenu: ICategorieRevenu;
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
  readonly _id: string;
  readonly montant: number;
  readonly description: string;
  readonly date: string;
  readonly typeCompte: TypeCompteRevenu;
  readonly utilisateur: {
    readonly _id: string;
    readonly nom: string;
    readonly email?: string;
  };
  readonly commentaire?: string;
  readonly categorieRevenu: {
    readonly _id: string;
    readonly nom: string;
    readonly description?: string;
    readonly image?: string;
  };
  readonly estRecurrent: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
