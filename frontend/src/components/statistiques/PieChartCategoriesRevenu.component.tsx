'use client';

import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { useRevenuDistributionByCategorie } from '@/hooks/useRevenuDistributionByCategorie.hook';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface PieChartCategoriesRevenuProps {
  year: number;
  month: number;
  contexte: 'perso' | 'couple' | 'foyer';
  customTitle?: string;
}

export const PieChartCategoriesRevenu: React.FC<
  PieChartCategoriesRevenuProps
> = ({ year, month, contexte, customTitle }) => {
  const [selectedYear, setSelectedYear] = useState<number>(year);
  const [selectedMonth, setSelectedMonth] = useState<number>(month);

  let hookContexte: 'moi' | 'couple' | undefined = undefined;
  if (contexte === 'perso') {
    hookContexte = 'moi';
  } else if (contexte === 'couple') {
    hookContexte = 'couple';
  }

  const { revenuDistribution, isLoading, isError, error } =
    useRevenuDistributionByCategorie(selectedYear, selectedMonth, hookContexte);

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  const currentMonthName = monthNames[selectedMonth - 1] || '';
  const contexteText =
    contexte === 'couple'
      ? 'du Couple '
      : contexte === 'perso'
        ? 'Personnel '
        : '';

  let baseTitlePart = 'Répartition des Revenus';
  if (
    customTitle &&
    !customTitle.includes(String(year)) &&
    !customTitle.includes(monthNames[month - 1])
  ) {
    baseTitlePart = customTitle.replace(/ - [A-Za-z]+ [0-9]{4}$/, '');
  } else if (customTitle) {
    baseTitlePart = customTitle.split(' - ')[0] || baseTitlePart;
  }

  const displayTitle = `${baseTitlePart} ${contexteText}par Catégorie - ${currentMonthName} ${selectedYear}`;

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-80 md:h-96 flex items-center justify-center">
          Chargement du graphique...
        </div>
      );
    }

    if (isError || !revenuDistribution) {
      return (
        <div className="h-80 md:h-96 flex items-center justify-center text-red-500">
          {error?.message ||
            'Erreur lors du chargement des données de répartition des revenus.'}
        </div>
      );
    }

    if (revenuDistribution.length === 0) {
      return (
        <div className="h-80 md:h-96 flex items-center justify-center">
          Aucune donnée de revenu disponible pour cette période.
        </div>
      );
    }

    const data = {
      labels: revenuDistribution.map((cat) => cat.nom || 'Inconnu'),
      datasets: [
        {
          data: revenuDistribution.map((cat) => cat.total),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 159, 64, 0.6)',
            'rgba(210, 105, 30, 0.6)',
            'rgba(128, 0, 128, 0.6)',
            'rgba(0, 128, 128, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="h-80 md:h-96 flex justify-center">
        <Pie
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                align: 'center',
              },
            },
          }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{displayTitle}</h3>

      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select-revenu">Année:</label>
            <select
              id="year-select-revenu"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input w-28 text-sm"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="month-select-revenu">Mois:</label>
            <select
              id="month-select-revenu"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input w-28 text-sm"
            >
              <option value={1}>Janvier</option>
              <option value={2}>Février</option>
              <option value={3}>Mars</option>
              <option value={4}>Avril</option>
              <option value={5}>Mai</option>
              <option value={6}>Juin</option>
              <option value={7}>Juillet</option>
              <option value={8}>Août</option>
              <option value={9}>Septembre</option>
              <option value={10}>Octobre</option>
              <option value={11}>Novembre</option>
              <option value={12}>Décembre</option>
            </select>
          </div>
        </div>
      </div>

      {renderChart()}
    </div>
  );
};
