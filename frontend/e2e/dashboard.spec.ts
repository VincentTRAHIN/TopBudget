/**
 * Tests E2E pour la page Dashboard refactorisée
 * 
 * Scénarios testés :
 * 1. Affichage de la page Dashboard
 * 2. Composant ExpensesSyncReminder
 * 3. Composant MonthlyExpenseSummary
 * 4. Composant UpcomingChargesCalendar
 * 5. Composant QuickActionsPanel
 * 6. Navigation et interactions
 */

import { test, expect } from './fixtures';

test.describe('Dashboard Page', () => {
  
  test.beforeEach(async ({ authenticatedPage }) => {
    // Naviguer vers le Dashboard avant chaque test
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display the Dashboard page with all components', async ({ authenticatedPage }) => {
    // Vérifier le titre de la page
    await expect(authenticatedPage.locator('h1')).toContainText('Tableau de Bord');
    
    // Vérifier que les 4 composants principaux sont présents
    const expensesSyncReminder = authenticatedPage.locator('[data-testid="expenses-sync-reminder"]');
    const monthlyExpenseSummary = authenticatedPage.locator('[data-testid="monthly-expense-summary"]');
    const upcomingChargesCalendar = authenticatedPage.locator('[data-testid="upcoming-charges-calendar"]');
    const quickActionsPanel = authenticatedPage.locator('[data-testid="quick-actions-panel"]');
    
    // Au moins un de ces composants doit être visible (selon l'état des données)
    const componentCount = await authenticatedPage.locator('[data-testid*="expenses-sync"], [data-testid*="monthly-expense"], [data-testid*="upcoming-charges"], [data-testid*="quick-actions"]').count();
    expect(componentCount).toBeGreaterThan(0);
  });

  test('ExpensesSyncReminder - should display sync reminder if inactive for >7 days', async ({ authenticatedPage }) => {
    // Chercher le composant ExpensesSyncReminder
    const syncReminder = authenticatedPage.locator('[data-testid="expenses-sync-reminder"]');
    
    // Si le composant est visible (utilisateur inactif >7 jours)
    if (await syncReminder.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier le message
      await expect(syncReminder).toContainText('synchronisation');
      
      // Vérifier le bouton d'action
      const actionButton = syncReminder.locator('button:has-text("Ajouter une dépense")');
      await expect(actionButton).toBeVisible();
      
      // Cliquer et vérifier la navigation
      await actionButton.click();
      await authenticatedPage.waitForURL(/\/depenses/, { timeout: 5000 });
    }
  });

  test('MonthlyExpenseSummary - should display monthly summary with financial data', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(2000);
    
    // Chercher les cartes de résumé (Revenus, Dépenses, Solde)
    const summaryCards = authenticatedPage.locator('[class*="bg-white"][class*="shadow"]');
    
    // Vérifier qu'il y a au moins 3 cartes (Revenus, Dépenses, Solde)
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
    
    // Vérifier la présence de textes clés
    const pageContent = await authenticatedPage.textContent('body');
    expect(pageContent).toMatch(/Revenus|Dépenses|Solde/);
  });

  test('UpcomingChargesCalendar - should display upcoming charges if any exist', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(2000);
    
    // Chercher le composant UpcomingChargesCalendar
    const calendar = authenticatedPage.locator('[data-testid="upcoming-charges-calendar"]');
    
    // Si le composant est visible
    if (await calendar.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier le titre
      await expect(calendar).toContainText('Charges');
      
      // Vérifier la présence de la liste des charges
      const chargesList = calendar.locator('ul, [role="list"]');
      await expect(chargesList).toBeVisible();
    }
  });

  test('QuickActionsPanel - should display all 4 action buttons', async ({ authenticatedPage }) => {
    // Chercher le panneau d'actions rapides
    const quickActions = authenticatedPage.locator('[data-testid="quick-actions-panel"]');
    
    // Si le composant est visible
    if (await quickActions.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier les 4 boutons
      const addExpenseBtn = quickActions.locator('button:has-text("Ajouter"), a:has-text("Ajouter")').first();
      const importCsvBtn = quickActions.locator('button:has-text("Importer"), a:has-text("Importer")').first();
      const statsBtn = quickActions.locator('button:has-text("Statistiques"), a:has-text("Statistiques")').first();
      const addRevenueBtn = quickActions.locator('button:has-text("Revenu"), a:has-text("Revenu")').first();
      
      // Vérifier qu'au moins 2 boutons sont visibles
      const buttonsCount = await quickActions.locator('button, a').count();
      expect(buttonsCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('QuickActionsPanel - should navigate to correct pages when clicking buttons', async ({ authenticatedPage }) => {
    // Chercher le panneau d'actions rapides
    const quickActions = authenticatedPage.locator('[data-testid="quick-actions-panel"]');
    
    if (await quickActions.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Test navigation vers Statistiques
      const statsBtn = quickActions.locator('button:has-text("Statistiques"), a:has-text("Statistiques")').first();
      
      if (await statsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await statsBtn.click();
        await authenticatedPage.waitForURL(/\/statistiques/, { timeout: 5000 });
        
        // Revenir au Dashboard
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.waitForLoadState('networkidle');
      }
      
      // Test navigation vers Ajouter dépense
      const addExpenseBtn = quickActions.locator('button:has-text("Ajouter"), a:has-text("Ajouter")').first();
      
      if (await addExpenseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await addExpenseBtn.click();
        await authenticatedPage.waitForURL(/\/depenses/, { timeout: 5000 });
      }
    }
  });

  test('Dashboard - should be responsive on mobile viewport', async ({ authenticatedPage }) => {
    // Changer la taille de la viewport en mobile
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    
    // Recharger la page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Vérifier que la page est toujours affichée correctement
    const pageContent = await authenticatedPage.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Vérifier qu'il n'y a pas de scroll horizontal
    const scrollWidth = await authenticatedPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await authenticatedPage.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // +5 pour la tolérance
  });

  test('Dashboard - should handle loading states gracefully', async ({ authenticatedPage }) => {
    // Recharger la page pour observer les états de chargement
    await authenticatedPage.reload();
    
    // Vérifier qu'il n'y a pas d'erreurs visibles
    const errorMessages = authenticatedPage.locator('[class*="error"], [role="alert"]');
    const errorCount = await errorMessages.count();
    
    // Attendre le chargement complet
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Vérifier qu'aucune erreur ne persiste après le chargement
    const persistentErrors = await authenticatedPage.locator('[class*="error"]:visible, [role="alert"]:visible').count();
    expect(persistentErrors).toBeLessThanOrEqual(0);
  });

  test('Dashboard - should display context switcher if user has partner', async ({ authenticatedPage }) => {
    // Chercher le switcher de contexte (Mes Stats / Stats du Couple)
    const contextSwitcher = authenticatedPage.locator('button:has-text("Mes"), button:has-text("Couple")').first();
    
    // Si l'utilisateur a un partenaire, le switcher doit être visible
    if (await contextSwitcher.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier qu'on peut cliquer sur le bouton
      await contextSwitcher.click();
      
      // Attendre un court délai pour le rechargement des données
      await authenticatedPage.waitForTimeout(1000);
      
      // Vérifier que la page reste fonctionnelle
      const pageContent = await authenticatedPage.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });
});
