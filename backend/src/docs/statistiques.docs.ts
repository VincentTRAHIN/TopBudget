/**
 * @swagger
 * components:
 *   schemas:
 *     StatistiquesResponse:
 *       type: object
 *       properties:
 *         depensesParCategorie:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               categorie:
 *                 type: string
 *                 description: Nom de la catégorie
 *               montant:
 *                 type: number
 *                 description: Montant total des dépenses
 *               pourcentage:
 *                 type: number
 *                 description: Pourcentage du total
 *         depensesParMois:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               mois:
 *                 type: string
 *                 description: Mois au format YYYY-MM
 *               montant:
 *                 type: number
 *                 description: Montant total des dépenses
 *         budgetRestant:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Montant total des budgets
 *             depenses:
 *               type: number
 *               description: Montant total des dépenses
 *             restant:
 *               type: number
 *               description: Montant restant
 *             pourcentage:
 *               type: number
 *               description: Pourcentage du budget utilisé
 *     StatistiquesMensuelles:
 *       type: object
 *       properties:
 *         mois:
 *           type: string
 *           format: date
 *           description: Mois concerné
 *         total:
 *           type: number
 *           description: Total des dépenses du mois
 *     RepartitionCategorie:
 *       type: object
 *       properties:
 *         categorie:
 *           type: string
 *           description: Nom de la catégorie
 *         montant:
 *           type: number
 *           description: Montant total des dépenses
 *         pourcentage:
 *           type: number
 *           description: Pourcentage du total
 *     ComparaisonMois:
 *       type: object
 *       properties:
 *         moisPrecedent:
 *           type: string
 *           format: date
 *           description: Mois précédent
 *         moisCourant:
 *           type: string
 *           format: date
 *           description: Mois courant
 *         difference:
 *           type: number
 *           description: Différence entre les deux mois
 *         pourcentage:
 *           type: number
 *           description: Pourcentage de variation
 *     EvolutionMensuelleData:
 *       type: object
 *       properties:
 *         mois:
 *           type: string
 *           description: Mois au format YYYY-MM
 *         totalDepenses:
 *           type: number
 *           description: Montant total des dépenses pour le mois
 *     EvolutionMensuelleDataCouple:
 *       type: object
 *       properties:
 *         mois:
 *           type: string
 *           description: Mois au format YYYY-MM
 *         depensesPersoUserA:
 *           type: number
 *           description: Dépenses personnelles de l'utilisateur A (utilisateur authentifié)
 *         depensesPersoUserB:
 *           type: number
 *           description: Dépenses personnelles du partenaire
 *         depensesCommunes:
 *           type: number
 *           description: Dépenses communes du couple
 *     EvolutionMensuelleResponse:
 *       oneOf:
 *         - type: array
 *           items:
 *             $ref: '#/components/schemas/EvolutionMensuelleData'
 *         - type: array
 *           items:
 *             $ref: '#/components/schemas/EvolutionMensuelleDataCouple'
 *
 *     SyntheseMensuelleBase:
 *       type: object
 *       properties:
 *         moisCourant:
 *           type: string
 *           description: Le mois et l'année de la synthèse (YYYY-MM).
 *         categoriesEnHausse:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               categorieId:
 *                 type: string
 *                 format: ObjectId
 *               nom:
 *                 type: string
 *               montantMoisCourant:
 *                 type: number
 *               montantMoisPrecedent:
 *                 type: number
 *               augmentationPourcentage:
 *                 type: number
 *           description: Liste des catégories avec une augmentation significative des dépenses.
 *
 *     SyntheseMensuelleMoiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SyntheseMensuelleBase'
 *         - type: object
 *           properties:
 *             totaux:
 *               type: object
 *               properties:
 *                 personnelles:
 *                   type: number
 *                   description: Total des dépenses personnelles de l'utilisateur pour le mois.
 *                 communesPayeesParMoi:
 *                   type: number
 *                   description: Total des dépenses communes payées par l'utilisateur pour le mois.
 *
 *     SyntheseMensuelleCoupleResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SyntheseMensuelleBase'
 *         - type: object
 *           properties:
 *             totaux:
 *               type: object
 *               properties:
 *                 personnellesMoi:
 *                   type: number
 *                   description: Total des dépenses personnelles de l'utilisateur connecté pour le mois.
 *                 personnellesPartenaire:
 *                   type: number
 *                   description: Total des dépenses personnelles du partenaire pour le mois.
 *                 communesCouple:
 *                   type: number
 *                   description: Total des dépenses communes du couple pour le mois.
 *     RepartitionRevenusCategorie:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la catégorie de revenu
 *         nom:
 *           type: string
 *           description: Nom de la catégorie de revenu
 *         total:
 *           type: number
 *           description: Montant total des revenus pour cette catégorie
 */

