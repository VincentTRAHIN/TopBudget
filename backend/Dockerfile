# backend/Dockerfile
# Stage de build
FROM node:lts-alpine AS builder

# Définir les variables d'environnement pour npm
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=warn

# Utiliser /app comme répertoire de travail
WORKDIR /app

# Installation des dépendances de build
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && apk add --no-cache libc6-compat

# Copier uniquement les fichiers nécessaires pour npm install
COPY package*.json ./
COPY tsconfig.json ./

# Installation des dépendances avec cache optimisé
RUN npm ci

# Copier le reste du code source
COPY . .

# Build de l'application
RUN npm run build

# Nettoyage des dépendances de build
RUN apk del .build-deps

# Stage de développement
FROM node:lts-alpine AS development

# Définir les variables d'environnement
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=warn

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Configuration des permissions
RUN chown -R appuser:appgroup /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5001

# Commande de démarrage pour le développement
CMD ["npm", "run", "dev"]

# Stage de production
FROM node:lts-alpine AS production

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires depuis le stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --only=production \
    && npm cache clean --force

# Configuration des permissions
RUN chown -R appuser:appgroup /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5001

# Commande de démarrage
CMD ["node", "dist/app.js"]