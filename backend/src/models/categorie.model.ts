import mongoose, { Schema } from "mongoose";
import { ICategorie } from "../types/categorie.types";

const CategorieSchema = new Schema<ICategorie>(
  {
    nom: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<ICategorie>("Categorie", CategorieSchema);
