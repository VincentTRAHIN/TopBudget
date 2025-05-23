import { Document, Types } from "mongoose";

export type TypeCompte = "Perso" | "Conjoint";
export type TypeDepense = "Perso" | "Commune";

export interface IDepense extends Document {
  montant: number;
  description?: string;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
  typeDepense: TypeDepense;
  recurrence: boolean;
  categorie: Types.ObjectId;
  utilisateur: Types.ObjectId;
  estChargeFixe: boolean;
}

/**
 * Interface pour les documents de dépense avec champs populés
 */
export interface IDepensePopulated
  extends Omit<IDepense, "categorie" | "utilisateur"> {
  categorie: {
    _id: Types.ObjectId;
    nom: string;
    description?: string;
    image?: string;
  };
  utilisateur: {
    _id: Types.ObjectId;
    nom: string;
  };
}

export interface IDepenseInput {
  montant: number;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
  typeDepense: TypeDepense;
  recurrence?: boolean;
  categorie: Types.ObjectId;
  description?: string;
  utilisateur: Types.ObjectId;
  estChargeFixe?: boolean;
}

export interface IDepenseResponse {
  readonly id: string;
  readonly montant: number;
  readonly description?: string;
  readonly date: Date;
  readonly commentaire?: string;
  readonly typeCompte: TypeCompte;
  readonly typeDepense: TypeDepense;
  readonly recurrence: boolean;
  readonly categorie: {
    readonly id: string;
    readonly nom: string;
  };
  readonly utilisateur: {
    readonly id: string;
    readonly nom: string;
  };
  readonly estChargeFixe: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
