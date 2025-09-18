# backend/Dockerfile
# ============================================
# Stage de base - Configuration commune
# ============================================
FROM node:lts-alpine AS base

# Installer dépendances système une seule fois
RUN apk add --no-cache \
    dumb-init \
    libc6-compat \
    && apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++

# Créer utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# ============================================
# Stage dependencies - Installation des deps
# ============================================
FROM base AS dependencies

# Variables d'environnement pour npm
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installation avec cache optimisé
RUN npm ci --include=dev \
    && npm cache clean --force

# ============================================
# Stage development - Environnement de dev
# ============================================
FROM dependencies AS development

ENV NODE_ENV=development

# Copier le code source
COPY . .

# Créer dossier logs avec permissions
RUN mkdir -p logs && \
    chown -R appuser:appgroup /app && \
    chmod 755 logs

USER appuser

EXPOSE 5001

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================
# Stage build - Construction de l'app
# ============================================
FROM dependencies AS build

ENV NODE_ENV=production

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Nettoyage des dépendances de développement
RUN npm prune --production

# Nettoyer les dépendances de build
RUN apk del .build-deps

# ============================================
# Stage production - Image finale optimisée
# ============================================
FROM base AS production

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Copier les artefacts de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Créer dossier logs avec permissions
RUN mkdir -p logs && \
    chown -R appuser:appgroup /app && \
    chmod 755 logs

USER appuser

EXPOSE 5001

# Health check pour la production
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5001/health || exit 1

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]