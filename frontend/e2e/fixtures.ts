import { test as base } from "@playwright/test";

/**
 * Fixtures personnalisées pour les tests E2E
 *
 * Permet de partager des configurations et helpers entre tests
 */

// Données de test
export const testUser = {
  email: "test@topbudget.com",
  password: "Test123!",
  nom: "Test",
  prenom: "User",
};

// Helper pour se connecter
export async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Attendre la redirection après login
  await page.waitForURL("/dashboard", { timeout: 10000 });
}

// Helper pour se déconnecter
export async function logout(page: any) {
  // Cliquer sur le bouton de déconnexion dans le menu utilisateur
  await page.click('[data-testid="user-menu"]', { timeout: 5000 }).catch(() => {
    // Si le data-testid n'existe pas, essayer avec un sélecteur plus générique
    return page.click('button:has-text("Déconnexion")');
  });
}

// Helper pour attendre le chargement des données
export async function waitForDataLoaded(page: any) {
  // Attendre que les skeletons de chargement disparaissent
  await page.waitForSelector('[data-testid="skeleton"]', { state: "detached", timeout: 10000 }).catch(() => {
    // Si pas de skeleton, attendre un délai court
    return page.waitForTimeout(1000);
  });
}

// Fixture personnalisée avec authentification
type AuthenticatedFixture = {
  authenticatedPage: any;
};

export const test = base.extend<AuthenticatedFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Setup : Se connecter avant chaque test
    await login(page, testUser.email, testUser.password);

    // Utiliser la page authentifiée dans le test
    await use(page);

    // Teardown : Se déconnecter après le test (optionnel)
    // await logout(page);
  },
});

export { expect } from "@playwright/test";
