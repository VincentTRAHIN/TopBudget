# Étape 1 : Builder l'application Next.js
FROM node:20-alpine AS builder

WORKDIR /app

# Installer uniquement les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le code
COPY . .

# Construire l'application Next.js
RUN npm run build

# Étape 2 : Exécuter l'app avec Next.js standalone output
FROM node:20-alpine AS runner

WORKDIR /app

# Copier uniquement le dossier .next standalone généré
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Installer uniquement les dépendances de prod
RUN npm install --production

# Exposer le port de Next.js
EXPOSE 3000

# Lancer Next.js
CMD ["node", "server.js"]
