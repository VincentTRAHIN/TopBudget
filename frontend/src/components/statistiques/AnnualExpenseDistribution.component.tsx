'use client';

import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { useMonthlyFlowsEvolution } from '@/hooks/useMonthlyFlowsEvolution.hook';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function AnnualExpenseDistribution() {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const { data, isLoading, isError } = useMonthlyFlowsEvolution(12, 'moi', 'depenses');

  const filteredData = data.filter((item) => {
    const year = parseInt(item.mois.split('-')[0]);
    return year === selectedYear;
  });

  const chartData = {
    labels: filteredData.map((item) => {
      const month = parseInt(item.mois.split('-')[1]);
      return new Date(0, month - 1).toLocaleString('fr-FR', { month: 'long' });
    }),
    datasets: [
      {
        label: `Dépenses ${selectedYear}`,
        data: filteredData.map((item) => item.totalDepenses),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Dépenses mensuelles pour ${selectedYear}`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}€`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Montant (€)',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Distribution Annuelle des Dépenses
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="input w-32 text-sm"
        >
          <option value={2023}>2023</option>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {isLoading && (
        <div className="h-80 flex items-center justify-center">
          <p>Chargement des données...</p>
        </div>
      )}

      {isError && (
        <div className="h-80 flex items-center justify-center">
          <p className="text-red-500">Erreur lors du chargement des données</p>
        </div>
      )}

      {!isLoading && !isError && filteredData.length === 0 && (
        <div className="h-80 flex items-center justify-center">
          <p>Aucune donnée disponible pour l&apos;année sélectionnée</p>
        </div>
      )}

      {!isLoading && !isError && filteredData.length > 0 && (
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
