import useSWR from "swr";

import { upcomingChargesEndpoint } from "../services/api.service";
import fetcher from "../utils/fetcher.utils";

/**
 * Interface pour une charge fixe payée
 */
export interface PaidCharge {
  _id: string;
  montant: number;
  date: string;
  description?: string;
  categorie: {
    _id: string;
    nom: string;
  };
  typeCompte: string;
  typeDepense: string;
  estChargeFixe: boolean;
}

/**
 * Interface pour une charge fixe à venir (non encore payée)
 */
export interface UpcomingCharge {
  description: string;
  montant: number;
  categorie: {
    _id: string;
    nom: string;
  };
  expectedDate: string;
}

/**
 * Interface pour la réponse de l'endpoint upcoming-charges
 */
export interface UpcomingChargesData {
  paid: PaidCharge[];
  upcoming: UpcomingCharge[];
  totalPaid: number;
  totalUpcoming: number;
}

/**
 * Interface pour le retour du hook
 */
export interface UseUpcomingChargesReturn {
  paid: PaidCharge[];
  upcoming: UpcomingCharge[];
  totalPaid: number;
  totalUpcoming: number;
  totalCharges: number;
  remainingToPay: number;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

/**
 * Hook personnalisé pour récupérer les charges fixes à venir
 *
 * Récupère les charges fixes payées et à venir pour le mois en cours
 * (ou pour un mois spécifié).
 *
 * @param mois - Numéro du mois (1-12), optionnel (défaut = mois actuel)
 * @param annee - Année, optionnel (défaut = année actuelle)
 * @returns Données des charges fixes avec états de chargement et d'erreur
 *
 * @example
 * ```tsx
 * const { paid, upcoming, totalPaid, totalUpcoming, isLoading } = useUpcomingCharges();
 *
 * if (isLoading) return <div>Chargement...</div>;
 *
 * return (
 *   <div>
 *     <h3>Payé : {totalPaid}€</h3>
 *     <h3>À venir : {totalUpcoming}€</h3>
 *     <ul>
 *       {upcoming.map(charge => (
 *         <li key={charge.description}>{charge.description} - {charge.montant}€</li>
 *       ))}
 *     </ul>
 *   </div>
 * );
 * ```
 */
export function useUpcomingCharges(mois?: number, annee?: number): UseUpcomingChargesReturn {
  // Construction de l'URL avec paramètres optionnels
  let url = upcomingChargesEndpoint;
  const params = new URLSearchParams();

  if (mois !== undefined) {
    params.append("mois", mois.toString());
  }

  if (annee !== undefined) {
    params.append("annee", annee.toString());
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  // Appel SWR avec fetcher
  const { data, error, isLoading, mutate } = useSWR<UpcomingChargesData>(url, fetcher, {
    refreshInterval: 0, // Pas de refresh automatique
    revalidateOnFocus: true, // Revalider quand la fenêtre reprend le focus
  });

  // Calculs dérivés
  const totalCharges = (data?.totalPaid || 0) + (data?.totalUpcoming || 0);
  const remainingToPay = data?.totalUpcoming || 0;

  return {
    paid: data?.paid || [],
    upcoming: data?.upcoming || [],
    totalPaid: data?.totalPaid || 0,
    totalUpcoming: data?.totalUpcoming || 0,
    totalCharges,
    remainingToPay,
    isLoading,
    isError: !!error,
    mutate,
  };
}
