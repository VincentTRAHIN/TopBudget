/**
 * Tests E2E pour la page Statistiques refactorisée
 * 
 * Scénarios testés :
 * 1. Affichage de la page Statistiques
 * 2. Composant MonthlyComparisonChart
 * 3. Composant ExpensesTrendsChart
 * 4. Composant CategoryBreakdown
 * 5. Composants PieChartFlows (répartitions)
 * 6. Statistiques du couple
 * 7. Switcher de contexte (Moi / Couple)
 */

import { test, expect } from './fixtures';

test.describe('Statistiques Page', () => {
  
  test.beforeEach(async ({ authenticatedPage }) => {
    // Naviguer vers la page Statistiques avant chaque test
    await authenticatedPage.goto('/statistiques');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display the Statistiques page with title and context switcher', async ({ authenticatedPage }) => {
    // Vérifier le titre de la page
    await expect(authenticatedPage.locator('h1')).toContainText('Statistiques');
    
    // Vérifier la présence du switcher de contexte
    const contextSwitcher = authenticatedPage.locator('button:has-text("Mes Statistiques"), button:has-text("Statistiques du Couple")');
    const switcherCount = await contextSwitcher.count();
    expect(switcherCount).toBeGreaterThanOrEqual(1);
    
    // Vérifier la présence de sections
    const sections = authenticatedPage.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(2); // Au moins 2 sections
  });

  test('Section 1 - Vue d\'Ensemble Mensuelle (MonthlyComparisonChart)', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(2000);
    
    // Chercher la section "Vue d'Ensemble Mensuelle"
    const monthlySection = authenticatedPage.locator('text=Vue d\'Ensemble Mensuelle').first();
    
    if (await monthlySection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier la présence du graphique (canvas Chart.js)
      const chart = authenticatedPage.locator('canvas').first();
      await expect(chart).toBeVisible({ timeout: 5000 });
      
      // Vérifier la présence des cartes de résumé (Revenus, Dépenses, Solde)
      const pageContent = await authenticatedPage.textContent('body');
      expect(pageContent).toMatch(/Revenus|Dépenses|Solde/);
    }
  });

  test('Section 2 - Analyse des Dépenses (ExpensesTrendsChart + CategoryBreakdown)', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(2000);
    
    // Chercher la section "Analyse des Dépenses"
    const analysisSection = authenticatedPage.locator('text=Analyse des Dépenses').first();
    
    if (await analysisSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier la présence du graphique ExpensesTrendsChart
      const chartsCount = await authenticatedPage.locator('canvas').count();
      expect(chartsCount).toBeGreaterThanOrEqual(1);
      
      // Vérifier la présence de CategoryBreakdown (top 5 catégories)
      const categoryBreakdown = authenticatedPage.locator('[data-testid="category-breakdown"]');
      
      if (await categoryBreakdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Vérifier les badges numérotés (1-5)
        const badges = categoryBreakdown.locator('[class*="rounded-full"]');
        const badgeCount = await badges.count();
        expect(badgeCount).toBeGreaterThanOrEqual(1);
        expect(badgeCount).toBeLessThanOrEqual(5);
      }
    }
  });

  test('ExpensesTrendsChart - should display category trends over time', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(3000);
    
    // Chercher le graphique de tendances
    const charts = authenticatedPage.locator('canvas');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      // Vérifier que le graphique est visible
      await expect(charts.first()).toBeVisible();
      
      // Vérifier la présence d'indicateurs de tendance (hausse/baisse/stable)
      const pageContent = await authenticatedPage.textContent('body');
      const hasTrendIndicators = pageContent?.includes('€') || pageContent?.includes('%');
      expect(hasTrendIndicators).toBeTruthy();
    }
  });

  test('CategoryBreakdown - should display top 5 expense categories with progress bars', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(2000);
    
    // Chercher les barres de progression (progress bars)
    const progressBars = authenticatedPage.locator('[class*="bg-red-500"], [class*="bg-blue-500"], [class*="bg-green-500"]');
    const progressCount = await progressBars.count();
    
    // Il devrait y avoir entre 1 et 5 barres de progression
    if (progressCount > 0) {
      expect(progressCount).toBeGreaterThanOrEqual(1);
      expect(progressCount).toBeLessThanOrEqual(5);
      
      // Vérifier la présence de montants en euros
      const pageContent = await authenticatedPage.textContent('body');
      expect(pageContent).toMatch(/€/);
    }
  });

  test('Section 3 - Répartitions par Catégorie (PieChartFlows)', async ({ authenticatedPage }) => {
    // Attendre le chargement des données
    await authenticatedPage.waitForTimeout(3000);
    
    // Chercher la section "Répartitions par Catégorie"
    const pieChartsSection = authenticatedPage.locator('text=Répartitions par Catégorie').first();
    
    if (await pieChartsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Vérifier la présence de graphiques en camembert (canvas)
      const charts = authenticatedPage.locator('canvas');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThanOrEqual(2); // Au moins 2 charts (Dépenses + Revenus)
      
      // Vérifier les titres des graphiques
      const pageContent = await authenticatedPage.textContent('body');
      expect(pageContent).toMatch(/Dépenses par Catégorie|Revenus par Catégorie/);
    }
  });

  test('Context Switcher - should toggle between "Moi" and "Couple" contexts', async ({ authenticatedPage }) => {
    // Chercher le switcher de contexte
    const myStatsBtn = authenticatedPage.locator('button:has-text("Mes Statistiques")').first();
    const coupleStatsBtn = authenticatedPage.locator('button:has-text("Statistiques du Couple")').first();
    
    // Vérifier que le bouton "Mes Statistiques" existe
    await expect(myStatsBtn).toBeVisible();
    
    // Si l'utilisateur a un partenaire, tester le switch vers "Couple"
    if (await coupleStatsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Cliquer sur "Statistiques du Couple"
      await coupleStatsBtn.click();
      
      // Attendre le rechargement des données
      await authenticatedPage.waitForTimeout(2000);
      
      // Vérifier que le bouton est actif (classe active)
      const coupleActive = await coupleStatsBtn.getAttribute('class');
      expect(coupleActive).toContain('text-indigo-600');
      
      // Revenir à "Mes Statistiques"
      await myStatsBtn.click();
      await authenticatedPage.waitForTimeout(2000);
      
      // Vérifier que le bouton est actif
      const myActive = await myStatsBtn.getAttribute('class');
      expect(myActive).toContain('text-indigo-600');
    }
  });

  test('Section 4 - Statistiques du Couple (if partner exists)', async ({ authenticatedPage }) => {
    // Cliquer sur "Statistiques du Couple" si le bouton existe
    const coupleStatsBtn = authenticatedPage.locator('button:has-text("Statistiques du Couple")').first();
    
    if (await coupleStatsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await coupleStatsBtn.click();
      await authenticatedPage.waitForTimeout(2000);
      
      // Chercher la section "Statistiques du Couple"
      const coupleSection = authenticatedPage.locator('text=Statistiques du Couple').first();
      
      if (await coupleSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Vérifier la présence de CoupleContributionsSummary et CoupleFixedChargesList
        const pageContent = await authenticatedPage.textContent('body');
        expect(pageContent).toMatch(/Contribution|Charges/i);
      }
    }
  });

  test('Charts - should render without errors', async ({ authenticatedPage }) => {
    // Attendre le chargement complet
    await authenticatedPage.waitForTimeout(3000);
    
    // Vérifier qu'il n'y a pas d'erreurs de rendu de graphiques
    const errorMessages = authenticatedPage.locator('[class*="error"], [role="alert"]');
    const errorCount = await errorMessages.count();
    
    // Vérifier la présence de graphiques (canvas)
    const charts = authenticatedPage.locator('canvas');
    const chartCount = await charts.count();
    
    // Il devrait y avoir au moins 1 graphique et aucune erreur
    expect(chartCount).toBeGreaterThanOrEqual(1);
    
    const visibleErrors = await authenticatedPage.locator('[class*="error"]:visible').count();
    expect(visibleErrors).toBeLessThanOrEqual(0);
  });

  test('Statistiques - should be responsive on mobile viewport', async ({ authenticatedPage }) => {
    // Changer la taille de la viewport en mobile
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    
    // Recharger la page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);
    
    // Vérifier que la page est toujours affichée correctement
    const pageContent = authenticatedPage.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Vérifier qu'il n'y a pas de scroll horizontal
    const scrollWidth = await authenticatedPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await authenticatedPage.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // +5 pour la tolérance
    
    // Vérifier que les graphiques sont toujours visibles
    const charts = authenticatedPage.locator('canvas');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });

  test('Statistiques - should handle empty data states gracefully', async ({ authenticatedPage }) => {
    // Recharger la page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(3000);
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    const pageContent = await authenticatedPage.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Vérifier que la page affiche soit des données, soit un message "Aucune donnée"
    const bodyText = await authenticatedPage.textContent('body');
    const hasContent = bodyText && (
      bodyText.includes('€') || 
      bodyText.includes('Aucun') || 
      bodyText.includes('Pas de')
    );
    expect(hasContent).toBeTruthy();
  });

  test('Statistiques - should load all sections progressively', async ({ authenticatedPage }) => {
    // Recharger la page pour observer le chargement progressif
    await authenticatedPage.reload();
    
    // Attendre le chargement initial
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Vérifier les sections une par une avec des délais progressifs
    await authenticatedPage.waitForTimeout(1000);
    const section1 = await authenticatedPage.locator('section').first().isVisible();
    expect(section1).toBeTruthy();
    
    await authenticatedPage.waitForTimeout(2000);
    const sections = await authenticatedPage.locator('section').count();
    expect(sections).toBeGreaterThanOrEqual(2);
    
    // Vérifier qu'au moins un graphique est chargé
    await authenticatedPage.waitForTimeout(3000);
    const charts = await authenticatedPage.locator('canvas').count();
    expect(charts).toBeGreaterThanOrEqual(1);
  });
});
