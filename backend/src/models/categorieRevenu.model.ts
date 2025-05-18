import mongoose, { Schema, Document } from "mongoose";

export interface ICategorieRevenuDocument extends Document {
  nom: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorieRevenuSchema: Schema<ICategorieRevenuDocument> = new Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<ICategorieRevenuDocument>(
  "CategorieRevenu",
  CategorieRevenuSchema,
);
