import { Document, Schema } from "mongoose";

export type UserRole = "Perso" | "Conjoint" | "Admin";

export interface IUser extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  dateCreation: Date;
  role: UserRole;
  avatarUrl?: string;
  partenaireId?: Schema.Types.ObjectId;
  sobriquetPartenaire?: string;
  comparerMotDePasse(motDePasse: string): Promise<boolean>;
}

/**
 * Interface pour les documents utilisateur avec champ partenaire populé
 */
export interface IUserPopulated extends Omit<IUser, 'partenaireId'> {
  partenaireId?: Pick<IUser, "_id" | "nom" | "email" | "avatarUrl"> | null;
}

export interface IUserInput {
  nom: string;
  email: string;
  motDePasse: string;
  role?: UserRole;
}

export interface IUserLogin {
  readonly email: string;
  readonly motDePasse: string;
}

export interface IUserResponse {
  readonly id: string;
  readonly nom: string;
  readonly email: string;
  readonly role: UserRole;
  readonly dateCreation: Date;
  readonly avatarUrl?: string;
  readonly partenaireId?: string | null;
  readonly sobriquetPartenaire?: string;
}

export interface IUserProfileUpdateInput {
  nom?: string;
  email?: string;
  avatarUrl?: string;
  partenaireId?: string | null;
}
