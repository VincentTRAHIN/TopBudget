/**
 * @swagger
 * components:
 *   schemas:
 *     DepenseInput:
 *       type: object
 *       required:
 *         - montant
 *         - date
 *         - typeCompte
 *         - categorie
 *       properties:
 *         montant:
 *           type: number
 *           description: Montant de la dépense
 *         date:
 *           type: string
 *           format: date
 *           description: Date de la dépense
 *         commentaire:
 *           type: string
 *           description: Commentaire sur la dépense
 *         typeCompte:
 *           type: string
 *           enum: [Perso, Conjoint, Commun]
 *           description: Type de compte
 *         recurrence:
 *           type: boolean
 *           description: Si la dépense est récurrente
 *         categorie:
 *           type: string
 *           description: ID de la catégorie
 *     DepenseResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de la dépense
 *         montant:
 *           type: number
 *           description: Montant de la dépense
 *         date:
 *           type: string
 *           format: date
 *           description: Date de la dépense
 *         commentaire:
 *           type: string
 *           description: Commentaire sur la dépense
 *         typeCompte:
 *           type: string
 *           enum: [Perso, Conjoint, Commun]
 *           description: Type de compte
 *         recurrence:
 *           type: boolean
 *           description: Si la dépense est récurrente
 *         categorie:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID de la catégorie
 *             nom:
 *               type: string
 *               description: Nom de la catégorie
 *         utilisateur:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID de l'utilisateur
 *             nom:
 *               type: string
 *               description: Nom de l'utilisateur
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de mise à jour
 */

/**
 * @swagger
 * /api/depenses:
 *   get:
 *     summary: Récupère toutes les dépenses
 *     tags: [Dépenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de la page à récupérer (par défaut 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre de résultats par page (par défaut 10)
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour le filtre
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour le filtre
 *       - in: query
 *         name: typeCompte
 *         schema:
 *           type: string
 *           enum: [Perso, Conjoint, Commun]
 *         description: Filtrer par type de compte
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Champ par lequel trier (ex. montant, date)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre de tri (ascendant ou descendant)
 *     responses:
 *       200:
 *         description: Liste des dépenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 depenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DepenseResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/depenses:
 *   post:
 *     summary: Crée une nouvelle dépense
 *     tags: [Dépenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepenseInput'
 *     responses:
 *       201:
 *         description: Dépense créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepenseResponse'
 *       400:
 *         description: Données invalides
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
 * /api/depenses/{id}:
 *   get:
 *     summary: Récupère une dépense par son ID
 *     tags: [Dépenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     responses:
 *       200:
 *         description: Détails de la dépense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepenseResponse'
 *       404:
 *         description: Dépense non trouvée
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
 * /api/depenses/{id}:
 *   put:
 *     summary: Met à jour une dépense
 *     tags: [Dépenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepenseInput'
 *     responses:
 *       200:
 *         description: Dépense mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepenseResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dépense non trouvée
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
 * /api/depenses/{id}:
 *   delete:
 *     summary: Supprime une dépense
 *     tags: [Dépenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dépense
 *     responses:
 *       204:
 *         description: Dépense supprimée avec succès
 *       404:
 *         description: Dépense non trouvée
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