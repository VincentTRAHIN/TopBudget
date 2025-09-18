# frontend/Dockerfile
# ============================================
# Stage base - Configuration commune
# ============================================
FROM node:lts-alpine AS base

# Installer dépendances système
RUN apk add --no-cache \
    dumb-init \
    libc6-compat

# Créer utilisateur non-root
RUN addgroup -S nextgroup && adduser -S nextuser -G nextgroup

WORKDIR /app

# ============================================
# Stage deps - Installation des dépendances
# ============================================
FROM base AS deps

# Variables d'environnement pour npm
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Copier les fichiers de dépendances
COPY package*.json ./

# Installation des dépendances avec cache optimisé
RUN npm ci --include=dev \
    && npm cache clean --force

# ============================================
# Stage builder - Construction de l'app
# ============================================
FROM deps AS builder

# Définir les variables d'environnement pour le build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copier le code source
COPY . .

# Build de l'application Next.js
RUN npm run build

# ============================================
# Stage development - Environnement de dev
# ============================================
FROM deps AS development

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Copier le code source
COPY . .

# Permissions pour l'utilisateur
RUN chown -R nextuser:nextgroup /app

USER nextuser

EXPOSE 3000

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================
# Stage runner - Production optimisée
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer dossier pour l'utilisateur Next.js
RUN mkdir .next && \
    chown nextuser:nextgroup .next

# Copier les artefacts de build
COPY --from=builder --chown=nextuser:nextgroup /app/.next/standalone ./
COPY --from=builder --chown=nextuser:nextgroup /app/.next/static ./.next/static

# Créer le dossier public (optionnel pour Next.js)
RUN mkdir -p public

USER nextuser

EXPOSE 3000

# Health check pour la production
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]