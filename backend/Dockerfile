# backend/Dockerfile
FROM node:lts-alpine

# Utiliser /app comme répertoire de travail standard
WORKDIR /app

# Installer les outils de build AVANT toute installation npm
# et les dépendances système nécessaires pour certains paquets.
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    apk add --no-cache libc6-compat

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour ts-node-dev)
# Cela va compiler bcrypt pour Alpine en utilisant les outils installés
RUN npm install

# Supprimer les outils de build après installation pour garder l'image légère (optionnel mais bonne pratique)
# RUN apk del .build-deps

# Copier le RESTE du code source SEULEMENT APRÈS l'installation des dépendances
# Ceci est crucial pour le cache Docker et pour ne pas polluer npm install
COPY . .

# Exposer le port
EXPOSE 5001

# Commande pour lancer en mode développement avec ts-node-dev
CMD ["npm", "run", "watch"]