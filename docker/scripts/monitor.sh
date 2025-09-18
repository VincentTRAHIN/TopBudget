#!/bin/bash
# ============================================
# Script de monitoring TopBudget
# ============================================
# Vérification de l'état des services et health checks

set -euo pipefail

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=""
CHECK_INTERVAL=30
TIMEOUT=10

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URLs des health checks
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5001"
MONGO_EXPRESS_URL="http://localhost:8081"

# Fonction d'aide
show_help() {
    echo -e "${BLUE}TopBudget - Script de monitoring${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV        Environnement (dev|prod|test)"
    echo "  -i, --interval SEC   Intervalle entre les checks (défaut: 30s)"
    echo "  -t, --timeout SEC    Timeout des requêtes (défaut: 10s)"
    echo ""
    echo "Commands:"
    echo "  check               Vérification unique des services"
    echo "  monitor             Monitoring continu"
    echo "  logs                Affichage des logs"
    echo "  status              Statut des containers"
    echo ""
}

# Fonction pour logger avec timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction pour vérifier un endpoint HTTP
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -sf --max-time "$TIMEOUT" "$url" > /dev/null 2>&1; then
        log "${GREEN}✅ ${name}: OK${NC}"
        return 0
    else
        log "${RED}❌ ${name}: FAILED (${url})${NC}"
        return 1
    fi
}

# Fonction pour vérifier l'état d'un container
check_container() {
    local container_name=$1
    local status
    
    status=$(docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=${container_name}" | tail -n +2)
    
    if [[ -n "$status" && "$status" == *"Up"* ]]; then
        log "${GREEN}✅ Container ${container_name}: ${status}${NC}"
        return 0
    else
        log "${RED}❌ Container ${container_name}: DOWN${NC}"
        return 1
    fi
}

# Fonction pour vérifier tous les services
check_all_services() {
    local failed=0
    
    log "${BLUE}=== Vérification des services TopBudget ===${NC}"
    
    # Vérification des containers
    log "${YELLOW}Containers:${NC}"
    check_container "frontend" || ((failed++))
    check_container "backend" || ((failed++))
    check_container "mongodb" || ((failed++))
    
    # Health checks HTTP
    log "${YELLOW}Health checks:${NC}"
    check_endpoint "Frontend" "$FRONTEND_URL" || ((failed++))
    check_endpoint "Backend API" "$BACKEND_URL/health" || ((failed++))
    check_endpoint "Backend API Auth" "$BACKEND_URL/api/auth/health" || ((failed++))
    
    # Vérification Mongo Express (uniquement en dev)
    if [[ "$ENV_FILE" == *"dev"* ]]; then
        check_endpoint "Mongo Express" "$MONGO_EXPRESS_URL" || ((failed++))
    fi
    
    if [ $failed -eq 0 ]; then
        log "${GREEN}✅ Tous les services sont opérationnels !${NC}"
    else
        log "${RED}❌ ${failed} service(s) en échec${NC}"
    fi
    
    return $failed
}

# Fonction de monitoring continu
monitor_services() {
    log "${BLUE}Démarrage du monitoring continu (intervalle: ${CHECK_INTERVAL}s)${NC}"
    log "${YELLOW}Appuyez sur Ctrl+C pour arrêter${NC}"
    
    while true; do
        check_all_services
        echo ""
        sleep "$CHECK_INTERVAL"
    done
}

# Fonction pour afficher les logs
show_logs() {
    local service=${1:-}
    
    if [[ -n "$service" ]]; then
        docker-compose $COMPOSE_ARGS logs -f "$service"
    else
        docker-compose $COMPOSE_ARGS logs -f
    fi
}

# Fonction pour afficher le statut
show_status() {
    log "${BLUE}=== Statut des containers ===${NC}"
    docker-compose $COMPOSE_ARGS ps
    
    echo ""
    log "${BLUE}=== Utilisation des ressources ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"
}

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV_FILE="docker/docker-compose.$2.yml"
            shift 2
            ;;
        -i|--interval)
            CHECK_INTERVAL=$2
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT=$2
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        check|monitor|logs|status)
            COMMAND=$1
            shift
            break
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Configuration des arguments Docker Compose
COMPOSE_ARGS="-f $COMPOSE_FILE"
if [[ -n "$ENV_FILE" ]]; then
    COMPOSE_ARGS="$COMPOSE_ARGS -f $ENV_FILE"
fi

# Exécution des commandes
case "${COMMAND:-check}" in
    "check")
        check_all_services
        ;;
    "monitor")
        monitor_services
        ;;
    "logs")
        show_logs "$@"
        ;;
    "status")
        show_status
        ;;
    *)
        show_help
        exit 1
        ;;
esac