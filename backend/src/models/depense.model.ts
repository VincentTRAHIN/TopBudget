import mongoose, { Schema } from "mongoose";
import { IDepense, TypeCompteEnum, TypeDepense } from "../types/depense.types";

const DepenseSchema = new Schema<IDepense>(
  {
    montant: { type: Number, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    commentaire: { type: String },
    typeCompte: {
      type: String,
      enum: ["Perso", "Conjoint"] as TypeCompteEnum[],
      default: "Perso",
    },
    typeDepense: {
      type: String,
      enum: ["Perso", "Commune"] as TypeDepense[],
      default: "Perso",
    },
    recurrence: { type: Boolean, default: false },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
    },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    estChargeFixe: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

DepenseSchema.index({ utilisateur: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, categorie: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, estChargeFixe: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, typeDepense: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, typeCompte: 1, date: -1 });

DepenseSchema.index({ description: "text", commentaire: "text" });

export default mongoose.model<IDepense>("Depense", DepenseSchema);
