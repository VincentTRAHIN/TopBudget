'use client';

import { useState, useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories.hook';
import { useDepenses } from '@/hooks/useDepenses.hook';
import { useCategoryDistribution } from '@/hooks/useCategoryDistribution.hook';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import React from 'react';

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

interface PieChartCategoriesProps {
  statsContext?: 'moi' | 'couple';
  customTitle?: string;
}

function PieChartCategories({
  statsContext = 'moi',
  customTitle,
}: PieChartCategoriesProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  const { categories } = useCategories();
  const { depenses } = useDepenses();
  const { categoryDistribution, isLoading, isError } = useCategoryDistribution(
    selectedYear,
    selectedMonth,
    statsContext,
  );

  const monthNames = useMemo(() => [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ], []);

  const currentMonthName = useMemo(() => {
    return monthNames[selectedMonth - 1] || "";
  }, [monthNames, selectedMonth]);

  const contexteText = useMemo(() => {
    return statsContext === 'couple' ? "du Couple " : (statsContext === 'moi' ? "Personnelles " : "");
  }, [statsContext]);

  const displayTitle = useMemo(() => {
    let baseTitlePart = "Répartition des Dépenses";
    if (customTitle && !customTitle.includes(String(new Date().getFullYear())) && !customTitle.includes(monthNames[new Date().getMonth()])) {
      baseTitlePart = customTitle.replace(/ - [A-Za-z]+ [0-9]{4}$/, ''); 
    } else if (customTitle) {
      baseTitlePart = customTitle.split(' - ')[0] || baseTitlePart;
    }

    return `${baseTitlePart} ${contexteText}par Catégorie - ${currentMonthName} ${selectedYear}`;
  }, [customTitle, contexteText, currentMonthName, selectedYear, monthNames]);

  const borderColors = useMemo(() => {
    return BACKGROUND_COLORS.map((color) => color.replace('0.6', '1'));
  }, []);

  const chartOptions = useMemo<ChartOptions<'pie'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right' as const,
        align: 'center' as const
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

  const apiChartData = useMemo(() => {
    if (!categoryDistribution || categoryDistribution.length === 0) {
      return null;
    }

    const labels = categoryDistribution.map((item) => item.nom);
    const dataValues = categoryDistribution.map((item) => item.total);

    return {
      labels,
      datasets: [
        {
          label: 'Dépenses par Catégorie',
          data: dataValues,
          backgroundColor: BACKGROUND_COLORS,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [categoryDistribution, borderColors]);

  const fallbackChartData = useMemo(() => {
    const dataParCategorie: { [key: string]: number } = {};

    depenses.forEach((depense) => {
      const catId =
        typeof depense.categorie === 'string'
          ? depense.categorie
          : depense.categorie._id;
      dataParCategorie[catId] =
        (dataParCategorie[catId] || 0) + depense.montant;
    });

    const labels = categories.map((cat) => cat.nom);
    const dataValues = categories.map((cat) => dataParCategorie[cat._id] || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Dépenses par Catégorie',
          data: dataValues,
          backgroundColor: BACKGROUND_COLORS,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [depenses, categories, borderColors]);

  const chartData = useMemo(() => {
    if (!isLoading && !isError && apiChartData) {
      return apiChartData;
    }
    return fallbackChartData;
  }, [isLoading, isError, apiChartData, fallbackChartData]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {displayTitle}
        </h3>
        
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Année:
            </label>
            <select
              id="year-select"
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
          
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
              Mois:
            </label>
            <select
              id="month-select"
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
        </div>
      </div>

      <div className="relative" style={{ height: '400px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <p>Erreur lors du chargement des données</p>
          </div>
        ) : (
          <Pie data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

export default React.memo(PieChartCategories);
