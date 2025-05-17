import { body } from 'express-validator';
import { DEPENSE } from '../../constants/depense.constants';

export const creerDepenseValidator = [
  body('montant').isNumeric().withMessage('Le montant doit être un nombre'),
  body('categorie').isMongoId().withMessage('L\'ID de catégorie est invalide'), 
  body('typeCompte')
    .isIn(Object.values(DEPENSE.TYPES_COMPTE))
    .withMessage(DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE),
  body('typeDepense')
    .isIn(Object.values(DEPENSE.TYPES_DEPENSE))
    .withMessage(DEPENSE.ERROR_MESSAGES.INVALID_TYPE_DEPENSE),
  body('date').isISO8601().toDate().withMessage('La date est invalide (format ISO8601 attendu)'),
  body('description').optional().isString().isLength({ max: DEPENSE.VALIDATION.MAX_DESCRIPTION_LENGTH }).withMessage(`La description ne doit pas dépasser ${DEPENSE.VALIDATION.MAX_DESCRIPTION_LENGTH} caractères.`),
  body('commentaire').optional().isString().isLength({ max: DEPENSE.VALIDATION.MAX_COMMENTAIRE_LENGTH }).withMessage(`Le commentaire ne doit pas dépasser ${DEPENSE.VALIDATION.MAX_COMMENTAIRE_LENGTH} caractères.`),
  body('estChargeFixe').optional().isBoolean().withMessage('Le champ estChargeFixe doit être un booléen.'),
];