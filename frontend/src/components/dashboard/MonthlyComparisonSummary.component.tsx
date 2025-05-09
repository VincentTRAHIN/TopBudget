"use client";

import React from 'react';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison.hook';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const MonthlyComparisonSummary: React.FC = () => {
  const { data, isLoading, isError } = useMonthlyComparison();

  if (isLoading) {
    return <div className="bg-white p-4 rounded shadow-md">Chargement...</div>;
  }

  if (isError) {
    return <div className="bg-white p-4 rounded shadow-md text-red-500">Erreur lors du chargement des données.</div>;
  }

  if (!data) {
    return <div className="bg-white p-4 rounded shadow-md">Aucune donnée disponible.</div>;
  }

  const { totalMoisActuel, totalMoisPrecedent, difference, pourcentageVariation } = data;

  let IconComponent = Minus;
  let colorClass = "text-gray-600";

  if (difference > 0) {
    IconComponent = ArrowUpRight;
    colorClass = "text-green-600";
  } else if (difference < 0) {
    IconComponent = ArrowDownRight;
    colorClass = "text-red-600";
  }

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Comparaison Mensuelle</h3>
      <div>
        <p>Ce mois-ci: <span className="font-bold">{totalMoisActuel.toFixed(2)}€</span></p>
        <p>Mois Précédent: <span className="font-bold">{totalMoisPrecedent.toFixed(2)}€</span></p>
      </div>
      <div className="mt-2 flex items-center">
        <IconComponent className={`mr-1 text-lg ${colorClass}`} />
        <span className={`${colorClass} font-semibold`}>
          {difference.toFixed(2)}€ ({pourcentageVariation.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};

export default MonthlyComparisonSummary;