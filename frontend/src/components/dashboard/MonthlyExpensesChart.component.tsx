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
  ChartData,
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

export const MonthlyFlowsChart: React.FC<{
  statsContext?: 'moi' | 'couple';
  defaultDataType?: 'depenses' | 'revenus' | 'solde';
}> = ({ statsContext = 'moi', defaultDataType = 'depenses' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6);
  const [dataType, setDataType] = useState<'depenses' | 'revenus' | 'solde'>(
    defaultDataType,
  );
  const { data, isLoading, isError, errorMessage } = useMonthlyFlowsEvolution(
    selectedPeriod,
    statsContext,
    dataType,
  );

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(Number(event.target.value));
  };
  const handleDataTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDataType(event.target.value as 'depenses' | 'revenus' | 'solde');
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Chargement du graphique...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-500 font-medium mb-1">
            Erreur lors du chargement des données du graphique.
          </p>
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">Aucune donnée disponible pour afficher le graphique.</p>
        </div>
      </div>
    );
  }

  let chartData: ChartData<'bar', number[], string>;
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Évolution des ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Mensuelles (${selectedPeriod} derniers mois)`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            `${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}€`,
        },
      },
    },
  };

  if (
    statsContext === 'couple' &&
    data.length > 0 &&
    data[0].depensesPersoUserA !== undefined
  ) {
    const labels = data.map((item) => {
      const date = new Date(item.mois + '-01');
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      });
    });
    const datasetA = {
      label: 'Dépenses Perso Utilisateur',
      data: data.map((item) => item.depensesPersoUserA || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      stack: 'Stack 0',
    };
    const datasetB = {
      label: 'Dépenses Perso Partenaire',
      data: data.map((item) => item.depensesPersoUserB || 0),
      backgroundColor: 'rgba(255, 99, 132, 0.7)',
      stack: 'Stack 0',
    };
    const datasetC = {
      label: 'Dépenses Communes',
      data: data.map((item) => item.depensesCommunes || 0),
      backgroundColor: 'rgba(255, 206, 86, 0.7)',
      stack: 'Stack 0',
    };
    chartData = {
      labels,
      datasets: [datasetA, datasetB, datasetC],
    };
    chartOptions.scales = {
      x: { stacked: true },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            `${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}€`,
        },
      },
    };
    chartOptions.plugins = {
      ...chartOptions.plugins,
      legend: { display: true },
      title: {
        display: true,
        text: `Évolution des Dépenses du Couple (${selectedPeriod} derniers mois)`,
      },
    };
  } else {
    const labels = data.map((item) => {
      const date = new Date(item.mois + '-01');
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      });
    });

    let dataValues: number[] = [];
    let label = '';
    let backgroundColor = '';
    if (dataType === 'depenses') {
      dataValues = data.map((item) => item.totalDepenses ?? 0);
      label = 'Dépenses';
      backgroundColor = 'rgba(255, 99, 132, 0.6)';
    } else if (dataType === 'revenus') {
      dataValues = data.map((item) => item.totalRevenus ?? 0);
      label = 'Revenus';
      backgroundColor = 'rgba(75, 192, 192, 0.6)';
    } else if (dataType === 'solde') {
      dataValues = data.map((item) => item.soldeMensuel ?? 0);
      label = 'Solde';
      backgroundColor = 'rgba(54, 162, 235, 0.6)';
    }

    const borderColors = backgroundColor.replace('0.6', '1');

    chartData = {
      labels,
      datasets: [
        {
          label,
          data: dataValues,
          backgroundColor,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <label
          htmlFor="period-select"
          className="block text-sm font-medium text-gray-700"
        >
          Période :
        </label>
        <select
          id="period-select"
          value={selectedPeriod}
          onChange={handlePeriodChange}
          className="block w-auto min-w-[140px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3"
        >
          <option value={6}>6 derniers mois</option>
          <option value={12}>12 derniers mois</option>
          <option value={24}>24 derniers mois</option>
        </select>
        <label
          htmlFor="data-type-select"
          className="block text-sm font-medium text-gray-700"
        >
          Type de données :
        </label>
        <select
          id="data-type-select"
          value={dataType}
          onChange={handleDataTypeChange}
          className="block w-auto min-w-[120px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3"
        >
          <option value="depenses">Dépenses</option>
          <option value="revenus">Revenus</option>
          <option value="solde">Solde</option>
        </select>
      </div>
      <div className="h-80 md:h-96">
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default MonthlyFlowsChart;
