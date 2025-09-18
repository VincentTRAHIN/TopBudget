#!/bin/bash

# ============================================================================
# TopBudget - Script de Monitoring et Maintenance Automatisée
# ============================================================================
# Usage: ./scripts/maintenance.sh [action] [options]
# Actions: monitor, backup, cleanup, update, health, logs, restart
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/maintenance-$(date +%Y%m%d_%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Variables
ACTION=""
ENVIRONMENT="production"
CONTINUOUS=false
INTERVAL=300  # 5 minutes par défaut
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
WEBHOOK_URL=""

# ============================================================================
# Fonctions utilitaires
# ============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

show_usage() {
    cat << EOF
🔧 TopBudget - Script de Monitoring et Maintenance

USAGE:
    ./scripts/maintenance.sh [ACTION] [OPTIONS]

ACTIONS:
    monitor         Surveillance continue des services
    backup          Sauvegarde manuelle
    cleanup         Nettoyage des ressources
    update          Mise à jour des services
    health          Vérification de santé complète
    logs            Affichage et rotation des logs
    restart         Redémarrage intelligent des services
    dashboard       Interface de monitoring interactif

OPTIONS:
    --env [env]           Environnement (dev, staging, production)
    --continuous          Mode surveillance continue
    --interval [seconds]  Intervalle de surveillance (défaut: 300s)
    --cpu-threshold [%]   Seuil d'alerte CPU (défaut: 80%)
    --memory-threshold [%] Seuil d'alerte mémoire (défaut: 85%)
    --webhook [url]       URL webhook pour notifications
    -h, --help           Affiche cette aide

EXEMPLES:
    # Surveillance continue
    ./scripts/maintenance.sh monitor --continuous --interval 60

    # Vérification rapide de santé
    ./scripts/maintenance.sh health

    # Sauvegarde avec nettoyage
    ./scripts/maintenance.sh backup && ./scripts/maintenance.sh cleanup

    # Dashboard interactif
    ./scripts/maintenance.sh dashboard

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            monitor|backup|cleanup|update|health|logs|restart|dashboard)
                ACTION="$1"
                shift
                ;;
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --continuous)
                CONTINUOUS=true
                shift
                ;;
            --interval)
                INTERVAL="$2"
                shift 2
                ;;
            --cpu-threshold)
                ALERT_THRESHOLD_CPU="$2"
                shift 2
                ;;
            --memory-threshold)
                ALERT_THRESHOLD_MEMORY="$2"
                shift 2
                ;;
            --webhook)
                WEBHOOK_URL="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error "Option inconnue: $1"
                ;;
        esac
    done

    if [[ -z "$ACTION" ]]; then
        error "Action requise. Utilisez --help pour voir l'aide."
    fi
}

send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"🔔 TopBudget Alert [$severity]: $message\"}" \
             2>/dev/null || warn "Échec d'envoi de notification webhook"
    fi
    
    # Log local
    case $severity in
        error)
            error "$message"
            ;;
        warning)
            warn "$message"
            ;;
        *)
            info "$message"
            ;;
    esac
}

# ============================================================================
# Fonctions de monitoring
# ============================================================================

get_container_stats() {
    local format="table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    docker stats --no-stream --format "$format" | grep topbudget || echo "Aucun conteneur TopBudget trouvé"
}

check_container_health() {
    local issues=0
    
    info "Vérification de l'état des conteneurs..."
    
    # Vérifier que tous les conteneurs sont running
    local expected_containers=("backend" "frontend" "mongodb")
    for container in "${expected_containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "${container}"; then
            log "✅ Container $container: Running"
        else
            send_notification "Container $container is not running" "error"
            ((issues++))
        fi
    done
    
    # Vérifier les health checks
    info "Vérification des health checks..."
    if curl -sf http://localhost:5001/api/health/ready > /dev/null; then
        log "✅ Backend health check: OK"
    else
        send_notification "Backend health check failed" "error"
        ((issues++))
    fi
    
    if curl -sf http://localhost:3000/api/health > /dev/null; then
        log "✅ Frontend health check: OK"
    else
        send_notification "Frontend health check failed" "error"
        ((issues++))
    fi
    
    return $issues
}

