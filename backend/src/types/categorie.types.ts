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
  readonly id: string;
  readonly nom: string;
  readonly description?: string;
  readonly image?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
