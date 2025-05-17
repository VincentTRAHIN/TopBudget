import express, { NextFunction, Request, Response } from 'express'; // Importer Request, Response, NextFunction
import { proteger } from '../middlewares/auth.middleware';
import { totalDepensesMensuelles, repartitionParCategorie, comparaisonMois, getEvolutionDepensesMensuelles, getCoupleContributionsSummary, getCoupleFixedCharges } from '../controllers/statistiques.controller';

const router = express.Router();

router.get('/total-mensuel', proteger, totalDepensesMensuelles);
router.get('/par-categorie', proteger, repartitionParCategorie);
router.get('/comparaison-mois', proteger, comparaisonMois);
router.get(
    '/evolution-mensuelle',
    (_: Request, res: Response, next: NextFunction) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        res.setHeader('Pragma', 'no-cache'); 
        res.setHeader('Expires', '0'); 
        next(); 
    },
    proteger,
    getEvolutionDepensesMensuelles
);
router.get('/couple/resume-contributions', proteger, getCoupleContributionsSummary);
router.get('/couple/charges-fixes', proteger, getCoupleFixedCharges);

export default router;
