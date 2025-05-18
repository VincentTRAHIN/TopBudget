/**
 * @swagger
 * tags:
 *   - name: Catégories Revenu
 *     description: Gestion des catégories de revenus
 *
 * components:
 *   schemas:
 *     CategorieRevenuInput:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom de la catégorie de revenu
 *         description:
 *           type: string
 *           description: Description optionnelle
 *         image:
 *           type: string
 *           description: URL d'icône ou d'image
 *     CategorieRevenuResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la catégorie
 *         nom:
 *           type: string
 *           description: Nom de la catégorie
 *         description:
 *           type: string
 *           description: Description optionnelle
 *         image:
 *           type: string
 *           description: URL d'icône ou d'image
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
 * /api/categories-revenu:
 *   post:
 *     summary: Créer une nouvelle catégorie de revenu
 *     tags: [Catégories Revenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieRevenuInput'
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorieRevenuResponse'
 *       400:
 *         description: Données invalides ou catégorie déjà existante
 *       401:
 *         description: Non autorisé
 *
 *   get:
 *     summary: Liste toutes les catégories de revenus
 *     tags: [Catégories Revenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des catégories de revenus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorieRevenuResponse'
 *       401:
 *         description: Non autorisé
 *
 * /api/categories-revenu/{id}:
 *   put:
 *     summary: Modifier une catégorie de revenu
 *     tags: [Catégories Revenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorieRevenuInput'
 *     responses:
 *       200:
 *         description: Catégorie modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategorieRevenuResponse'
 *       400:
 *         description: Données invalides ou nom déjà utilisé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Catégorie non trouvée
 *
 *   delete:
 *     summary: Supprimer une catégorie de revenu
 *     tags: [Catégories Revenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       400:
 *         description: Catégorie utilisée par des revenus, impossible de supprimer
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Catégorie non trouvée
 */
