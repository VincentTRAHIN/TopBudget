import mongoose, { Schema, Document } from 'mongoose';

export interface ICategorie extends Document {
  nom: string;
  description?: string;
  image?: string;
}

const CategorieSchema = new Schema<ICategorie>({
  nom: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

export default mongoose.model<ICategorie>('Categorie', CategorieSchema);
