import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "../types/user.types";

export type TypeCompteRevenu = "Perso" | "Conjoint";

export interface IRevenuDocument extends Document {
  montant: number;
  description: string;
  date: Date;
  typeCompte: TypeCompteRevenu;
  utilisateur: Types.ObjectId | IUser;
  commentaire?: string;
  categorieRevenu: Types.ObjectId;
  estRecurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RevenuSchema: Schema<IRevenuDocument> = new Schema(
  {
    montant: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    typeCompte: {
      type: String,
      enum: ["Perso", "Conjoint"] as TypeCompteRevenu[],
      required: true,
    },
    utilisateur: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commentaire: { type: String },
    categorieRevenu: {
      type: Schema.Types.ObjectId,
      ref: "CategorieRevenu",
      required: true,
    },
    estRecurrent: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

RevenuSchema.index({ utilisateur: 1, date: -1 });

RevenuSchema.index({ utilisateur: 1, categorieRevenu: 1, date: -1 });

RevenuSchema.index({ utilisateur: 1, estRecurrent: 1, date: -1 });

RevenuSchema.index({ utilisateur: 1, typeCompte: 1, date: -1 });

RevenuSchema.index({ description: "text", commentaire: "text" });

export default mongoose.model<IRevenuDocument>("Revenu", RevenuSchema);
