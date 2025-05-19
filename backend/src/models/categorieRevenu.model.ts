import mongoose, { Schema, Document } from "mongoose";

export interface ICategorieRevenuDocument extends Document {
  nom: string;
  description?: string;
  image?: string;
  utilisateur: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorieRevenuSchema: Schema<ICategorieRevenuDocument> = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String },
    utilisateur: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

CategorieRevenuSchema.index({ nom: 1, utilisateur: 1 }, { unique: true, background: true });

export default mongoose.model<ICategorieRevenuDocument>(
  "CategorieRevenu",
  CategorieRevenuSchema,
);
