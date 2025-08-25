/**
 * @swagger
 * components:
 *   schemas:
 *     RevenuInput:
 *       type: object
 *       required:
 *         - montant
 *         - date
 *         - typeCompte
 *         - description
 *         - categorieRevenu
 *       properties:
 *         montant:
 *           type: number
 *           description: "Montant du revenu"
 *         date:
 *           type: string
 *           format: date
 *           description: "Date du revenu"
 *         description:
 *           type: string
 *           description: "Description du revenu (ex: Salaire, CAF, etc.)"
 *         commentaire:
 *           type: string
 *           description: "Commentaire sur le revenu"
 *         typeCompte:
 *           type: string
 *           enum: [Perso, Conjoint]
 *           description: "Type de compte"
 *         categorieRevenu:
 *           type: string
 *           description: "ID de la catégorie de revenu"
 *         estRecurrent:
 *           type: boolean
 *           description: "Indique si le revenu est récurrent (fixe)"
 *     RevenuResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: "ID du revenu"
 *         montant:
 *           type: number
 *           description: "Montant du revenu"
 *         date:
 *           type: string
 *           format: date
 *           description: "Date du revenu"
 *         description:
 *           type: string
 *           description: "Description du revenu (ex: Salaire, CAF, etc.)"
 *         commentaire:
 *           type: string
 *           description: "Commentaire sur le revenu"
 *         typeCompte:
 *           type: string
 *           enum: [Perso, Conjoint]
 *           description: "Type de compte"
 *         categorieRevenu:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             nom:
 *               type: string
 *             description:
 *               type: string
 *             image:
 *               type: string
 *           description: "Catégorie de revenu associée (populée)"
 *         estRecurrent:
 *           type: boolean
 *           description: "Indique si le revenu est récurrent (fixe)"
 *         utilisateur:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: "ID de l'utilisateur"
 *             nom:
 *               type: string
 *               description: "Nom de l'utilisateur"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: "Date de création"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: "Date de mise à jour"
 */

/**
 * @swagger
 * tags:
 *   - name: Revenus
 *     description: "Gestion des revenus"
 */

/**
 * @swagger
 * /api/revenus:
 *   post:
 *     summary: "Créer un nouveau revenu"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevenuInput'
 *     responses:
 *       201:
 *         description: "Revenu créé avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenuResponse'
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non autorisé"
 *
 *   get:
 *     summary: "Récupère tous les revenus (avec pagination et filtres)"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Numéro de la page à récupérer (par défaut 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Nombre d'éléments par page (par défaut 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: "Champ de tri (par défaut date)"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Ordre de tri (ascendant ou descendant)"
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         description: "Date de début de la période"
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         description: "Date de fin de la période"
 *       - in: query
 *         name: typeCompte
 *         schema:
 *           type: string
 *           enum: [Perso, Conjoint]
 *         description: "Filtrer par type de compte"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Recherche sur la source ou le commentaire"
 *       - in: query
 *         name: vue
 *         schema:
 *           type: string
 *           enum: [moi, partenaire, couple_complet]
 *         description: "Vue des revenus (moi, partenaire, couple complet)"
 *     responses:
 *       200:
 *         description: "Liste paginée des revenus"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenus:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RevenuResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: "Non autorisé"
 */

/**
 * @swagger
 * /api/revenus/{id}:
 *   get:
 *     summary: "Récupère un revenu par son ID"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID du revenu"
 *     responses:
 *       200:
 *         description: "Revenu trouvé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenuResponse'
 *       401:
 *         description: "Non autorisé"
 *       404:
 *         description: "Revenu non trouvé"
 *
 *   put:
 *     summary: "Met à jour un revenu existant"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID du revenu"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevenuInput'
 *     responses:
 *       200:
 *         description: "Revenu mis à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenuResponse'
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non autorisé"
 *       404:
 *         description: "Revenu non trouvé"
 *
 *   delete:
 *     summary: "Supprime un revenu"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID du revenu"
 *     responses:
 *       200:
 *         description: "Revenu supprimé avec succès"
 *       401:
 *         description: "Non autorisé"
 *       404:
 *         description: "Revenu non trouvé"
 */

/**
 * @swagger
 * /api/revenus/import:
 *   post:
 *     summary: "Importe des revenus depuis un fichier CSV"
 *     tags: [Revenus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: "Fichier CSV à importer (séparateur ',', en-têtes attendus : Date,Montant,Source,TypeCompte,Commentaire). Date : format dd/MM/yyyy, Montant : nombre (ex: 1234.56), Source : texte (ex: Salaire, CAF...), TypeCompte : Perso ou Conjoint (optionnel, défaut Perso), Commentaire : texte (optionnel)"
 *     responses:
 *       200:
 *         description: "Résultat de l'importation"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalLignesLues:
 *                   type: integer
 *                 importedCount:
 *                   type: integer
 *                 errorCount:
 *                   type: integer
 *                 erreurs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ligne:
 *                         type: integer
 *                       data:
 *                         type: object
 *                       erreur:
 *                         type: string
 *       400:
 *         description: "Fichier manquant, mauvais format de fichier ou données invalides"
 *       401:
 *         description: "Non autorisé"
 *       500:
 *         description: "Erreur serveur"
 */
