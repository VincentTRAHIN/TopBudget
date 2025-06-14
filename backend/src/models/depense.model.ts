import mongoose, { Schema } from "mongoose";
import { IDepense, TypeCompte, TypeDepense } from "../types/depense.types";

const DepenseSchema = new Schema<IDepense>(
  {
    montant: { type: Number, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    commentaire: { type: String },
    typeCompte: {
      type: String,
      enum: ["Perso", "Conjoint"] as TypeCompte[],
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
  { timestamps: true },
);

// Indexes for optimal query performance
// Primary index for user-specific queries with date sorting (most common pattern)
DepenseSchema.index({ utilisateur: 1, date: -1 });

// Compound index for filtering by category within user context
DepenseSchema.index({ utilisateur: 1, categorie: 1, date: -1 });

// Compound index for filtering by estChargeFixe (used in statistiques)
DepenseSchema.index({ utilisateur: 1, estChargeFixe: 1, date: -1 });

// Compound index for filtering by typeDepense within user context
DepenseSchema.index({ utilisateur: 1, typeDepense: 1, date: -1 });

// Compound index for filtering by typeCompte within user context
DepenseSchema.index({ utilisateur: 1, typeCompte: 1, date: -1 });

// Text search index for description and commentaire fields
DepenseSchema.index({ description: "text", commentaire: "text" });

export default mongoose.model<IDepense>("Depense", DepenseSchema);
