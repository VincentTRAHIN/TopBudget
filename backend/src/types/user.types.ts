import { Document, Schema } from 'mongoose';

export type UserRole = 'Perso' | 'Conjoint' | 'Admin';

export interface IUser extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  dateCreation: Date;
  role: UserRole;
  avatarUrl?: string;
  partenaireId?: Schema.Types.ObjectId;
  comparerMotDePasse(motDePasse: string): Promise<boolean>;
}

export interface IUserInput {
  nom: string;
  email: string;
  motDePasse: string;
  role?: UserRole;
}

export interface IUserLogin {
  email: string;
  motDePasse: string;
}

export interface IUserResponse {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  dateCreation: Date;
  avatarUrl?: string;
  partenaireId?: string | null;
}

export interface IUserProfileUpdateInput {
  nom?: string;
  email?: string;
  avatarUrl?: string;
  partenaireId?: string | null;
} 