monitor_resources() {
    info "Monitoring des ressources système..."
    
    # Vérifier CPU et mémoire des conteneurs
    while IFS=$'\t' read -r name cpu mem_usage mem_perc net_io block_io; do
        if [[ "$name" == "NAME" ]]; then continue; fi  # Skip header
        
        # Extraire les pourcentages numériques
        cpu_num=$(echo "$cpu" | sed 's/%//')
        mem_num=$(echo "$mem_perc" | sed 's/%//')
        
        # Vérifier les seuils CPU
        if (( $(echo "$cpu_num > $ALERT_THRESHOLD_CPU" | bc -l 2>/dev/null || echo 0) )); then
            send_notification "$name: High CPU usage ${cpu}" "warning"
        fi
        
        # Vérifier les seuils mémoire
        if (( $(echo "$mem_num > $ALERT_THRESHOLD_MEMORY" | bc -l 2>/dev/null || echo 0) )); then
            send_notification "$name: High memory usage ${mem_perc}" "warning"
        fi
        
    done <<< "$(docker stats --no-stream --format $'{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}' | grep topbudget)"
    
    # Vérifier l'espace disque
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 85 ]]; then
        send_notification "High disk usage: ${disk_usage}%" "warning"
    fi
}

check_application_metrics() {
    info "Vérification des métriques applicatives..."
    
    # Vérifier les erreurs récentes dans les logs
    local error_count=$(docker-compose logs --since="1h" | grep -i "error\|exception\|failed" | wc -l)
    if [[ $error_count -gt 10 ]]; then
        send_notification "$error_count errors found in last hour" "warning"
    fi
    
    # Vérifier les temps de réponse
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:5001/api/health/quick)
    if (( $(echo "$response_time > 2" | bc -l 2>/dev/null || echo 0) )); then
        send_notification "Slow API response: ${response_time}s" "warning"
    fi
}

# ============================================================================
# Actions principales
# ============================================================================

action_monitor() {
    if [[ "$CONTINUOUS" == "true" ]]; then
        log "🔍 Démarrage du monitoring continu (intervalle: ${INTERVAL}s)"
        
        while true; do
            check_container_health
            monitor_resources
            check_application_metrics
            
            info "Prochaine vérification dans ${INTERVAL}s... (Ctrl+C pour arrêter)"
            sleep "$INTERVAL"
        done
    else
        log "🔍 Vérification unique de monitoring"
        check_container_health
        monitor_resources
        check_application_metrics
    fi
}

action_backup() {
    log "💾 Démarrage de la sauvegarde automatique"
    
    local backup_dir="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Sauvegarde MongoDB
    if docker ps --format "{{.Names}}" | grep -q mongodb; then
        info "Sauvegarde de MongoDB..."
        docker exec mongodb_${ENVIRONMENT} mongodump --out /tmp/backup
        docker cp mongodb_${ENVIRONMENT}:/tmp/backup "$backup_dir/mongodb"
    fi
    
    # Sauvegarde des volumes
    info "Sauvegarde des volumes Docker..."
    docker run --rm \
        -v topbudget_mongodb_data:/source:ro \
        -v "$backup_dir":/backup \
        alpine tar czf /backup/mongodb_data.tar.gz -C /source .
    
    # Sauvegarde de la configuration
    cp -r "$PROJECT_DIR/docker" "$backup_dir/"
    cp "$PROJECT_DIR/docker-compose.yml" "$backup_dir/"
    
    log "✅ Sauvegarde terminée: $backup_dir"
}

action_cleanup() {
    log "🧹 Nettoyage des ressources système"
    
    # Nettoyer les images Docker
    info "Nettoyage des images Docker..."
    docker image prune -a -f --filter "until=72h"
    
    # Nettoyer les volumes
    info "Nettoyage des volumes non utilisés..."
    docker volume prune -f
    
    # Nettoyer les logs anciens
    info "Rotation des logs..."
    find "$PROJECT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Nettoyer les sauvegardes anciennes
    info "Suppression des anciennes sauvegardes..."
    find "$PROJECT_DIR/backups" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
    
    log "✅ Nettoyage terminé"
}

action_update() {
    log "🔄 Mise à jour des services"
    
    # Pull des nouvelles images
    info "Récupération des nouvelles images..."
    docker-compose pull
    
    # Redémarrage avec les nouvelles images
    info "Redémarrage des services..."
    docker-compose down
    docker-compose up -d
    
    # Attendre que les services redémarrent
    sleep 30
    
    # Vérifier que tout fonctionne
    if check_container_health; then
        log "✅ Mise à jour réussie"
    else
        send_notification "Update failed - services not healthy" "error"
        return 1
    fi
}

