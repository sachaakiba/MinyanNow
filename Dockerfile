FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Installer les dépendances
RUN npm ci --only=production

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript (optionnel, on utilise tsx)
# RUN npm run build

# Exposer le port
EXPOSE 3000

# Démarrer le serveur
CMD ["npx", "tsx", "src/api/server.ts"]