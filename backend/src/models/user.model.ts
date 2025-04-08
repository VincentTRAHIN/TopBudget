import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  dateCreation: Date;
  role: 'Perso' | 'Conjoint' | 'Admin';
  comparerMotDePasse(motDePasse: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  dateCreation: { type: Date, default: Date.now },
  role: { type: String, enum: ['Perso', 'Conjoint', 'Admin'], default: 'Perso' },
});

// Hash du mot de passe avant save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparerMotDePasse = async function (motDePasse: string): Promise<boolean> {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

export default mongoose.model<IUser>('User', UserSchema);
