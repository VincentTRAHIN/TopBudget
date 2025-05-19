export interface AuthInscriptionBody {
  nom: string;
  email: string;
  motDePasse: string;
}

export interface AuthConnexionBody {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  _id: string;
  nom: string;
  email: string;
  token: string;
}

export interface UserProfileResponse {
  _id: string;
  nom: string;
  email: string;
  role: string;
  dateCreation: Date;
  avatarUrl?: string;
  partenaireId?: {
    _id: string;
    nom: string;
    email: string;
    avatarUrl?: string;
  };
} 