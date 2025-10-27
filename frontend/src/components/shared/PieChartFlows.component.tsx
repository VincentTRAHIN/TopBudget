'use client';

import React, { useState, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { useCategoryDistribution } from '@/hooks/useCategoryDistribution.hook';
import { useRevenuDistributionByCategorie } from '@/hooks/useRevenuDistributionByCategorie.hook';
import { DataType } from '@/components/table/table.types';

ChartJS.register(ArcElement, Tooltip, Legend);

const BACKGROUND_COLORS = [
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
];

interface PieChartFlowsProps {
  type: 'depenses' | 'revenus';
  statsContext?: 'moi' | 'couple';
  customTitle?: string;
  mode?: 'month' | 'year'; // Mode par défaut : mois ou année
  showModeToggle?: boolean; // Afficher le toggle mois/année
}

/**
 * Composant générique pour afficher la répartition des dépenses ou revenus par catégorie
 * 
 * @param type - Type de flux ('depenses' ou 'revenus')
 * @param statsContext - Contexte ('moi' ou 'couple')
 * @param customTitle - Titre personnalisé (optionnel)
 * @param mode - Mode d'affichage par défaut ('month' ou 'year')
 * @param showModeToggle - Afficher le toggle pour changer de mode
 */
export default function PieChartFlows({
  type,
  statsContext = 'moi',
  customTitle,
  mode = 'month',
  showModeToggle = false,
}: PieChartFlowsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [viewMode, setViewMode] = useState<'month' | 'year'>(mode);

  // Hooks conditionnels selon le type
  const hookContexte = statsContext === 'moi' ? 'moi' : statsContext === 'couple' ? 'couple' : undefined;

  const { categoryDistribution: depensesDistribution, isLoading: depensesLoading, isError: depensesError } = 
    useCategoryDistribution(selectedYear, selectedMonth, type === 'depenses' ? statsContext : undefined);
  
  const { revenuDistribution, isLoading: revenusLoading, isError: revenusError, error: revenusErrorMsg } = 
    useRevenuDistributionByCategorie(selectedYear, selectedMonth, type === 'revenus' ? hookContexte : undefined);

  const isLoading = type === 'depenses' ? depensesLoading : revenusLoading;
  const isError = type === 'depenses' ? depensesError : revenusError;
  const distribution = type === 'depenses' ? depensesDistribution : revenuDistribution;

  const monthNames = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  const currentMonthName = useMemo(() => {
    return monthNames[selectedMonth - 1] || '';
  }, [monthNames, selectedMonth]);

  const contexteText = useMemo(() => {
    return statsContext === 'couple' ? 'du Couple ' : statsContext === 'moi' ? 'Personnelles ' : '';
  }, [statsContext]);

  const displayTitle = useMemo(() => {
    let baseTitlePart = type === 'depenses' ? 'Répartition des Dépenses' : 'Répartition des Revenus';
    
    if (customTitle && !customTitle.includes(String(new Date().getFullYear())) && !customTitle.includes(monthNames[new Date().getMonth()])) {
      baseTitlePart = customTitle.replace(/ - [A-Za-z]+ [0-9]{4}$/, '');
    } else if (customTitle) {
      baseTitlePart = customTitle.split(' - ')[0] || baseTitlePart;
    }

    if (viewMode === 'year') {
      return `${baseTitlePart} ${contexteText}par Catégorie - ${selectedYear} (Cumul annuel)`;
    }

    return `${baseTitlePart} ${contexteText}par Catégorie - ${currentMonthName} ${selectedYear}`;
  }, [customTitle, contexteText, currentMonthName, selectedYear, monthNames, type, viewMode]);

  const borderColors = useMemo(() => {
    return BACKGROUND_COLORS.map((color) => color.replace('0.6', '1'));
  }, []);

  const chartOptions = useMemo<ChartOptions<'pie'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            dataset: { label?: string; data: number[] };
            parsed: number;
            label?: string;
          }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null && context.dataset.data.length > 0) {
              const value = context.parsed;
              const sum = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0,
              );
              const percentage =
                sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
              label +=
                context.label +
                ': ' +
                value.toFixed(2) +
                '€ (' +
                percentage +
                ')';
            }
            return label;
          },
        },
      },
    },
  }), []);

  const chartData = useMemo(() => {
    if (!distribution || distribution.length === 0) {
      return null;
    }

    const labels = distribution.map((item) => item.nom || 'Inconnu');
    const dataValues = distribution.map((item) => item.total);

    return {
      labels,
      datasets: [
        {
          label: type === 'depenses' ? 'Dépenses par Catégorie' : 'Revenus par Catégorie',
          data: dataValues,
          backgroundColor: BACKGROUND_COLORS,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [distribution, borderColors, type]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{displayTitle}</h3>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        {showModeToggle && (
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Annuel
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor={`year-select-${type}`} className="text-sm font-medium text-gray-700">
            Année:
          </label>
          <select
            id={`year-select-${type}`}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {viewMode === 'month' && (
          <div className="flex items-center gap-2">
            <label htmlFor={`month-select-${type}`} className="text-sm font-medium text-gray-700">
              Mois:
            </label>
            <select
              id={`month-select-${type}`}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative" style={{ height: '400px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Chargement du graphique...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 font-medium">
                {type === 'revenus' && revenusErrorMsg?.message
                  ? revenusErrorMsg.message
                  : 'Erreur lors du chargement des données'}
              </p>
            </div>
          </div>
        ) : !chartData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                Aucune donnée de {type === 'depenses' ? 'dépense' : 'revenu'} disponible pour cette période.
              </p>
            </div>
          </div>
        ) : (
          <Pie data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
