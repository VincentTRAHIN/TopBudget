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

  const chartTitle = customTitle;

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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{chartTitle}</h3>

      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select">Année:</label>
            <select
              id="year-select"
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
            <label htmlFor="month-select">Mois:</label>
            <select
              id="month-select"
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

      {isLoading && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <p className="text-center py-4">Chargement des données...</p>
        </div>
      )}
      {isError && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <p className="text-center py-4 text-red-500">
            Erreur lors du chargement des données.
          </p>
        </div>
      )}
      {!isLoading &&
        !isError &&
        categoryDistribution &&
        categoryDistribution.length === 0 && (
          <div className="h-80 md:h-96 flex items-center justify-center">
            <p className="text-center py-4">Aucune dépense pour cette période.</p>
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