action_health() {
    log "🏥 Vérification complète de santé"
    
    echo "## 📊 Rapport de Santé TopBudget - $(date)"
    echo "=================================="
    
    echo ""
    echo "### 🐳 État des Conteneurs"
    docker-compose ps
    
    echo ""
    echo "### 📊 Statistiques des Ressources"
    get_container_stats
    
    echo ""
    echo "### 🔍 Health Checks"
    if curl -sf http://localhost:5001/api/health >/dev/null; then
        echo "✅ Backend API: Healthy"
        curl -s http://localhost:5001/api/health | jq '.checks' 2>/dev/null || echo "  (Détails non disponibles)"
    else
        echo "❌ Backend API: Unhealthy"
    fi
    
    if curl -sf http://localhost:3000/api/health >/dev/null; then
        echo "✅ Frontend: Healthy"
    else
        echo "❌ Frontend: Unhealthy"
    fi
    
    echo ""
    echo "### 💾 Espace Disque"
    df -h / | awk 'NR==2 {print "Utilisation: " $5 " (" $3 " utilisés / " $2 " total)"}'
    
    echo ""
    echo "### 📝 Erreurs Récentes (dernière heure)"
    local errors=$(docker-compose logs --since="1h" | grep -i "error\|exception" | wc -l)
    echo "Nombre d'erreurs: $errors"
    
    echo ""
    echo "### 🔗 URLs d'accès"
    echo "- Frontend: http://localhost:3000"
    echo "- API Backend: http://localhost:5001"
    echo "- Health Check: http://localhost:5001/api/health"
    echo "- Documentation API: http://localhost:5001/api-docs"
}

action_logs() {
    log "📋 Gestion des logs"
    
    case ${1:-show} in
        show)
            docker-compose logs --tail=100 -f
            ;;
        rotate)
            info "Rotation des logs..."
            docker-compose logs > "$PROJECT_DIR/logs/docker-$(date +%Y%m%d_%H%M%S).log"
            docker system events --since="24h" > "$PROJECT_DIR/logs/events-$(date +%Y%m%d_%H%M%S).log"
            ;;
    esac
}

action_restart() {
    log "🔄 Redémarrage intelligent des services"
    
    # Redémarrage graceful
    info "Arrêt des services..."
    docker-compose stop
    
    # Attendre un peu
    sleep 5
    
    info "Démarrage des services..."
    docker-compose start
    
    # Vérifier que tout redémarre correctement
    sleep 30
    
    if check_container_health; then
        log "✅ Redémarrage réussi"
    else
        send_notification "Restart failed - manual intervention required" "error"
        return 1
    fi
}

action_dashboard() {
    log "📊 Dashboard de monitoring interactif"
    
    while true; do
        clear
        echo "🔧 TopBudget - Dashboard de Monitoring"
        echo "======================================"
        echo "Dernière mise à jour: $(date)"
        echo ""
        
        echo "🐳 État des Conteneurs:"
        docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
        echo ""
        
        echo "📊 Ressources:"
        get_container_stats
        echo ""
        
        echo "🏥 Health Status:"
        if curl -sf http://localhost:5001/api/health/ready >/dev/null 2>&1; then
            echo "✅ Backend: Healthy"
        else
            echo "❌ Backend: Unhealthy"
        fi
        
        if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
            echo "✅ Frontend: Healthy"
        else
            echo "❌ Frontend: Unhealthy"
        fi
        echo ""
        
        echo "💾 Espace disque: $(df / | awk 'NR==2 {print $5}')"
        echo ""
        
        echo "Actions disponibles:"
        echo "  [r] Redémarrer services    [l] Voir logs"
        echo "  [b] Backup                 [c] Cleanup"
        echo "  [h] Health check détaillé  [q] Quitter"
        echo ""
        echo -n "Votre choix (ou Entrée pour actualiser): "
        
        read -t 10 -r choice || choice=""
        
        case $choice in
            r) action_restart ;;
            l) action_logs show ;;
            b) action_backup ;;
            c) action_cleanup ;;
            h) action_health ;;
            q) break ;;
            "") continue ;;
        esac
    done
}

# ============================================================================
# Script principal
# ============================================================================

main() {
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/backups"
    
    cd "$PROJECT_DIR"
    
    case $ACTION in
        monitor)
            action_monitor
            ;;
        backup)
            action_backup
            ;;
        cleanup)
            action_cleanup
            ;;
        update)
            action_update
            ;;
        health)
            action_health
            ;;
        logs)
            action_logs
            ;;
        restart)
            action_restart
            ;;
        dashboard)
            action_dashboard
            ;;
        *)
            error "Action inconnue: $ACTION"
            ;;
    esac
}

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi