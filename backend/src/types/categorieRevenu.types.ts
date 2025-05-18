import { Document } from "mongoose";

export interface ICategorieRevenu extends Document {
  _id: string;
  nom: string;
  description?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategorieRevenuInput {
  nom: string;
  description?: string;
  image?: string;
}

export interface ICategorieRevenuResponse {
  _id: string;
  nom: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}
