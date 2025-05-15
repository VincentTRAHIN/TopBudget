/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfileUpdateInput:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom de l'utilisateur
 *         email:
 *           type: string
 *           format: email
 *           description: Email de l'utilisateur
 *         partenaireId:
 *           type: string
 *           nullable: true
 *           description: ID du partenaire à lier (ou null pour délier)
 *       example:
 *         nom: "Jean Dupont"
 *         email: "jean.dupont@example.com"
 *         partenaireId: "6077c22e5a02f86fgh4d8c7a"
 */

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Mise à jour du profil utilisateur
 *     description: Met à jour les informations du profil de l'utilisateur connecté, incluant la possibilité de lier ou délier un compte partenaire
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdateInput'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Données invalides ou erreur de validation
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
 *       404:
 *         description: Utilisateur ou partenaire non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Téléchargement d'un avatar utilisateur
 *     description: Permet à l'utilisateur connecté de télécharger une image pour son profil
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 'Fichier image pour l\'avatar (formats acceptés: JPG, PNG)'
 *     responses:
 *       200:
 *         description: Avatar mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Format de fichier invalide ou erreur lors du téléchargement
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
 * /api/profile/me/change-password:
 *   put:
 *     summary: Changer le mot de passe de l'utilisateur
 *     description: Permet à l'utilisateur connecté de changer son mot de passe.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mot de passe actuel
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation du nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mot de passe mis à jour avec succès.
 *       400:
 *         description: Validation échouée (mots de passe ne correspondent pas ou complexité insuffisante)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Mot de passe actuel incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
