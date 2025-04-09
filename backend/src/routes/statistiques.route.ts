import express from 'express';
import { proteger } from '../middlewares/auth.middleware';
import { totalDepensesMensuelles, repartitionParCategorie, comparaisonMois } from '../controllers/statistiques.controller';

const router = express.Router();

router.get('/total-mensuel', proteger, totalDepensesMensuelles);
router.get('/par-categorie', proteger, repartitionParCategorie);
router.get('/comparaison-mois', proteger, comparaisonMois);

export default router;
