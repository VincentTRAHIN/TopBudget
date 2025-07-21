/**
 * @swagger
 * components:
 *   schemas:
 *     CategorieInput:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         nom:
 *           type: string
 *           description: "Nom de la catégorie"
 *         description:
 *           type: string
 *           description: "Description de la catégorie"
 *         image:
 *           type: string
 *           description: "URL de l'image de la catégorie"
 *     CategorieResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: "ID de la catégorie"
 *         nom:
 *           type: string
 *           description: "Nom de la catégorie"
 *         description:
 *           type: string
 *           description: "Description de la catégorie"
 *         image:
 *           type: string
 *           description: "URL de l'image de la catégorie"
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
 * /api/categories:
 *   get:
 *     summary: "Récupère toutes les catégories"
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depense, revenu]
 *         description: "Filtrer par type de catégorie"
 *     responses:
 *       200:
 *         description: "Liste des catégories"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorieResponse"
 *       401:
 *         description: "Non autorisé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: "Crée une nouvelle catégorie"
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieInput"
 *     responses:
 *       201:
 *         description: "Catégorie créée avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorieResponse"
 *       400:
 *         description: "Données invalides"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 *       401:
 *         description: "Non autorisé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: "Récupère une catégorie par son ID"
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de la catégorie"
 *     responses:
 *       200:
 *         description: "Détails de la catégorie"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorieResponse"
 *       404:
 *         description: "Catégorie non trouvée"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 *       401:
 *         description: "Non autorisé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: "Met à jour une catégorie"
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de la catégorie"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieInput"
 *     responses:
 *       200:
 *         description: "Catégorie mise à jour avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorieResponse"
 *       400:
 *         description: "Données invalides"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 *       404:
 *         description: "Catégorie non trouvée"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 *       401:
 *         description: "Non autorisé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: "Supprime une catégorie"
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de la catégorie"
 *     responses:
 *       204:
 *         description: "Catégorie supprimée avec succès"
 *       404:
 *         description: "Catégorie non trouvée"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 *       401:
 *         description: "Non autorisé"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error"
 */
