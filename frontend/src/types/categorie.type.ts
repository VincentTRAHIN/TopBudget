export interface ICategorie {
  _id: string;
  nom: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoriePayload = Omit<
  ICategorie,
  '_id' | 'createdAt' | 'updatedAt'
>;
