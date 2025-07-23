# TopBudget - Backend API

Backend API pour l'application TopBudget, une solution de gestion budgétaire personnelle développée avec Node.js, Express, TypeScript et MongoDB.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

- **Node.js** : Version 18 ou supérieure
- **npm** ou **yarn** : Gestionnaire de paquets
- **MongoDB** : Instance MongoDB (locale ou distante)
- **Git** : Pour cloner le dépôt

## Installation et Configuration

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/TopBudget.git
cd TopBudget/backend
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à partir du fichier d'exemple :

```bash
cp .env.example .env
```

Modifiez le fichier `.env` avec vos propres valeurs. Consultez la section [Variables d'environnement](#variables-denvironnement) pour plus de détails.

## Mode Développement

Pour démarrer le serveur en mode développement avec rechargement automatique :

```bash
npm run dev
# ou
npm run watch
```

Le serveur démarre par défaut sur le port **5001** : `http://localhost:5001`

Le mode développement offre :

- Rechargement automatique avec `ts-node-dev`
- Transpilation TypeScript à la volée
- Logs détaillés pour le débogage

## Build et Production

### Build de l'application

Pour compiler l'application TypeScript en JavaScript :

```bash
npm run build
```

Les fichiers compilés seront générés dans le répertoire `dist/`.

### Démarrage en mode production

Après avoir effectué le build, démarrez le serveur depuis les fichiers compilés :

```bash
npm start
```

## Variables d'environnement

Les variables d'environnement sont essentielles pour le fonctionnement de l'application. Consultez le fichier `.env.example` pour voir toutes les variables requises et leurs valeurs par défaut.

Les principales variables incluent :

- `MONGO_URI` : URI de connexion à MongoDB
- `JWT_SECRET` : Secret pour la signature des tokens JWT
- `PORT` : Port d'écoute du serveur
- `NODE_ENV` : Environnement d'exécution
- `API_BASE_URL` : URL de base de l'API

## Documentation API

L'API utilise Swagger/OpenAPI pour la documentation interactive. Une fois le serveur démarré, accédez à la documentation à l'adresse :

```
http://localhost:5001/api-docs
```

## Scripts disponibles

- `npm run dev` : Démarre le serveur en mode développement
- `npm run watch` : Alias pour le mode développement
- `npm run build` : Compile l'application TypeScript
- `npm start` : Démarre le serveur depuis les fichiers compilés
- `npm run seed` : Exécute le script de peuplement de la base de données

## Contrôle de santé

L'API expose un endpoint de santé pour vérifier le statut du serveur et de la base de données :

```
GET /api/health
```

## Structure du projet

```
backend/
├── src/
│   ├── controllers/     # Contrôleurs des routes
│   ├── models/         # Modèles Mongoose
│   ├── routes/         # Définition des routes
│   ├── services/       # Logique métier
│   ├── middlewares/    # Middlewares Express
│   ├── types/          # Types TypeScript
│   ├── utils/          # Fonctions utilitaires
│   ├── docs/           # Configuration Swagger
│   └── app.ts          # Point d'entrée de l'application
├── scripts/            # Scripts utilitaires
├── public/             # Fichiers statiques
└── logs/              # Logs de l'application
```

## Développement

### Linting

Le projet utilise ESLint pour maintenir la qualité du code. Pour vérifier le code :

```bash
npm run lint
```

### Logs

Les logs sont gérés avec Winston et sauvegardés dans le dossier `logs/`. Les niveaux de logs incluent :

- `error` : Erreurs critiques
- `warn` : Avertissements
- `info` : Informations générales
- `http` : Requêtes HTTP
- `debug` : Informations de débogage

# Testing deployment workflow

# Deployment test Mer 23 jul 2025 16:23:02 CEST

# Test manual Heroku deployment Mer 23 jul 2025 16:28:03 CEST

# Test debug secrets Mer 23 jul 2025 16:32:47 CEST

# Test debug secrets Mer 23 jul 2025 16:49:47 CEST

# Test debug secrets Mer 23 jul 2025 16:52:00 CEST

# Test debug secrets Mer 23 jul 2025 16:54:00 CEST

# Test debug secrets Mer 23 jul 2025 16:55:00 CEST