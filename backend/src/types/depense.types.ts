import { Document, Types } from 'mongoose';

export type TypeCompte = 'Perso' | 'Conjoint' | 'Commun';

export interface IDepense extends Document {
  montant: number;
  description?: string;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
  recurrence: boolean;
  categorie: Types.ObjectId;
  utilisateur: Types.ObjectId;
}

export interface IDepenseInput {
  montant: number;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
  recurrence?: boolean;
  categorie: string;
  description?: string;
  utilisateur: string;
}

export interface IDepenseResponse {
  id: string;
  montant: number;
  description?: string;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompte;
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