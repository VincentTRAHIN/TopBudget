'use client';

import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorTheme: 'expense' | 'income' | 'balance';
  isLoading?: boolean;
  isError?: boolean;
}

const getColorClasses = (theme: 'expense' | 'income' | 'balance', value?: number) => {
  switch (theme) {
    case 'expense':
      return {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        valueColor: 'text-red-600',
      };
    case 'income':
      return {
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        valueColor: 'text-green-600',
      };
    case 'balance':
      return {
        iconBg: value && value >= 0 ? 'bg-indigo-100' : 'bg-red-100',
        iconColor: value && value >= 0 ? 'text-indigo-600' : 'text-red-600',
        valueColor: value && value >= 0 ? 'text-indigo-600' : 'text-red-600',
      };
    default:
      return {
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        valueColor: 'text-gray-600',
      };
  }
};

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  colorTheme, 
  isLoading = false, 
  isError = false 
}: KPICardProps) {
  const colors = getColorClasses(colorTheme, value);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <p className="text-red-500 text-sm">Erreur de chargement</p>
          </div>
          <div className="ml-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-red-100`}>
              <Icon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className={`text-2xl font-bold ${colors.valueColor}`}>
            {value.toFixed(2)} €
          </p>
        </div>
        <div className="ml-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.iconBg}`}>
            <Icon className={`w-6 h-6 ${colors.iconColor}`} />
          </div>
        </div>
      </div>
    </div>
  );
} 