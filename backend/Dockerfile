FROM node:20-alpine

# Créer le dossier d’application
WORKDIR /usr/src/app

# Copier les package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le reste
COPY . .

# Compiler le TypeScript
RUN npm run build

# Exposer le port du backend
EXPOSE 5000

# Commande pour lancer le backend en prod
CMD ["node", "dist/app.js"]
