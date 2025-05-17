import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserRole } from "../types/user.types";

const UserSchema = new Schema<IUser>({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  dateCreation: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ["Perso", "Conjoint", "Admin"] as UserRole[],
    default: "Perso",
  },
  avatarUrl: { type: String, required: false },
  partenaireId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
    unique: true,
    sparse: true,
  },
});

// Hash du mot de passe avant save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("motDePasse")) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparerMotDePasse = async function (
  motDePasse: string,
): Promise<boolean> {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

export default mongoose.model<IUser>("User", UserSchema);
