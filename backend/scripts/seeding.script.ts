import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import DepenseModel from "../src/models/depense.model";
import CategorieModel from "../src/models/categorie.model";
import UserModel from "../src/models/user.model";

dotenv.config();

const mongoUri =
  process.env.MONGO_URI_SEED || "mongodb://localhost:27017/topbudget";

async function seedDatabase() {
  try {
    await mongoose.connect(mongoUri);

    console.log("🔵 Connecté à MongoDB");

    await DepenseModel.deleteMany({});
    await CategorieModel.deleteMany({});
    await UserModel.deleteMany({});
    console.log("🧹 Base nettoyée");

    const user = (await UserModel.create({
      nom: "Test User",
      email: faker.internet.email(),
      motDePasse: faker.internet.password(),
      role: "Perso",
    })) as { _id: mongoose.Types.ObjectId };

    const categories: Array<typeof CategorieModel.prototype> = [];
    for (let i = 0; i < 6; i++) {
      const cat = await CategorieModel.create({
        nom: faker.commerce.department(),
        description: faker.lorem.sentence(),
      });
      categories.push(cat);
    }

    console.log(`🟢 ${categories.length} catégories créées`);

    const depenses: Array<{
      montant: number;
      date: Date;
      typeCompte: "Perso" | "Conjoint" | "Commun";
      categorie: mongoose.Types.ObjectId;
      utilisateur: mongoose.Types.ObjectId;
      commentaire: string;
    }> = [];
    for (let i = 0; i < 75; i++) {
      depenses.push({
        montant: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
        date: faker.date.recent({ days: 60 }),
        typeCompte: faker.helpers.arrayElement(["Perso", "Conjoint", "Commun"]),
        categorie: faker.helpers.arrayElement(categories)._id,
        utilisateur: user._id,
        commentaire: faker.lorem.words(3),
      });
    }

    await DepenseModel.insertMany(depenses);

    console.log(`🟢 ${depenses.length} dépenses créées`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur seed :", error);
    process.exit(1);
  }
}

seedDatabase();
