'use client';

import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import { RevenuFilters, useRevenus } from '@/hooks/useRevenus.hook';
import { TrendingUp, Hash, Calendar, CreditCard } from 'lucide-react';
import React, { useMemo } from 'react';

interface RevenusSummaryCardProps {
  selectedVue: 'moi' | 'partenaire' | 'couple_complet';
  filters: RevenuFilters;
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
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-green-500">
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
        <div className={`p-3 rounded-full ${colorClass.includes('green') ? 'bg-green-100' : 'bg-blue-100'}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );
}

export default function RevenusSummaryCard({ selectedVue, filters }: RevenusSummaryCardProps) {
  const { totalRevenus, isLoading, isError } = useCurrentMonthFlows(
    selectedVue === 'couple_complet' ? 'couple' : 'moi'
  );

  // Récupérer les données détaillées des revenus pour les calculs
  const { revenus, pagination, isLoading: isRevenusLoading } = useRevenus(
    1, // page
    1000, // limit élevé pour avoir toutes les données du mois
    {
      ...filters,
      dateDebut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dateFin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    },
    {}, // sort
    selectedVue
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

  // Calculer le nombre de revenus
  const nombreRevenus = useMemo(() => {
    return pagination?.total || 0;
  }, [pagination?.total]);

  // Calculer la source principale (catégorie de revenu)
  const sourcePrincipale = useMemo(() => {
    if (!revenus || revenus.length === 0) return '--';

    const categorieCount: Record<string, number> = {};

    revenus.forEach((revenu) => {
      const categorieNom = typeof revenu.categorieRevenu === 'object'
        ? revenu.categorieRevenu.nom
        : 'Non catégorisé';
      categorieCount[categorieNom] = (categorieCount[categorieNom] || 0) + 1;
    });

    const categorieMax = Object.entries(categorieCount).reduce((max, [nom, count]) =>
      count > max.count ? { nom, count } : max,
      { nom: '', count: 0 }
    );

    return categorieMax.nom || '--';
  }, [revenus]);

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
        Erreur lors du chargement du résumé des revenus.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Résumé des revenus {getContextText()}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Vue d&apos;ensemble de vos rentrées financières
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Total Revenus"
          value={formatAmount(totalRevenus)}
          icon={TrendingUp}
          colorClass="text-green-600"
          isLoading={isLoading}
        />
        
        <SummaryStatCard
          title="Nombre de Revenus"
          value={nombreRevenus}
          icon={Hash}
          colorClass="text-blue-600"
          isLoading={isLoading || isRevenusLoading}
        />
        
        <SummaryStatCard
          title="Moyenne/Jour"
          value={formatAmount(totalRevenus / new Date().getDate())}
          icon={Calendar}
          colorClass="text-gray-600"
          isLoading={isLoading}
        />
        
        <SummaryStatCard
          title="Source Principale"
          value={sourcePrincipale}
          icon={CreditCard}
          colorClass="text-purple-600"
          isLoading={isLoading || isRevenusLoading}
        />
      </div>
    </div>
  );
} 