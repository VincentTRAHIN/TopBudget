'use client';

/**
 * Icône SVG PlusCircle (ajouter)
 */
const PlusCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

/**
 * Icône SVG Upload (importer)
 */
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/**
 * Icône SVG BarChart (statistiques)
 */
const BarChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

/**
 * Icône SVG DollarSign (revenus)
 */
const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/**
 * Interface pour une action rapide
 */
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType;
  href: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  ariaLabel: string;
}

/**
 * Composant QuickActionsPanel
 * 
 * Panneau d'actions rapides permettant un accès direct aux fonctionnalités principales :
 * - Ajouter une dépense
 * - Importer un fichier CSV
 * - Voir les statistiques
 * - Ajouter un revenu
 * 
 * @example
 * ```tsx
 * <QuickActionsPanel />
 * ```
 */
export default function QuickActionsPanel() {
  // Définition des actions rapides
  const quickActions: QuickAction[] = [
    {
      id: 'add-expense',
      label: 'Ajouter une dépense',
      description: 'Enregistrer une nouvelle dépense',
      icon: PlusCircleIcon,
      href: '/depenses?action=add',
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      textColor: 'text-white',
      ariaLabel: 'Ajouter une nouvelle dépense',
    },
    {
      id: 'import-csv',
      label: 'Importer CSV',
      description: 'Importer des dépenses depuis un fichier',
      icon: UploadIcon,
      href: '/depenses?action=import',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-white',
      ariaLabel: 'Importer des dépenses depuis un fichier CSV',
    },
    {
      id: 'view-stats',
      label: 'Statistiques',
      description: 'Voir les statistiques détaillées',
      icon: BarChartIcon,
      href: '/statistiques',
      bgColor: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      textColor: 'text-white',
      ariaLabel: 'Voir les statistiques financières détaillées',
    },
    {
      id: 'add-revenue',
      label: 'Ajouter un revenu',
      description: 'Enregistrer un nouveau revenu',
      icon: DollarSignIcon,
      href: '/revenus?action=add',
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-white',
      ariaLabel: 'Ajouter un nouveau revenu',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Actions rapides
        </h3>
        <p className="text-sm text-gray-500">
          Accès rapide aux fonctionnalités principales
        </p>
      </div>

      {/* Grille d'actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <a
              key={action.id}
              href={action.href}
              className={`
                flex flex-col items-center justify-center p-6 
                ${action.bgColor} ${action.hoverColor} ${action.textColor}
                rounded-lg shadow-sm 
                transition-all duration-200 
                transform hover:scale-105 hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}
              aria-label={action.ariaLabel}
            >
              {/* Icône */}
              <div className="mb-3">
                <IconComponent />
              </div>

              {/* Label */}
              <p className="font-semibold text-center mb-1">
                {action.label}
              </p>

              {/* Description */}
              <p className="text-xs opacity-90 text-center">
                {action.description}
              </p>
            </a>
          );
        })}
      </div>

      {/* Message incitatif */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          💡 <span className="font-medium">Astuce :</span> Utilisez les raccourcis clavier pour un accès encore plus rapide !
        </p>
      </div>
    </div>
  );
}
