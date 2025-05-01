import { Document, Types } from 'mongoose';

export type TypeCompte = 'Perso' |'Conjoint';
export type TypeDepense = 'Perso' | 'Commune';


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
}

export interface IDepenseResponse {
  id: string;
  montant: number;
  description?: string;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
  typeDepense: TypeDepense;
  recurrence: boolean;
  categorie: {
    id: string;
    nom: string;
  };
  utilisateur: {
    id: string;
    nom: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 