export const STATISTIQUES = {
  // Messages de succès
  SUCCESS: {
    FETCHED: "Données récupérées avec succès",
    DEPENSES_MENSUELLES: "Dépenses mensuelles récupérées avec succès",
    REPARTITION_CATEGORIE: "Répartition par catégorie récupérée avec succès",
    SOLDE_MENSUEL: "Solde mensuel récupéré avec succès",
    COMPARAISON_MOIS: "Comparaison des mois récupérée avec succès",
    EVOLUTION_DEPENSES: "Évolution des dépenses récupérée avec succès",
    EVOLUTION_REVENUS: "Évolution des revenus récupérée avec succès",
    EVOLUTION_SOLDES: "Évolution des soldes récupérée avec succès",
    CONTRIBUTIONS_COUPLE: "Contributions du couple récupérées avec succès",
    CHARGES_FIXES: "Charges fixes récupérées avec succès",
    SYNTHESE_MENSUELLE: "Synthèse mensuelle générée avec succès",
    FLUX_MENSUEL: "Total des flux mensuels récupéré avec succès",
  },

  // Messages d'erreur
  ERRORS: {
    UNAUTHORIZED: "Vous n'êtes pas autorisé à accéder à ces statistiques",
    NO_PARTNER: "Vous n'avez pas de partenaire associé",
    FETCH_ERROR: "Erreur lors de la récupération des statistiques",
    DEPENSES_MENSUELLES: "Erreur lors du calcul des dépenses mensuelles",
    REPARTITION_CATEGORIE: "Erreur lors de la récupération de la répartition par catégorie",
    SOLDE_MENSUEL: "Erreur lors de la récupération du solde mensuel",
    COMPARAISON_MOIS: "Erreur lors de la comparaison des mois",
    EVOLUTION_DEPENSES: "Erreur lors de la récupération de l'évolution des dépenses",
    EVOLUTION_REVENUS: "Erreur lors de la récupération de l'évolution des revenus",
    EVOLUTION_SOLDES: "Erreur lors de la récupération de l'évolution des soldes",
    CONTRIBUTIONS_COUPLE: "Erreur lors de la récupération des contributions du couple",
    CHARGES_FIXES: "Erreur lors de la récupération des charges fixes",
    SYNTHESE_MENSUELLE: "Erreur lors de la récupération de la synthèse mensuelle",
    VALIDATION_ERROR: "Erreur de validation des données",
  },
} as const;
