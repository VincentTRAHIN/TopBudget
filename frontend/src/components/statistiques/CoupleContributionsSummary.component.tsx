"use client";

import TooltipComponent from "@/components/shared/Tooltip.component";
import { useAuth } from "@/hooks/useAuth.hook";
import { useCoupleContributionsSummary } from "@/hooks/useCoupleContributionsSummary.hook";
import { HelpCircle } from "lucide-react";
import React, { useState } from "react";

interface CoupleContributionsSummaryProps {
  partenaireNom?: string;
}

export default function CoupleContributionsSummary({ partenaireNom }: CoupleContributionsSummaryProps) {
  const today = new Date();
  const [annee, setAnnee] = useState<string>(today.getFullYear().toString());
  const [mois, setMois] = useState<string>((today.getMonth() + 1).toString().padStart(2, "0"));
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const { data, isLoading, isError } = useCoupleContributionsSummary(annee, mois);
  const { user } = useAuth();
  const nomPartenaire =
    partenaireNom ||
    (typeof user?.partenaireId === "object" && user?.partenaireId?.nom ? user.partenaireId.nom : "Partenaire");

  let message = "";
  if (data && data.ecartUtilisateurActuel !== undefined) {
    if (data.ecartUtilisateurActuel < 0) {
      message = `Vous avez payé moins que votre part. Vous devez ${Math.abs(data.ecartUtilisateurActuel).toFixed(2)}€ à ${nomPartenaire}.`;
    } else if (data.ecartUtilisateurActuel > 0) {
      message = `Vous avez payé plus que votre part. ${nomPartenaire} vous doit ${data.ecartUtilisateurActuel.toFixed(2)}€.`;
    } else {
      message = "Les contributions sont équilibrées ce mois-ci.";
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Équilibre des Contributions</h3>
        <TooltipComponent
          isOpen={tooltipOpen}
          onToggle={() => setTooltipOpen((prev) => !prev)}
          onClickOutside={() => setTooltipOpen(false)}
          content={
            <div>
              <p className="font-medium mb-1">Répartition 50/50</p>
              <p>
                Ce bloc calcule l&apos;équilibre des contributions aux dépenses communes du couple. Chacun devrait
                contribuer à hauteur de 50% du total. L&apos;écart affiché indique qui doit rembourser l&apos;autre pour
                équilibrer les comptes.
              </p>
            </div>
          }>
          <HelpCircle size={16} aria-label="Aide sur les contributions" />
        </TooltipComponent>
      </div>
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="mois-select" className="mr-2">
            Mois :
          </label>
          <select id="mois-select" value={mois} onChange={(e) => setMois(e.target.value)} className="input w-24">
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
                {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee-select" className="mr-2">
            Année :
          </label>
          <select id="annee-select" value={annee} onChange={(e) => setAnnee(e.target.value)} className="input w-24">
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && <p>Chargement...</p>}
      {isError && <p className="text-red-500">Erreur lors du chargement des données.</p>}
      {!isLoading && !isError && !data && <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>}
      {data && (
        <div className="space-y-2">
          <p>
            <span className="font-medium">Total des dépenses communes :</span>{" "}
            {data.totalDepensesCommunes !== undefined ? data.totalDepensesCommunes.toFixed(2) : "0.00"}€
          </p>
          <p>
            <span className="font-medium">Ma contribution aux dépenses communes :</span>{" "}
            {data.contributionUtilisateurActuel !== undefined ? data.contributionUtilisateurActuel.toFixed(2) : "0.00"}€
          </p>
          <p>
            <span className="font-medium">Contribution de {nomPartenaire} aux dépenses communes :</span>{" "}
            {data.contributionPartenaire !== undefined ? data.contributionPartenaire.toFixed(2) : "0.00"}€
          </p>
          <p className="mt-2 font-semibold text-blue-700">{message}</p>
        </div>
      )}
    </div>
  );
}
