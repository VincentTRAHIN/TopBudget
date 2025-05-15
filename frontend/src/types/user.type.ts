export type RoleUtilisateur = 'Perso' | 'Conjoint' | 'Admin';

export interface IUser {
  _id: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  token?: string;
  createdAt?: string;
  avatarUrl?: string;
  partenaireId?: {
    _id: string;
    nom: string;
    email: string;
    avatarUrl?: string;
  } | string | null;
}

export type UserRegisterPayload = {
  nom: string;
  email: string;
  motDePasse: string;
};

export type UserLoginPayload = {
  email: string;
  motDePasse: string;
};
