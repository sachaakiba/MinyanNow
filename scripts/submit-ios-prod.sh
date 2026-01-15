#!/bin/bash

# Charge les variables d'environnement depuis .env.prod
set -a
source .env.prod
set +a

# Mappe APP_ID vers ASC_APP_ID et TEAM_ID vers APPLE_TEAM_ID
export ASC_APP_ID="${APP_ID}"
export APPLE_TEAM_ID="${TEAM_ID}"

# Vérifie que les variables nécessaires sont définies
if [ -z "$APPLE_ID" ] || [ -z "$ASC_APP_ID" ] || [ -z "$APPLE_TEAM_ID" ]; then
  echo "Erreur: Les variables APPLE_ID, APP_ID (ou ASC_APP_ID) et TEAM_ID doivent être définies dans .env.prod"
  exit 1
fi

# Exécute eas submit avec les variables d'environnement
eas submit --platform ios --profile production
