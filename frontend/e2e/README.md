# Tests E2E avec Playwright

Ce dossier contient les tests end-to-end (E2E) pour l'application TopBudget.

## 📋 Prérequis

- Node.js >= 18
- L'application backend doit être en cours d'exécution sur `http://localhost:4000`
- L'application frontend doit être en cours d'exécution sur `http://localhost:3000`

## 🚀 Installation

```bash
cd frontend
npm install
npx playwright install  # Installe les navigateurs pour Playwright
```

## ▶️ Exécution des tests

### Tous les tests

```bash
npm run test:e2e
```

### Tests avec interface graphique (mode UI)

```bash
npm run test:e2e:ui
```

### Tests en mode "headed" (voir le navigateur)

```bash
npm run test:e2e:headed
```

### Tests spécifiques

```bash
# Dashboard uniquement
npx playwright test dashboard.spec.ts

# Statistiques uniquement
npx playwright test statistiques.spec.ts
```

## 📁 Structure des fichiers

```
e2e/
├── fixtures.ts              # Helpers et fixtures réutilisables
├── dashboard.spec.ts        # Tests E2E du Dashboard
└── statistiques.spec.ts     # Tests E2E de la page Statistiques
```

## 🔧 Configuration

La configuration Playwright se trouve dans `playwright.config.ts` à la racine du projet frontend.

### Variables d'environnement

```bash
# URL de base (par défaut: http://localhost:3000)
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## 📊 Rapports

Après l'exécution des tests, un rapport HTML est généré dans `playwright-report/`.

Pour visualiser le rapport :

```bash
npx playwright show-report
```

## 🧪 Scénarios testés

### Dashboard (`dashboard.spec.ts`)

1. ✅ Affichage de la page Dashboard avec tous les composants
2. ✅ ExpensesSyncReminder - Alerte de synchronisation si inactif >7 jours
3. ✅ MonthlyExpenseSummary - Résumé mensuel (revenus, dépenses, solde)
4. ✅ UpcomingChargesCalendar - Calendrier des charges fixes
5. ✅ QuickActionsPanel - Panneau d'actions rapides (4 boutons)
6. ✅ Navigation entre les pages
7. ✅ Responsive design (mobile)
8. ✅ Gestion des états de chargement
9. ✅ Switcher de contexte (Moi / Couple)

### Statistiques (`statistiques.spec.ts`)

1. ✅ Affichage de la page Statistiques avec sections
2. ✅ MonthlyComparisonChart - Comparaison mensuelle (revenus vs dépenses)
3. ✅ ExpensesTrendsChart - Tendances des dépenses par catégorie
4. ✅ CategoryBreakdown - Top 5 des catégories avec barres de progression
5. ✅ PieChartFlows - Graphiques en camembert (dépenses et revenus)
6. ✅ Switcher de contexte (Moi / Couple)
7. ✅ Statistiques du couple (si partenaire existe)
8. ✅ Rendu des graphiques sans erreurs
9. ✅ Responsive design (mobile)
10. ✅ Gestion des états vides et de chargement

## 🛠️ Helpers disponibles

### `fixtures.ts`

- **`testUser`** : Données de l'utilisateur de test
- **`login(page, email, password)`** : Helper pour se connecter
- **`logout(page)`** : Helper pour se déconnecter
- **`waitForDataLoaded(page)`** : Attendre le chargement des données
- **`authenticatedPage`** : Fixture avec authentification automatique

### Exemple d'utilisation

```typescript
import { expect, test } from "./fixtures";

test("my test", async ({ authenticatedPage }) => {
  // La page est déjà authentifiée
  await authenticatedPage.goto("/dashboard");
  // ...
});
```

## 📝 Bonnes pratiques

1. **Utiliser des data-testid** pour les sélecteurs critiques
2. **Attendre les états de chargement** avant les assertions
3. **Éviter les timeouts fixes** - préférer `waitForSelector`
4. **Tester sur plusieurs viewports** (desktop, mobile)
5. **Vérifier les états vides et d'erreur**

## 🐛 Débogage

### Mode débogage

```bash
npx playwright test --debug
```

### Traces

Les traces sont automatiquement enregistrées en cas d'échec. Pour les visualiser :

```bash
npx playwright show-trace trace.zip
```

### Screenshots

Les captures d'écran sont automatiquement prises en cas d'échec dans `test-results/`.

## 🔗 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
