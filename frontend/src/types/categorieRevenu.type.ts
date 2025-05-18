export interface ICategorieRevenu {
  _id: string;
  nom: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategorieRevenuPayload = {
  nom: string;
  description?: string;
  image?: string;
};
