import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  getTotalFluxMensuel,
  getRepartitionParCategorie,
  getEvolutionFluxMensuels,
  getSoldePourPeriode,
  getComparaisonMois,
  getContributionsCouple,
  getChargesFixesCouple,
  getSyntheseMensuelleCouple,
  totalDepensesMensuelles,
  getEvolutionDepensesMensuelles,
  getCoupleContributionsSummary,
  getCoupleFixedCharges,
  getSyntheseMensuelle,
  getSoldeMensuel,
  getEvolutionRevenusMensuels,
  getEvolutionSoldesMensuels,
  repartitionParCategorie,
  repartitionRevenusParCategorie as ctrlRepartitionRevenusParCategorie,
} from "../controllers/statistiques.controller";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import {
  validateDateRange,
  validateType,
  validateEvolutionFlux,
  validateComparaisonMois,
} from "../middlewares/validators/statistiques.validator";
import { asyncHandler } from "../utils/async.utils";
import { AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

const validateReq = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

router.get(
  "/flux-mensuel",
  proteger,
  [...validateDateRange, ...validateType],
  validateReq,
  getTotalFluxMensuel,
);

router.get(
  "/repartition-categorie",
  proteger,
  [...validateDateRange, ...validateType],
  validateReq,
  getRepartitionParCategorie,
);

router.get(
  "/evolution-flux",
  proteger,
  validateEvolutionFlux,
  validateReq,
  getEvolutionFluxMensuels,
);

router.get(
  "/solde-periode",
  proteger,
  validateDateRange,
  validateReq,
  getSoldePourPeriode,
);

router.get(
  "/comparaison-mois",
  proteger,
  validateComparaisonMois,
  validateReq,
  getComparaisonMois,
);

router.get(
  "/contributions-couple",
  proteger,
  validateDateRange,
  validateReq,
  getContributionsCouple,
);

router.get(
  "/charges-fixes-couple",
  proteger,
  validateDateRange,
  validateReq,
  getChargesFixesCouple,
);

router.get(
  "/synthese-mensuelle-couple",
  proteger,
  validateDateRange,
  validateReq,
  getSyntheseMensuelleCouple,
);

router.get("/total-mensuel", proteger, asyncHandler(totalDepensesMensuelles));
router.get("/par-categorie", proteger, asyncHandler(repartitionParCategorie));
router.get(
  "/revenus-par-categorie",
  proteger,
  (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    console.log(`[ROUTE LOG] Requête reçue pour /revenus-par-categorie. Utilisateur authentifié: ${!!authReq.user}, ID: ${authReq.user?.id}`);
    next();
  },
  asyncHandler(ctrlRepartitionRevenusParCategorie),
);
router.get("/solde-mensuel", proteger, asyncHandler(getSoldeMensuel));
router.get(
  "/evolution-mensuelle",
  proteger,
  asyncHandler(getEvolutionDepensesMensuelles),
);
router.get(
  "/evolution-revenus-mensuels",
  proteger,
  asyncHandler(getEvolutionRevenusMensuels),
);
router.get(
  "/evolution-soldes-mensuels",
  proteger,
  asyncHandler(getEvolutionSoldesMensuels),
);
router.get(
  "/couple/resume-contributions",
  proteger,
  asyncHandler(getCoupleContributionsSummary),
);
router.get(
  "/couple/charges-fixes",
  proteger,
  asyncHandler(getCoupleFixedCharges),
);
router.get("/synthese-mensuelle", proteger, asyncHandler(getSyntheseMensuelle));

export default router;
