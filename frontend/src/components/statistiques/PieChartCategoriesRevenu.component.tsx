'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { useRevenuDistributionByCategorie } from '@/hooks/useRevenuDistributionByCategorie.hook';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartCategoriesRevenuProps {
  year: number;
  month: number;
  contexte?: 'moi' | 'couple';
  customTitle?: string;
}

const PieChartCategoriesRevenu: React.FC<PieChartCategoriesRevenuProps> = ({
  year,
  month,
  contexte = 'moi',
  customTitle,
}) => {
  const { revenuDistribution, isLoading, isError } =
    useRevenuDistributionByCategorie(year, month, contexte);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded shadow-md h-80 flex items-center justify-center">
        Chargement du graphique...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-white p-4 rounded shadow-md h-80 flex items-center justify-center text-red-500">
        Erreur lors du chargement des données.
      </div>
    );
  }
  if (!revenuDistribution || revenuDistribution.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow-md h-80 flex items-center justify-center">
        Aucune donnée disponible.
      </div>
    );
  }

  const data = {
    labels: revenuDistribution.map((cat) => cat.nom || 'Inconnu'),
    datasets: [
      {
        data: revenuDistribution.map((cat) => cat.total),
        backgroundColor: [
          '#36A2EB',
          '#FF6384',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#C9CBCF',
          '#B2DFDB',
          '#F06292',
          '#FFD54F',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {customTitle || 'Répartition des Revenus par Catégorie'}
      </h3>
      <div className="h-80">
        <Pie
          data={data}
          options={{ plugins: { legend: { position: 'bottom' } } }}
        />
      </div>
    </div>
  );
};

export default PieChartCategoriesRevenu;
