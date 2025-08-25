/**
 * Vérifie la présence des variables d'environnement requises.
 * Arrête le process si une variable est manquante.
 */
const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "PORT"
  // Ajoute ici d'autres variables obligatoires si besoin
];

export function checkEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Affiche toutes les variables manquantes
    console.error("[FATAL] Variables d'environnement manquantes :", missing.join(", "));
    process.exit(1);
  }
}
