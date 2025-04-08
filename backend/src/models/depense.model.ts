import mongoose, { Schema, Document } from 'mongoose';

export interface IDepense extends Document {
  montant: number;
  date: Date;
  commentaire?: string;
  typeCompte: 'Perso' | 'Conjoint' | 'Commun';
  recurrence: boolean;
  categorie: mongoose.Types.ObjectId;
  utilisateur: mongoose.Types.ObjectId;
}

const DepenseSchema = new Schema<IDepense>({
  montant: { type: Number, required: true },
  date: { type: Date, required: true },
  commentaire: { type: String },
  typeCompte: { type: String, enum: ['Perso', 'Conjoint', 'Commun'], required: true },
  recurrence: { type: Boolean, default: false },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IDepense>('Depense', DepenseSchema);
