import mongoose, { Schema } from 'mongoose';
import { IDepense, TypeCompte } from '../types/depense.types';

const DepenseSchema = new Schema<IDepense>({
  montant: { type: Number, required: true },
  description: { type: String, required: false},
  date: { type: Date, required: true },
  commentaire: { type: String },
  typeCompte: { type: String, enum: ['Perso', 'Conjoint', 'Commun'] as TypeCompte[], required: true },
  recurrence: { type: Boolean, default: false },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IDepense>('Depense', DepenseSchema);
