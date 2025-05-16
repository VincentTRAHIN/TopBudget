"use client";

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
  ChartData,
  ChartOptions,
} from 'chart.js';
import { useMonthlyExpensesEvolution } from '../../hooks/useMonthlyExpensesEvolution.hook';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const YEAR_COLORS: { [key: string]: string } = {
  '2023': 'rgba(255, 159, 64, 0.6)',
  '2024': 'rgba(54, 162, 235, 0.6)',
  '2025': 'rgba(75, 192, 192, 0.6)',
};
const DEFAULT_BAR_COLOR = 'rgba(153, 102, 255, 0.6)';

export const MonthlyExpensesChart: React.FC<{ statsContext?: 'moi' | 'couple' }> = ({ statsContext = 'moi' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6); 
  const { data, isLoading, isError, errorMessage } = useMonthlyExpensesEvolution(selectedPeriod, statsContext);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(Number(event.target.value));
  };

  if (isLoading) {
    return <div className="bg-white p-4 rounded shadow-md h-96 flex items-center justify-center">Chargement du graphique...</div>;
  }

  if (isError) {
    return (
      <div className="bg-white p-4 rounded shadow-md h-96 flex flex-col items-center justify-center">
        <p className="text-red-500">Erreur lors du chargement des données du graphique.</p>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="bg-white p-4 rounded shadow-md h-96 flex items-center justify-center">Aucune donnée disponible pour afficher le graphique.</div>;
  }

  const labels = data.map(item => {
    const date = new Date(item.mois + '-01');
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  });

  const dataValues = data.map(item => item.totalDepenses);

  const backgroundColors = data.map(item => {
    const year = item.mois.split('-')[0];
    return YEAR_COLORS[year] || DEFAULT_BAR_COLOR;
  });

  const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

  const chartData: ChartData<'bar', number[], string> = {
    labels,
    datasets: [
      {
        label: 'Dépenses Mensuelles',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Évolution des Dépenses Mensuelles (${selectedPeriod} derniers mois)`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}€`,
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="flex items-center justify-center gap-2 mb-4">
        <label htmlFor="period-select" className="block text-sm font-medium text-gray-700">Période :</label>
        <select
          id="period-select"
          value={selectedPeriod}
          onChange={handlePeriodChange}
          className="mt-1 block w-auto max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
        >
          <option value={6}>6 derniers mois</option>
          <option value={12}>12 derniers mois</option>
          <option value={24}>24 derniers mois</option>
        </select>
      </div>
      <div className="h-80 md:h-96">
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default MonthlyExpensesChart;
