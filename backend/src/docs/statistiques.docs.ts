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
 *     summary: Récupère le total des dépenses mensuelles
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
 *     responses:
 *       200:
 *         description: Total des dépenses mensuelles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 depenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DepenseResponse'
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
 *     summary: Compare les dépenses entre deux mois
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: moisPrecedent
 *         schema:
 *           type: string
 *           format: date
 *         description: Mois précédent (format YYYY-MM). Si non fourni, le mois précédent sera calculé automatiquement.
 *       - in: query
 *         name: moisCourant
 *         schema:
 *           type: string
 *           format: date
 *         description: Mois courant (format YYYY-MM). Si non fourni, le mois courant sera calculé automatiquement.
 *       - in: query
 *         name: contexte
 *         schema:
 *           type: string
 *           enum: [moi, couple]
 *         required: false
 *         description: Contexte d'analyse ('moi' = dépenses personnelles, 'couple' = dépenses du couple)
 *     responses:
 *       200:
 *         description: Comparaison des dépenses entre deux mois
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComparaisonMois'
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
 *     summary: Récupère l'évolution mensuelle des dépenses.
 *     description: Permet de visualiser l'évolution des dépenses sur plusieurs mois.
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
 *         required: false
 *         description: Contexte d'analyse ('moi' = dépenses personnelles, 'couple' = dépenses communes du couple)
 *     responses:
 *       200:
 *         description: Évolution mensuelle des dépenses récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvolutionMensuelleResponse'
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
