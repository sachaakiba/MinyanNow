FROM node:20-alpine

WORKDIR /app

# Argument de build pour DATABASE_URL (nécessaire pour prisma generate)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour dotenv et tsx)
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY src ./src

# Démarrer le serveur (Railway gère le port automatiquement via $PORT)
CMD ["npx", "tsx", "src/api/server.ts"]