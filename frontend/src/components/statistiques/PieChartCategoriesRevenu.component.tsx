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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Chargement du graphique...</p>
          </div>
        </div>
      );
    }

    if (isError || !revenuDistribution) {
      return (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-500 font-medium">
              {error?.message ||
                'Erreur lors du chargement des données de répartition des revenus.'}
            </p>
          </div>
        </div>
      );
    }

    if (revenuDistribution.length === 0) {
      return (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500">Aucune donnée de revenu disponible pour cette période.</p>
          </div>
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{displayTitle}</h3>

      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select-revenu" className="text-sm font-medium text-gray-700">Année:</label>
            <select
              id="year-select-revenu"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-auto min-w-[80px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1 px-2"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="month-select-revenu" className="text-sm font-medium text-gray-700">Mois:</label>
            <select
              id="month-select-revenu"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="block w-auto min-w-[100px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1 px-2"
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
