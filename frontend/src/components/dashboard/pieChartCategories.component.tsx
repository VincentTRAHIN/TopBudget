'use client';

import { useState } from 'react';
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

export default function PieChartCategories({
  statsContext = 'moi',
  customTitle,
}: {
  statsContext?: 'moi' | 'couple';
  customTitle?: string;
}) {
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

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const currentMonthName = monthNames[selectedMonth - 1] || "";
  const contexteText = statsContext === 'couple' ? "du Couple " : (statsContext === 'moi' ? "Personnelles " : "");

  let baseTitlePart = "Répartition des Dépenses";
  if (customTitle && !customTitle.includes(String(new Date().getFullYear())) && !customTitle.includes(monthNames[new Date().getMonth()])) {
    baseTitlePart = customTitle.replace(/ - [A-Za-z]+ [0-9]{4}$/, ''); 
  } else if (customTitle) {
    baseTitlePart = customTitle.split(' - ')[0] || baseTitlePart;
  }

  const displayTitle = `${baseTitlePart} ${contexteText}par Catégorie - ${currentMonthName} ${selectedYear}`;

  let labels: string[] = [];
  let dataValues: number[] = [];
  let chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
    options?: ChartOptions<'pie'>;
  } = {
    labels: [],
    datasets: [
      {
        label: 'Dépenses par Catégorie',
        data: [],
        backgroundColor: BACKGROUND_COLORS,
        borderColor: BACKGROUND_COLORS.map((color) =>
          color.replace('0.6', '1'),
        ),
        borderWidth: 1,
      },
    ],
  };

  if (
    !isLoading &&
    !isError &&
    categoryDistribution &&
    categoryDistribution.length > 0
  ) {
    labels = categoryDistribution.map((item) => item.nom);
    dataValues = categoryDistribution.map((item) => item.total);

    chartData = {
      labels,
      datasets: [
        {
          label: 'Dépenses par Catégorie',
          data: dataValues,
          backgroundColor: BACKGROUND_COLORS,
          borderColor: BACKGROUND_COLORS.map((color) =>
            color.replace('0.6', '1'),
          ),
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
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
    };

    chartData.options = chartOptions;
  } else if (
    !isLoading &&
    !isError &&
    (!categoryDistribution || categoryDistribution.length === 0)
  ) {
  } else {
    const dataParCategorie: { [key: string]: number } = {};

    depenses.forEach((depense) => {
      const catId =
        typeof depense.categorie === 'string'
          ? depense.categorie
          : depense.categorie._id;
      dataParCategorie[catId] =
        (dataParCategorie[catId] || 0) + depense.montant;
    });

    labels = categories.map((cat) => cat.nom);
    dataValues = categories.map((cat) => dataParCategorie[cat._id] || 0);

    chartData = {
      labels,
      datasets: [
        {
          label: 'Dépenses par Catégorie',
          data: dataValues,
          backgroundColor: BACKGROUND_COLORS,
          borderColor: BACKGROUND_COLORS.map((color) =>
            color.replace('0.6', '1'),
          ),
          borderWidth: 1,
        },
      ],
    };
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{displayTitle}</h3>

      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">Année:</label>
            <select
              id="year-select"
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
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Mois:</label>
            <select
              id="month-select"
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

      {isLoading && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        </div>
      )}
      {isError && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-500 font-medium">
              Erreur lors du chargement des données.
            </p>
          </div>
        </div>
      )}
      {!isLoading &&
        !isError &&
        categoryDistribution &&
        categoryDistribution.length === 0 && (
          <div className="h-80 md:h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">Aucune dépense pour cette période.</p>
            </div>
          </div>
        )}

      <div className="h-80 md:h-96 flex justify-center">
        {!isLoading && !isError && (
          <Pie data={chartData} options={chartData.options} />
        )}
      </div>
    </div>
  );
}
