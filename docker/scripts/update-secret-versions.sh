#!/bin/bash
# ============================================
# Script de mise à jour des versions de secrets
# ============================================
# Ce script met à jour docker-compose.yml avec les nouvelles versions de secrets

set -euo pipefail

DOCKER_COMPOSE_FILE="/Users/nitrahinio/Developer/TopBudget/docker-compose.prod.yml"
BACKUP_SUFFIX=".backup.$(date +%Y%m%d_%H%M%S)"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction pour mettre à jour la version des secrets
update_secret_versions() {
    local old_version="$1"
    local new_version="$2"
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Fichier docker-compose non trouvé: $DOCKER_COMPOSE_FILE${NC}"
        exit 1
    fi
    
    # Faire un backup
    cp "$DOCKER_COMPOSE_FILE" "${DOCKER_COMPOSE_FILE}${BACKUP_SUFFIX}"
    echo -e "${BLUE}📄 Backup créé: ${DOCKER_COMPOSE_FILE}${BACKUP_SUFFIX}${NC}"
    
    # Mettre à jour les versions
    sed -i.tmp "s/topbudget_\([^_]*\)_${old_version}/topbudget_\\1_${new_version}/g" "$DOCKER_COMPOSE_FILE"
    rm -f "${DOCKER_COMPOSE_FILE}.tmp"
    
    echo -e "${GREEN}✅ Versions des secrets mises à jour: ${old_version} → ${new_version}${NC}"
    
    # Afficher les changements
    echo -e "${BLUE}Changements effectués:${NC}"
    diff "${DOCKER_COMPOSE_FILE}${BACKUP_SUFFIX}" "$DOCKER_COMPOSE_FILE" || true
}

# Vérifier les arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <ancienne_version> <nouvelle_version>"
    echo "Exemple: $0 v1 v2"
    exit 1
fi

update_secret_versions "$1" "$2"