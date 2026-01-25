#!/bin/bash

# Charge les variables d'environnement depuis .env.prod
set -a
source .env.prod
set +a

# Vérifie que DATABASE_URL est définie
if [ -z "$DATABASE_URL" ]; then
  echo "Erreur: La variable DATABASE_URL doit être définie dans .env.prod"
  exit 1
fi

echo "🔄 Mise à jour de la base de données de production..."
echo "📍 DATABASE_URL: ${DATABASE_URL:0:30}..."

# Génère le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Push les changements vers la base de données
echo "🚀 Application des migrations vers la base de données..."
npx prisma db push

echo "✅ Mise à jour terminée avec succès!"
