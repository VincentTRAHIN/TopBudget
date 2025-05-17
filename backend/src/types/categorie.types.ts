import { Document } from "mongoose";

export interface ICategorie extends Document {
  nom: string;
  description?: string;
  image?: string;
}

export interface ICategorieInput {
  nom: string;
  description?: string;
  image?: string;
}

export interface ICategorieResponse {
  id: string;
  nom: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