/**
 * @swagger
 * /api/statistiques:
 *   get:
 *     summary: Récupère les statistiques globales
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour le filtre
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour le filtre
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Statistiques globales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatistiquesResponse'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/budget/{budgetId}:
 *   get:
 *     summary: Récupère les statistiques d'un budget spécifique
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du budget
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Statistiques du budget
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatistiquesResponse'
 *       404:
 *         description: Budget non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/categorie/{categorieId}:
 *   get:
 *     summary: Récupère les statistiques d'une catégorie spécifique
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categorieId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour le filtre
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour le filtre
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Statistiques de la catégorie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatistiquesResponse'
 *       404:
 *         description: Catégorie non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/total-mensuel:
 *   get:
 *     summary: Récupère le total mensuel pour un type de flux (dépenses ou revenus)
 *     description: Permet de récupérer le total mensuel pour un type de flux donné (dépenses ou revenus). Utilisez le paramètre typeFlux pour choisir le type (par défaut : dépenses).
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: MM
 *         required: false
 *         description: Mois spécifique (format MM). Si non fourni, utilise le mois actuel.
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: yyyy
 *         required: false
 *         description: Année spécifique (format YYYY). Si non fournie, utilise l'année actuelle.
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         required: false
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         required: false
 *         description: Contexte d'analyse ('moi' = dépenses personnelles, 'couple' = dépenses du couple)
 *       - in: query
 *         name: typeFlux
 *         schema:
 *           type: string
 *           enum: [depenses, revenus]
 *         description: Type de flux à totaliser ("depenses" ou "revenus"). Par défaut : "depenses".
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Total mensuel récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/par-categorie:
 *   get:
 *     summary: Récupère la répartition des dépenses par catégorie
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: date
 *         description: Mois spécifique (format YYYY-MM)
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: yyyy
 *         description: Année spécifique (format YYYY)
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         required: false
 *         description: Contexte d'analyse ('moi' = dépenses personnelles, 'couple' = dépenses communes du couple)
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Répartition des dépenses par catégorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepartitionCategorie'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/comparaison-mois:
 *   get:
 *     summary: Compare les flux entre deux mois
 *     description: Compare les dépenses, revenus ou le solde entre deux mois. Utilisez le paramètre type pour choisir ce qui est comparé.
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: moisPrecedent
 *         schema:
 *           type: string
 *           format: MM
 *         description: Mois précédent (format MM). Si non fourni, le mois précédent sera calculé automatiquement.
 *       - in: query
 *         name: anneePrecedente
 *         schema:
 *           type: string
 *           format: YYYY
 *         description: Année du mois précédent (format YYYY)
 *       - in: query
 *         name: moisActuel
 *         schema:
 *           type: string
 *           format: MM
 *         description: Mois courant (format MM). Si non fourni, le mois courant sera calculé automatiquement.
 *       - in: query
 *         name: anneeActuelle
 *         schema:
 *           type: string
 *           format: YYYY
 *         description: Année du mois courant (format YYYY)
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         description: Contexte d'analyse ('moi' = personnel, 'couple' = couple)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depenses, revenus, solde]
 *         description: Type de comparaison : "depenses" (par défaut), "revenus" ou "solde". La réponse change selon ce type :
 *           - depenses : différence et pourcentage sur les dépenses
 *           - revenus : différence et pourcentage sur les revenus
 *           - solde : différence et pourcentage sur le solde (revenus - dépenses)
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Comparaison entre deux mois récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 moisActuel:
 *                   type: string
 *                 moisPrecedent:
 *                   type: string
 *                 totalMoisActuel:
 *                   type: number
 *                 totalMoisPrecedent:
 *                   type: number
 *                 difference:
 *                   type: number
 *                 pourcentageVariation:
 *                   type: number
 *                 typeCompare:
 *                   type: string
 *                   enum: [depenses, revenus, solde]
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/evolution-mensuelle:
 *   get:
 *     summary: Récupère l'évolution mensuelle d'un type de flux (dépenses, revenus ou solde)
 *     description: Permet de visualiser l'évolution mensuelle d'un type de flux (dépenses, revenus ou solde) sur plusieurs mois. Utilisez le paramètre dataType pour choisir le type (par défaut : dépenses).
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nbMois
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Nombre de mois à afficher (entre 1 et 24), par défaut 6.
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         description: Contexte d'analyse ('moi' = personnel, 'couple' = couple)
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *           enum: [depenses, revenus, solde]
 *         description: Type de données à afficher ("depenses" par défaut, ou "revenus", ou "solde").
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Évolution mensuelle récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   mois:
 *                     type: string
 *                   total:
 *                     type: number
 *       400:
 *         description: Paramètre nbMois invalide.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/couple/resume-contributions:
 *   get:
 *     summary: Récapitulatif des contributions de chaque membre du couple pour les dépenses communes d'un mois donné
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: MM
 *         required: false
 *         description: Mois concerné (format MM, ex: "05"). Si non fourni, le mois courant est utilisé.
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: YYYY
 *         required: false
 *         description: Année concernée (format YYYY). Si non fournie, l'année courante est utilisée.
 *     responses:
 *       200:
 *         description: Résumé des contributions du couple pour les dépenses communes du mois sélectionné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDepensesCommunes:
 *                   type: number
 *                   description: Total des dépenses communes du couple pour la période
 *                 contributionUtilisateurActuel:
 *                   type: number
 *                   description: Montant payé par l'utilisateur authentifié pour les dépenses communes
 *                 contributionPartenaire:
 *                   type: number
 *                   description: Montant payé par le partenaire pour les dépenses communes
 *                 ecartUtilisateurActuel:
 *                   type: number
 *                   description: Différence entre la contribution réelle de l'utilisateur et la part théorique (positive = l'utilisateur a trop payé, négative = il doit de l'argent à son partenaire)
 *       400:
 *         description: Erreur de paramètre ou couple non lié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/couple/charges-fixes:
 *   get:
 *     summary: Liste les charges fixes communes du couple pour un mois donné
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: MM
 *         required: false
 *         description: Mois concerné (format MM, ex: "05"). Si non fourni, le mois courant est utilisé.
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: YYYY
 *         required: false
 *         description: Année concernée (format YYYY). Si non fournie, l'année courante est utilisée.
 *     responses:
 *       200:
 *         description: Liste des charges fixes communes du couple pour la période sélectionnée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listeChargesFixes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       montant:
 *                         type: number
 *                         description: Montant de la charge fixe
 *                       categorieNom:
 *                         type: string
 *                         description: Nom de la catégorie
 *                       payePar:
 *                         type: string
 *                         description: Nom du payeur
 *                       description:
 *                         type: string
 *                         description: Description de la charge fixe
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date de la charge fixe
 *                 totalChargesFixesCommunes:
 *                   type: number
 *                   description: Total des charges fixes communes du couple pour la période
 *       400:
 *         description: Erreur de paramètre ou couple non lié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/synthese-mensuelle:
 *   get:
 *     summary: Récupère la synthèse mensuelle des dépenses.
 *     description: Fournit un résumé des dépenses pour un mois donné, en distinguant les dépenses personnelles et communes, et en mettant en évidence les catégories avec des augmentations significatives.
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: MM
 *         description: Mois pour la synthèse (format MM, ex: "07"). Si non fourni, le mois actuel est utilisé.
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: YYYY
 *         description: Année pour la synthèse (format YYYY, ex: "2023"). Si non fourni, l'année actuelle est utilisée.
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *           default: moi
 *         description: Contexte de la synthèse ('moi' pour les dépenses personnelles et communes payées par l'utilisateur, 'couple' pour une vue d'ensemble du couple).
 *     responses:
 *       200:
 *         description: Synthèse mensuelle récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/SyntheseMensuelleMoiResponse'
 *                 - $ref: '#/components/schemas/SyntheseMensuelleCoupleResponse'
 *       400:
 *         description: Paramètres invalides.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/solde-mensuel:
 *   get:
 *     summary: Récupère le solde mensuel (revenus, dépenses, solde)
 *     description: Retourne le total des revenus, des dépenses et le solde pour un mois donné. Prend en compte le contexte (moi/couple) et les filtres mois/année.
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         schema:
 *           type: string
 *           format: MM
 *         description: Mois concerné (format MM, ex: "05"). Si non fourni, le mois courant est utilisé.
 *       - in: query
 *         name: annee
 *         schema:
 *           type: string
 *           format: YYYY
 *         description: Année concernée (format YYYY). Si non fournie, l'année courante est utilisée.
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         description: Contexte d'analyse ('moi' = personnel, 'couple' = couple)
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Solde mensuel récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenus:
 *                   type: number
 *                   description: Total des revenus pour la période
 *                 totalDepenses:
 *                   type: number
 *                   description: Total des dépenses pour la période
 *                 solde:
 *                   type: number
 *                   description: Solde (revenus - dépenses)
 *       400:
 *         description: Paramètres invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/statistiques/revenus-par-categorie:
 *   get:
 *     summary: Répartition des revenus par catégorie
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mois
 *         required: true
 *         schema:
 *           type: string
 *         description: Mois au format MM (ex: 05)
 *       - in: query
 *         name: annee
 *         required: true
 *         schema:
 *           type: string
 *         description: Année au format YYYY (ex: 2025)
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         description: Contexte d'analyse (revenus personnels ou du couple)
 *       - in: query
 *         name: estRecurrent
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les revenus récurrents (fixes) ou non (optionnel)
 *     responses:
 *       200:
 *         description: Répartition des revenus par catégorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepartitionRevenusCategorie'
 *       401:
 *         description: Non autorisé
 *       400:
 *         description: Paramètres manquants ou invalides
 *       500:
 *         description: Erreur serveur
 */
