# TopBudget

Une application web moderne de gestion de budget personnel développée avec les dernières technologies web. TopBudget vous permet de gérer efficacement vos finances au quotidien.

## Table des matières

- [TopBudget](#topbudget)
  - [Table des matières](#table-des-matières)
  - [Fonctionnalités](#fonctionnalités)
    - [Gestion des dépenses](#gestion-des-dépenses)
    - [Interface utilisateur](#interface-utilisateur)
  - [Architecture technique](#architecture-technique)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Infrastructure](#infrastructure)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Démarrage](#démarrage)
    - [Développement local](#développement-local)
    - [Avec Docker](#avec-docker)
  - [Développement](#développement)
    - [Structure du projet](#structure-du-projet)
    - [Conventions de code](#conventions-de-code)
  - [Tests](#tests)
  - [Déploiement](#déploiement)
  - [Contribution](#contribution)
  - [Licence](#licence)

## Fonctionnalités

### Gestion des dépenses

- **Ajout de dépenses** : Enregistrement rapide des dépenses avec date, montant et catégorie
- **Modification et suppression** : Gestion complète des dépenses existantes
- **Catégorisation** : Système de catégories personnalisables
- **Recherche avancée** : Filtrage par date, catégorie, montant et mots-clés
- **Visualisation** : Affichage détaillé avec graphiques et statistiques
- **Devises** : Support complet de l'euro (€)

### Interface utilisateur

- **Design moderne** : Interface responsive et intuitive
- **Composants réutilisables** : Architecture modulaire
- **Feedback utilisateur** : Système de notifications (toasts)
- **Formulaires optimisés** : Validation en temps réel
- **Thème personnalisable** : Support du mode sombre/clair

## Architecture technique

### Frontend

- **Framework** : React avec Next.js (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Gestion d'état** : React Hooks personnalisés
- **Composants** : Architecture "use client"
- **Tests** : Jest et React Testing Library

### Backend

- **API REST** : Architecture RESTful
- **Base de données** : MongoDB
- **Authentification** : JWT
- **Validation** : Zod
- **Tests** : Jest et Supertest

### Infrastructure

- **Docker** : Containerisation de l'application
- **CI/CD** : Intégration et déploiement continus
- **Monitoring** : Suivi des performances

## Prérequis

- Node.js (v18 ou supérieur)
- npm (v9 ou supérieur) ou yarn (v1.22 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- Docker et Docker Compose (optionnel)

## Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/votre-nom-de-repo/topbudget.git
cd topbudget
```

2. Installer les dépendances :

```bash
# Installation des dépendances frontend
cd frontend
npm install

# Installation des dépendances backend
cd ../backend
npm install
```

## Configuration

1. Créer les fichiers de configuration :

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

2. Configurer les variables d'environnement dans les fichiers `.env`

> **📖 Documentation détaillée :**
> - [**Backend README**](./backend/README.md) - Installation, configuration et API du backend
> - [**Frontend README**](./frontend/README.md) - Installation, configuration et développement du frontend

## Démarrage

### Développement local

```bash
# Démarrer le backend
cd backend
npm run dev

# Démarrer le frontend (dans un nouveau terminal)
cd frontend
npm run dev
```

### Avec Docker

```bash
docker-compose up -d
```

## Développement

### Structure du projet

```
topbudget/
├── frontend/          # Application React/Next.js
├── backend/           # API Node.js
├── concept/          # Documentation et maquettes
└── docker-compose.yml # Configuration Docker
```

### Conventions de code

- Utilisation de TypeScript strict
- ESLint et Prettier pour le formatage
- Commits conventionnels
- Revue de code obligatoire

## Tests

```bash
# Tests frontend
cd frontend
npm test

# Tests backend
cd backend
npm test
```

## Déploiement

Le déploiement est automatisé via GitHub Actions. Les branches principales sont :

- `main` : Environnement de production
- `develop` : Environnement de développement

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter les changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
