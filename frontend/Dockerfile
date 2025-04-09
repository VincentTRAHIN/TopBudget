# frontend/Dockerfile
FROM node:lts-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

EXPOSE 3000

# Lancer le serveur de développement Next.js
CMD ["npm", "run", "dev"]