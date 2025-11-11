import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour les tests E2E
 *
 * Documentation : https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Dossier contenant les tests E2E
  testDir: "./e2e",

  // Timeout maximum par test
  timeout: 30 * 1000,

  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 0,

  // Workers pour parallélisation
  workers: process.env.CI ? 1 : undefined,

  // Reporter pour les résultats
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Configuration globale pour tous les tests
  use: {
    // URL de base de l'application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

    // Captures d'écran en cas d'échec
    screenshot: "only-on-failure",

    // Vidéo en cas d'échec
    video: "retain-on-failure",

    // Trace en cas d'échec (utile pour le débogage)
    trace: "retain-on-failure",
  },

  // Projets de tests (navigateurs)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Décommenter pour tester sur Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Décommenter pour tester sur Safari
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Décommenter pour tester sur mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Serveur de développement (optionnel - démarre automatiquement l'app)
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
