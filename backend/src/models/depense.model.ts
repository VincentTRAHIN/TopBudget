import mongoose, { Schema } from "mongoose";
import { IDepense, TypeCompteEnum, TypeDepenseEnum, RecurringFrequencyEnum } from "../types/depense.types";

const DepenseSchema = new Schema<IDepense>(
  {
    montant: { type: Number, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    commentaire: { type: String },
    typeCompte: {
      type: String,
      enum: Object.values(TypeCompteEnum),
      default: TypeCompteEnum.PERSO,
    },
    typeDepense: {
      type: String,
      enum: Object.values(TypeDepenseEnum),
      default: TypeDepenseEnum.PERSO,
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
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: Object.values(RecurringFrequencyEnum),
      required: false,
    },
    nextDueDate: { type: Date, required: false },
    lastPaidDate: { type: Date, required: false },
  },
  { timestamps: true }
);

DepenseSchema.index({ utilisateur: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, categorie: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, estChargeFixe: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, typeDepense: 1, date: -1 });

DepenseSchema.index({ utilisateur: 1, typeCompte: 1, date: -1 });

DepenseSchema.index({ description: "text", commentaire: "text" });

DepenseSchema.index({ utilisateur: 1, isRecurring: 1, nextDueDate: 1 });

export default mongoose.model<IDepense>("Depense", DepenseSchema);
