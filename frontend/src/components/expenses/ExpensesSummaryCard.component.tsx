'use client';

import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import { DepenseFilters, useDepenses } from '@/hooks/useDepenses.hook';
import { TrendingDown, Hash, Calendar, CreditCard } from 'lucide-react';
import React, { useMemo } from 'react';

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

const SummaryStatCard = React.memo(function SummaryStatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  isLoading,
}: SummaryStatProps) {
  const formattedValue = useMemo(() => {
    if (isLoading) return null;
    return typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
  }, [value, isLoading]);

  const backgroundColorClass = useMemo(() => {
    return colorClass.includes('red') ? 'bg-red-100' : 'bg-blue-100';
  }, [colorClass]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-red-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
            </div>
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>
              {formattedValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${backgroundColorClass}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );
});

function ExpensesSummaryCard({
  selectedVue,
  filters,
}: ExpensesSummaryCardProps) {
  const { totalDepenses, isLoading, isError } = useCurrentMonthFlows(
    selectedVue === 'couple_complet' ? 'couple' : 'moi',
  );

  // Récupérer les données détaillées des dépenses pour les calculs
  const { depenses, pagination, isLoading: isDepensesLoading } = useDepenses(
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

  const contextText = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    switch (selectedVue) {
      case 'partenaire':
        return `du partenaire pour ${currentMonth}`;
      case 'couple_complet':
        return `du couple pour ${currentMonth}`;
      default:
        return `pour ${currentMonth}`;
    }
  }, [selectedVue]);

  const formatAmount = useMemo(() => {
    return (amount: number) => {
      return `${amount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`;
    };
  }, []);

  const formattedTotalDepenses = useMemo(() => {
    return formatAmount(totalDepenses);
  }, [totalDepenses, formatAmount]);

  const averagePerDay = useMemo(() => {
    const currentDate = new Date().getDate();
    return formatAmount(totalDepenses / currentDate);
  }, [totalDepenses, formatAmount]);

  // Calculer le nombre de dépenses
  const nombreDepenses = useMemo(() => {
    return pagination?.total || 0;
  }, [pagination?.total]);

  // Calculer la catégorie principale
  const categoriePrincipale = useMemo(() => {
    if (!depenses || depenses.length === 0) return '--';

    const categorieCount: Record<string, number> = {};

    depenses.forEach((depense) => {
      const categorieNom = typeof depense.categorie === 'object'
        ? depense.categorie.nom
        : 'Non catégorisé';
      categorieCount[categorieNom] = (categorieCount[categorieNom] || 0) + 1;
    });

    const categorieMax = Object.entries(categorieCount).reduce((max, [nom, count]) =>
      count > max.count ? { nom, count } : max,
      { nom: '', count: 0 }
    );

    return categorieMax.nom || '--';
  }, [depenses]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
        Erreur lors du chargement du résumé des dépenses.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Résumé des dépenses {contextText}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Vue d&apos;ensemble de vos sorties financières
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Total Dépenses"
          value={formattedTotalDepenses}
          icon={TrendingDown}
          colorClass="text-red-600"
          isLoading={isLoading}
        />

        <SummaryStatCard
          title="Nombre de Dépenses"
          value={nombreDepenses}
          icon={Hash}
          colorClass="text-blue-600"
          isLoading={isLoading || isDepensesLoading}
        />

        <SummaryStatCard
          title="Moyenne/Jour"
          value={averagePerDay}
          icon={Calendar}
          colorClass="text-gray-600"
          isLoading={isLoading}
        />

        <SummaryStatCard
          title="Catégorie Principale"
          value={categoriePrincipale}
          icon={CreditCard}
          colorClass="text-purple-600"
          isLoading={isLoading || isDepensesLoading}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-red-100 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Filtres actifs:</strong> Les données affichées peuvent être
            filtrées
          </p>
        </div>
      )}
    </div>
  );
}

export default React.memo(ExpensesSummaryCard);
