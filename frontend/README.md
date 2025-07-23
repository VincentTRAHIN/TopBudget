# TopBudget - Interface Utilisateur

Interface utilisateur pour l'application TopBudget, une solution de gestion budgétaire personnelle développée avec Next.js 15, React 19, TypeScript et Tailwind CSS.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

- **Node.js** : Version 18 ou supérieure
- **npm** ou **yarn** : Gestionnaire de paquets
- **Git** : Pour cloner le dépôt
- **Backend TopBudget** : Le serveur backend doit être configuré et en cours d'exécution

## Installation et Configuration

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/TopBudget.git
cd TopBudget/frontend
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env.local` à partir du fichier d'exemple :

```bash
cp .env.example .env.local
```

Modifiez le fichier `.env.local` avec vos propres valeurs. Consultez la section [Variables d'environnement](#variables-denvironnement) pour plus de détails.

## Mode Développement

Pour démarrer le serveur de développement avec Turbopack :

```bash
npm run dev
```

Le serveur démarre par défaut sur le port **3000** : `http://localhost:3000`

Le mode développement offre :

- Rechargement à chaud (Hot Reload)
- Turbopack pour une compilation ultra-rapide
- Optimisations automatiques Next.js
- Support TypeScript intégré

## Build et Production

### Build de l'application

Pour compiler l'application pour la production :

```bash
npm run build
```

Cette commande :

- Compile et optimise l'application
- Génère les fichiers statiques
- Effectue l'analyse des bundles
- Prépare l'application pour le déploiement

### Test de la version de production (local)

Après avoir effectué le build, vous pouvez tester la version de production localement :

```bash
npm start
```

Cela démarre un serveur de production sur `http://localhost:3000`.

## Variables d'environnement

L'application frontend utilise des variables d'environnement préfixées par `NEXT_PUBLIC_` pour être accessibles côté client. Consultez le fichier `.env.example` pour voir toutes les variables requises.

### Variables principales

- `NEXT_PUBLIC_API_URL` : URL de base de l'API backend (requis)
- `NEXT_PUBLIC_BACKEND_URL` : URL du backend pour les images et ressources statiques

## Scripts disponibles

- `npm run dev` : Démarre le serveur de développement avec Turbopack
- `npm run build` : Compile l'application pour la production
- `npm start` : Démarre le serveur de production
- `npm run lint` : Vérifie la qualité du code avec ESLint

## Fonctionnalités

### 🏠 Dashboard

- Vue d'ensemble des finances personnelles
- Graphiques interactifs avec Chart.js
- KPI et métriques importantes
- Historique des dépenses récentes

### 💰 Gestion des Dépenses

- Ajout, modification et suppression de dépenses
- Catégorisation des dépenses
- Import CSV pour les relevés bancaires
- Filtrage et recherche avancés

### 📈 Gestion des Revenus

- Suivi des revenus par catégorie
- Import et export de données
- Analyse des tendances

### 📊 Statistiques et Analyses

- Graphiques de répartition par catégorie
- Évolution mensuelle des dépenses
- Comparaisons inter-périodes
- Synthèse financière mensuelle

### 👤 Profil Utilisateur

- Gestion du profil personnel
- Upload d'avatar
- Changement de mot de passe
- Gestion des partenaires (couples)

## Architecture Frontend

### Structure du projet

```
frontend/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── auth/              # Pages d'authentification
│   │   ├── dashboard/         # Page tableau de bord
│   │   ├── expenses/          # Pages gestion dépenses
│   │   ├── revenus/           # Pages gestion revenus
│   │   ├── categories/        # Pages gestion catégories
│   │   ├── statistiques/      # Pages statistiques
│   │   └── profil/           # Page profil utilisateur
│   ├── components/            # Composants React réutilisables
│   │   ├── auth/             # Composants authentification
│   │   ├── dashboard/        # Composants tableau de bord
│   │   ├── expenses/         # Composants dépenses
│   │   ├── revenus/          # Composants revenus
│   │   ├── layout/           # Composants de mise en page
│   │   ├── shared/           # Composants partagés
│   │   └── statistiques/     # Composants statistiques
│   ├── hooks/                # Hooks React personnalisés
│   ├── services/             # Services API et utilitaires
│   ├── types/                # Types TypeScript
│   ├── utils/                # Fonctions utilitaires
│   └── styles/               # Styles globaux
├── public/                   # Fichiers statiques
└── tailwind.config.ts       # Configuration Tailwind CSS
```

### Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **React 19** : Bibliothèque d'interface utilisateur
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS utilitaire
- **SWR** : Gestion des données et cache
- **Chart.js** : Graphiques et visualisations
- **Formik + Yup** : Gestion des formulaires et validation
- **React Hot Toast** : Notifications utilisateur
- **Lucide React** : Icônes modernes

## Développement

### Linting et Formatage

Le projet utilise ESLint et Prettier pour maintenir la qualité du code :

```bash
npm run lint
```

### Conventions de développement

- Utilisation de TypeScript strict
- Composants fonctionnels avec hooks
- Architecture basée sur les fonctionnalités
- Optimisations React (memo, callback, useMemo)
- Tests et validation des formulaires

### Performance

L'application est optimisée pour les performances :

- Code splitting automatique
- Lazy loading des composants
- Optimisation des images Next.js
- Memoization des composants coûteux
- Bundle analysis intégré

## Déploiement

L'application peut être déployée sur différentes plateformes :

- **Vercel** : Déploiement automatique depuis Git
- **Docker** : Conteneurisation avec Dockerfile inclus
- **Serveur statique** : Export statique possible

Pour plus de détails sur le déploiement, consultez la [documentation Next.js](https://nextjs.org/docs/app/building-your-application/deploying).
