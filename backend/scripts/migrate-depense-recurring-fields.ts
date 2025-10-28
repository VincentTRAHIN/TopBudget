/**
 * Script de migration pour ajouter les champs de récurrence au modèle Depense
 * 
 * Ce script initialise les nouveaux champs isRecurring, recurringFrequency, 
 * nextDueDate et lastPaidDate pour toutes les dépenses existantes.
 * 
 * Usage: npm run migrate:depense-recurring
 */

import mongoose from "mongoose";
import DepenseModel from "../src/models/depense.model";
import { RecurringFrequencyEnum } from "../src/types/common.types";
import { config } from "../src/config/env.config";

/**
 * Calcule la prochaine date d'échéance basée sur la fréquence
 */
function calculateNextDueDate(lastDate: Date, frequency: RecurringFrequencyEnum): Date {
  const nextDate = new Date(lastDate);
  
  switch (frequency) {
    case RecurringFrequencyEnum.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case RecurringFrequencyEnum.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case RecurringFrequencyEnum.BIWEEKLY:
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case RecurringFrequencyEnum.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case RecurringFrequencyEnum.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case RecurringFrequencyEnum.BIANNUAL:
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case RecurringFrequencyEnum.ANNUAL:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
}

async function migrateDepenseRecurringFields() {
  try {
    console.log("🚀 Démarrage de la migration des champs de récurrence...");
    
    // Connexion à MongoDB
    const mongoUri = config.MONGO_URI || "mongodb://localhost:27017/topbudget";
    await mongoose.connect(mongoUri);
    console.log("✅ Connecté à MongoDB");
    
    // Statistiques de migration
    let totalDepenses = 0;
    let chargesFixesUpdated = 0;
    let recurrencesUpdated = 0;
    let alreadyMigrated = 0;
    
    // Récupérer toutes les dépenses
    const depenses = await DepenseModel.find({});
    totalDepenses = depenses.length;
    
    console.log(`📊 ${totalDepenses} dépenses trouvées`);
    
    for (const depense of depenses) {
      // Vérifier si la dépense a déjà été migrée
      if (depense.isRecurring !== undefined) {
        alreadyMigrated++;
        continue;
      }
      
      const updates: Record<string, unknown> = {};
      
      // Initialiser isRecurring en fonction de estChargeFixe et recurrence
      if (depense.estChargeFixe || depense.recurrence) {
        updates.isRecurring = true;
        updates.recurringFrequency = RecurringFrequencyEnum.MONTHLY; // Par défaut mensuel
        updates.lastPaidDate = depense.date;
        updates.nextDueDate = calculateNextDueDate(depense.date, RecurringFrequencyEnum.MONTHLY);
        
        if (depense.estChargeFixe) {
          chargesFixesUpdated++;
        } else {
          recurrencesUpdated++;
        }
      } else {
        updates.isRecurring = false;
      }
      
      // Mise à jour de la dépense
      await DepenseModel.updateOne(
        { _id: depense._id },
        { $set: updates }
      );
    }
    
    console.log("\n✅ Migration terminée avec succès!");
    console.log(`📈 Statistiques:`);
    console.log(`   - Total dépenses: ${totalDepenses}`);
    console.log(`   - Charges fixes migrées: ${chargesFixesUpdated}`);
    console.log(`   - Récurrences migrées: ${recurrencesUpdated}`);
    console.log(`   - Déjà migrées: ${alreadyMigrated}`);
    console.log(`   - Dépenses normales: ${totalDepenses - chargesFixesUpdated - recurrencesUpdated - alreadyMigrated}`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

// Exécution du script
if (require.main === module) {
  migrateDepenseRecurringFields()
    .then(() => {
      console.log("✨ Script de migration terminé");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec de la migration:", error);
      process.exit(1);
    });
}

export default migrateDepenseRecurringFields;
