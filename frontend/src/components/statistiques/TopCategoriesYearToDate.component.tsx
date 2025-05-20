'use client';

import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { useCategoryDistribution } from '@/hooks/useCategoryDistribution.hook';

ChartJS.register(ArcElement, Tooltip, Legend);

const BACKGROUND_COLORS = [
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 99, 132, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)',
  'rgba(199, 199, 199, 0.6)',
];

export default function TopCategoriesYearToDate({
  statsContext = 'moi',
}: {
  statsContext?: 'moi' | 'couple';
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [categoryData, setCategoryData] = useState<{
    labels: string[];
    values: number[];
    colors: string[];
  }>({ labels: [], values: [], colors: [] });

  const [totalAmount, setTotalAmount] = useState<number>(0);

  const { categoryDistribution, isLoading, isError } = useCategoryDistribution(
    currentYear,
    currentMonth,
    statsContext,
  );

  useEffect(() => {
    if (
      !isLoading &&
      !isError &&
      categoryDistribution &&
      categoryDistribution.length > 0
    ) {
      const totalSum = categoryDistribution.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      setTotalAmount(totalSum);

      const sortedCategories = [...categoryDistribution].sort(
        (a, b) => b.total - a.total,
      );

      const mainCategories = sortedCategories.slice(0, 5);

      const otherCategories = sortedCategories.slice(5);
      const othersTotal = otherCategories.reduce(
        (sum, cat) => sum + cat.total,
        0,
      );

      const labels: string[] = mainCategories.map((cat) => cat.nom);
      const values: number[] = mainCategories.map((cat) => cat.total);
      const colors: string[] = BACKGROUND_COLORS.slice(
        0,
        mainCategories.length,
      );

      if (otherCategories.length > 0) {
        labels.push('Autres');
        values.push(othersTotal);
        colors.push('rgba(192, 192, 192, 0.6)');
      }

      setCategoryData({
        labels,
        values,
        colors,
      });
    }
  }, [categoryDistribution, isLoading, isError]);

  const chartData = {
    labels: categoryData.labels,
    datasets: [
      {
        label: 'Dépenses',
        data: categoryData.values,
        backgroundColor: categoryData.colors,
        borderColor: categoryData.colors.map((color) =>
          color.replace('0.6', '1'),
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          boxWidth: 12,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            return `${context.label}: ${value.toFixed(2)}€ (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Top Catégories de Dépenses {currentYear}
      </h3>

      {isLoading && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <p>Chargement des données...</p>
        </div>
      )}

      {isError && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <p className="text-red-500">Erreur lors du chargement des données</p>
        </div>
      )}

      {!isLoading && !isError && categoryData.labels.length === 0 && (
        <div className="h-80 md:h-96 flex items-center justify-center">
          <p>Aucune dépense enregistrée pour cette année</p>
        </div>
      )}

      {!isLoading && !isError && categoryData.labels.length > 0 && (
        <div className="h-80 md:h-96 flex justify-center">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
