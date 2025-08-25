export interface CategorieBase {
  _id: string;
  nom: string;
}

export interface ICategorie extends CategorieBase {
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoriePayload = Omit<
  ICategorie,
  '_id' | 'createdAt' | 'updatedAt'
>;
