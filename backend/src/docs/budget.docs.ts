/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       required:
 *         - name
 *         - amount
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           description: Nom du budget
 *         amount:
 *           type: number
 *           description: Montant du budget
 *         category:
 *           type: string
 *           description: Catégorie du budget
 *         description:
 *           type: string
 *           description: Description du budget
 *         startDate:
 *           type: string
 *           format: date
 *           description: Date de début du budget
 *         endDate:
 *           type: string
 *           format: date
 *           description: Date de fin du budget
 *     BudgetResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID du budget
 *         name:
 *           type: string
 *           description: Nom du budget
 *         amount:
 *           type: number
 *           description: Montant du budget
 *         category:
 *           type: string
 *           description: Catégorie du budget
 *         description:
 *           type: string
 *           description: Description du budget
 *         startDate:
 *           type: string
 *           format: date
 *           description: Date de début du budget
 *         endDate:
 *           type: string
 *           format: date
 *           description: Date de fin du budget
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
 * /api/budgets:
 *   get:
 *     summary: Récupère tous les budgets
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BudgetResponse'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Crée un nouveau budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       201:
 *         description: Budget créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetResponse'
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
 * /api/budgets/{id}:
 *   get:
 *     summary: Récupère un budget par son ID
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du budget
 *     responses:
 *       200:
 *         description: Détails du budget
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetResponse'
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
 * /api/budgets/{id}:
 *   put:
 *     summary: Met à jour un budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du budget
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       200:
 *         description: Budget mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /api/budgets/{id}:
 *   delete:
 *     summary: Supprime un budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du budget
 *     responses:
 *       204:
 *         description: Budget supprimé avec succès
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