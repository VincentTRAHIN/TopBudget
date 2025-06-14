'use client';

import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import { DepenseFilters } from '@/hooks/useDepenses.hook';
import { TrendingDown, Hash, Calendar, CreditCard } from 'lucide-react';

interface ExpensesSummaryCardProps {
  selectedVue: 'moi' | 'partenaire' | 'couple_complet';
  filters: DepenseFilters;
}

interface SummaryStatProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading?: boolean;
}

function SummaryStatCard({ title, value, icon: Icon, colorClass, isLoading }: SummaryStatProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
            </div>
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClass.includes('red') ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );
}

export default function ExpensesSummaryCard({ selectedVue, filters }: ExpensesSummaryCardProps) {
  const { totalDepenses, isLoading, isError } = useCurrentMonthFlows(
    selectedVue === 'couple_complet' ? 'couple' : 'moi'
  );

  const getContextText = () => {
    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    switch (selectedVue) {
      case 'partenaire':
        return `du partenaire pour ${currentMonth}`;
      case 'couple_complet':
        return `du couple pour ${currentMonth}`;
      default:
        return `pour ${currentMonth}`;
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} €`;
  };

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
        Erreur lors du chargement du résumé des dépenses.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Résumé des dépenses {getContextText()}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Vue d&apos;ensemble de votre activité financière
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Total Dépenses"
          value={formatAmount(totalDepenses)}
          icon={TrendingDown}
          colorClass="text-red-600"
          isLoading={isLoading}
        />
        
        <SummaryStatCard
          title="Nombre de Dépenses"
          value="--"
          icon={Hash}
          colorClass="text-blue-600"
          isLoading={isLoading}
        />
        
        <SummaryStatCard
          title="Moyenne/Jour"
          value={formatAmount(totalDepenses / new Date().getDate())}
          icon={Calendar}
          colorClass="text-gray-600"
          isLoading={isLoading}
        />
        
        <SummaryStatCard
          title="Catégorie Principale"
          value="--"
          icon={CreditCard}
          colorClass="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="mt-4 p-3 bg-blue-100 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Filtres actifs:</strong> Les données affichées peuvent être filtrées
          </p>
        </div>
      )}
    </div>
  );
} 