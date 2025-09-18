#!/bin/bash

# ============================================================================
# TopBudget - Script de Déploiement Automatisé
# ============================================================================
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: dev, staging, production
# Options: --update-images, --backup, --rollback, --health-check
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Variables globales
ENVIRONMENT=""
UPDATE_IMAGES=false
CREATE_BACKUP=false
ROLLBACK_TARGET=""
RUN_HEALTH_CHECK=true
FORCE_DEPLOY=false

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
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

progress() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# Fonctions principales
# ============================================================================

show_usage() {
    cat << EOF
🚀 TopBudget - Script de Déploiement Automatisé

USAGE:
    ./scripts/deploy.sh [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
    dev         Déploiement développement (hot-reload, debug)
    staging     Déploiement test/pré-production
    production  Déploiement production (optimisé, sécurisé)

OPTIONS:
    --update-images     Met à jour les images Docker depuis le registry
    --backup           Crée une sauvegarde avant déploiement
    --rollback [tag]   Effectue un rollback vers une version spécifique
    --no-health-check  Skip les vérifications de santé après déploiement
    --force            Force le déploiement même si des tests échouent
    -h, --help         Affiche cette aide

EXEMPLES:
    # Déploiement développement simple
    ./scripts/deploy.sh dev

    # Déploiement production avec sauvegarde
    ./scripts/deploy.sh production --backup

    # Rollback vers version précédente
    ./scripts/deploy.sh production --rollback v1.2.0

    # Déploiement staging avec images mises à jour
    ./scripts/deploy.sh staging --update-images

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            --update-images)
                UPDATE_IMAGES=true
                shift
                ;;
            --backup)
                CREATE_BACKUP=true
                shift
                ;;
            --rollback)
                ROLLBACK_TARGET="$2"
                shift 2
                ;;
            --no-health-check)
                RUN_HEALTH_CHECK=false
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error "Option inconnue: $1. Utilisez --help pour voir l'aide."
                ;;
        esac
    done

    if [[ -z "$ENVIRONMENT" ]]; then
        error "Environnement requis. Utilisez: dev, staging ou production"
    fi
}

check_prerequisites() {
    progress "Vérification des prérequis..."

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé ou pas dans le PATH"
    fi

    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé ou pas dans le PATH"
    fi

    # Vérifier que Docker daemon est démarré
    if ! docker info &> /dev/null; then
        error "Docker daemon n'est pas démarré"
    fi

    # Vérifier les fichiers de configuration
    local compose_file="$PROJECT_DIR/docker-compose.yml"
    local env_override="$PROJECT_DIR/docker/docker-compose.$ENVIRONMENT.yml"

    if [[ ! -f "$compose_file" ]]; then
        error "Fichier docker-compose.yml introuvable: $compose_file"
    fi

    if [[ ! -f "$env_override" ]]; then
        error "Fichier de configuration environnement introuvable: $env_override"
    fi

    # Vérifier les variables d'environnement
    local env_file="$PROJECT_DIR/.env.$ENVIRONMENT"
    if [[ ! -f "$env_file" ]] && [[ ! -f "$PROJECT_DIR/.env" ]]; then
        warn "Aucun fichier .env trouvé. Utilisation des valeurs par défaut."
    fi

    log "✅ Tous les prérequis sont satisfaits"
}

create_backup() {
    if [[ "$CREATE_BACKUP" == "false" ]]; then
        return 0
    fi

    progress "Création de la sauvegarde..."

    mkdir -p "$BACKUP_DIR"
    local backup_name="topbudget-backup-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"

    # Créer le dossier de sauvegarde
    mkdir -p "$backup_path"

    # Sauvegarder les données MongoDB
    if docker ps --format "table {{.Names}}" | grep -q "mongodb"; then
        info "Sauvegarde de la base de données MongoDB..."
        docker exec mongodb_${ENVIRONMENT} mongodump --out /backup
        docker cp mongodb_${ENVIRONMENT}:/backup "$backup_path/mongodb_backup"
    fi

    # Sauvegarder les volumes Docker
    info "Sauvegarde des volumes Docker..."
    docker run --rm -v topbudget_mongodb_data:/data -v "$backup_path":/backup alpine tar czf /backup/mongodb_volume.tar.gz -C /data .

    # Sauvegarder la configuration
    info "Sauvegarde de la configuration..."
    cp -r "$PROJECT_DIR/docker" "$backup_path/"
    cp "$PROJECT_DIR/docker-compose.yml" "$backup_path/"
    
    if [[ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]]; then
        cp "$PROJECT_DIR/.env.$ENVIRONMENT" "$backup_path/"
    fi

    # Créer un fichier d'information
    cat > "$backup_path/backup_info.txt" << EOF
TopBudget Backup Information
============================
Created: $(date)
Environment: $ENVIRONMENT
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Unknown")
Docker Images:
$(docker images | grep topbudget || echo "No TopBudget images found")
EOF

    log "✅ Sauvegarde créée: $backup_path"
}

update_images() {
    if [[ "$UPDATE_IMAGES" == "false" ]]; then
        return 0
    fi

    progress "Mise à jour des images Docker..."

    case $ENVIRONMENT in
        production)
            info "Récupération des images de production..."
            docker pull ghcr.io/vincenttrahin/topbudget/backend:latest || warn "Impossible de récupérer l'image backend"
            docker pull ghcr.io/vincenttrahin/topbudget/frontend:latest || warn "Impossible de récupérer l'image frontend"
            ;;
        staging)
            info "Récupération des images de staging..."
            docker pull ghcr.io/vincenttrahin/topbudget/backend:develop || warn "Impossible de récupérer l'image backend develop"
            docker pull ghcr.io/vincenttrahin/topbudget/frontend:develop || warn "Impossible de récupérer l'image frontend develop"
            ;;
        dev)
            info "Construction des images de développement..."
            docker-compose -f "$PROJECT_DIR/docker-compose.yml" -f "$PROJECT_DIR/docker/docker-compose.dev.yml" build
            ;;
    esac

    log "✅ Images mises à jour"
}

deploy_environment() {
    progress "Déploiement de l'environnement $ENVIRONMENT..."

    cd "$PROJECT_DIR"

    # Arrêter les services existants
    info "Arrêt des services existants..."
    docker-compose -f docker-compose.yml -f "docker/docker-compose.$ENVIRONMENT.yml" down || warn "Aucun service à arrêter"

    # Nettoyer les ressources orphelines
    info "Nettoyage des ressources orphelines..."
    docker system prune -f

    # Démarrer les nouveaux services
    info "Démarrage des nouveaux services..."
    case $ENVIRONMENT in
        dev)
            docker-compose -f docker-compose.yml -f docker/docker-compose.dev.yml up -d
            ;;
        staging)
            docker-compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d
            ;;
        production)
            docker-compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d
            ;;
    esac

    # Attendre que les services démarrent
    info "Attente du démarrage des services (30s)..."
    sleep 30

    log "✅ Déploiement terminé"
}

run_health_checks() {
    if [[ "$RUN_HEALTH_CHECK" == "false" ]]; then
        info "Vérifications de santé désactivées"
        return 0
    fi

    progress "Exécution des vérifications de santé..."

    local backend_url="http://localhost:5001"
    local frontend_url="http://localhost:3000"
    local max_attempts=10
    local attempt=1

    # Vérifier le backend
    info "Vérification du backend..."
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "$backend_url/api/health/ready" > /dev/null 2>&1; then
            log "✅ Backend opérationnel"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "❌ Backend non accessible après $max_attempts tentatives"
        fi
        
        warn "Tentative $attempt/$max_attempts - Backend non prêt, nouvelle tentative dans 10s..."
        sleep 10
        ((attempt++))
    done

    # Vérifier le frontend
    info "Vérification du frontend..."
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "$frontend_url/api/health" > /dev/null 2>&1; then
            log "✅ Frontend opérationnel"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "❌ Frontend non accessible après $max_attempts tentatives"
        fi
        
        warn "Tentative $attempt/$max_attempts - Frontend non prêt, nouvelle tentative dans 10s..."
        sleep 10
        ((attempt++))
    done

    # Vérifier les logs pour les erreurs
    info "Vérification des logs récents..."
    local error_count=$(docker-compose logs --tail=50 | grep -i "error\|exception\|failed" | wc -l)
    if [[ $error_count -gt 0 ]]; then
        warn "⚠️  $error_count erreur(s) détectée(s) dans les logs récents"
        info "Utilisez 'docker-compose logs' pour plus de détails"
    else
        log "✅ Aucune erreur détectée dans les logs"
    fi

    # Afficher le statut des conteneurs
    info "Statut des conteneurs:"
    docker-compose ps

    log "✅ Vérifications de santé terminées"
}

perform_rollback() {
    if [[ -z "$ROLLBACK_TARGET" ]]; then
        return 0
    fi

    progress "Rollback vers $ROLLBACK_TARGET..."

    # Vérifier que le tag existe
    if ! git tag -l | grep -q "^$ROLLBACK_TARGET$"; then
        error "Tag '$ROLLBACK_TARGET' introuvable"
    fi

    # Checkout du tag
    info "Checkout vers $ROLLBACK_TARGET..."
    git checkout "$ROLLBACK_TARGET"

    # Utiliser les images correspondantes
    info "Mise à jour des images vers $ROLLBACK_TARGET..."
    docker pull "ghcr.io/vincenttrahin/topbudget/backend:$ROLLBACK_TARGET" || error "Image backend $ROLLBACK_TARGET introuvable"
    docker pull "ghcr.io/vincenttrahin/topbudget/frontend:$ROLLBACK_TARGET" || error "Image frontend $ROLLBACK_TARGET introuvable"

    log "✅ Rollback terminé vers $ROLLBACK_TARGET"
}

cleanup_old_resources() {
    progress "Nettoyage des anciennes ressources..."

    # Supprimer les images non utilisées de plus d'une semaine
    info "Suppression des images anciennes..."
    docker image prune -a -f --filter "until=168h" || warn "Échec du nettoyage des images"

    # Supprimer les volumes anonymes non utilisés
    info "Suppression des volumes non utilisés..."
    docker volume prune -f || warn "Échec du nettoyage des volumes"

    # Nettoyer les sauvegardes anciennes (> 30 jours)
    if [[ -d "$BACKUP_DIR" ]]; then
        info "Suppression des anciennes sauvegardes (> 30 jours)..."
        find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || warn "Échec du nettoyage des sauvegardes"
    fi

    log "✅ Nettoyage terminé"
}

generate_deployment_report() {
    progress "Génération du rapport de déploiement..."

    local report_file="$PROJECT_DIR/logs/deployment-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# 📋 Rapport de Déploiement TopBudget

## 📊 Informations Générales
- **Date**: $(date)
- **Environnement**: $ENVIRONMENT
- **Utilisateur**: $(whoami)
- **Serveur**: $(hostname)

## 🚀 Configuration Déployée
- **Git Commit**: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
- **Git Branch**: $(git branch --show-current 2>/dev/null || echo "Unknown")
- **Images Docker**:
$(docker images | grep topbudget | sed 's/^/  - /')

## 🐳 Statut des Conteneurs
\`\`\`
$(docker-compose ps)
\`\`\`

## 🔍 Health Checks
- **Backend**: $(curl -s http://localhost:5001/api/health/ready && echo "✅ OK" || echo "❌ FAILED")
- **Frontend**: $(curl -s http://localhost:3000/api/health && echo "✅ OK" || echo "❌ FAILED")

## 📊 Utilisation des Ressources
\`\`\`
$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}")
\`\`\`

## 🔗 URLs d'accès
- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health
- **API Documentation**: http://localhost:5001/api-docs

## 📝 Actions Effectuées
- [$([ "$CREATE_BACKUP" == "true" ] && echo "✅" || echo "⏭️")] Sauvegarde créée
- [$([ "$UPDATE_IMAGES" == "true" ] && echo "✅" || echo "⏭️")] Images mises à jour
- [$([ "$RUN_HEALTH_CHECK" == "true" ] && echo "✅" || echo "⏭️")] Health checks exécutés
- [$([ -n "$ROLLBACK_TARGET" ] && echo "✅" || echo "⏭️")] Rollback effectué

## 🔧 Commandes de Maintenance
\`\`\`bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart [backend|frontend|mongodb]

# Mise à jour des images
./scripts/deploy.sh $ENVIRONMENT --update-images

# Rollback
./scripts/deploy.sh $ENVIRONMENT --rollback [version]
\`\`\`

---
*Rapport généré automatiquement par le script de déploiement TopBudget*
EOF

    info "Rapport généré: $report_file"
    
    # Afficher un résumé à l'écran
    echo ""
    echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
    echo "=================================="
    echo "📍 Environnement: $ENVIRONMENT"
    echo "🔗 URLs d'accès:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - API: http://localhost:5001"
    echo "   - Health: http://localhost:5001/api/health"
    echo "📋 Rapport détaillé: $report_file"
    echo ""
}

# ============================================================================
# Script principal
# ============================================================================

main() {
    # Créer le dossier de logs
    mkdir -p "$(dirname "$LOG_FILE")"

    log "🚀 Démarrage du déploiement TopBudget"
    info "Environnement cible: $ENVIRONMENT"

    # Étapes du déploiement
    check_prerequisites
    perform_rollback
    create_backup
    update_images
    deploy_environment
    run_health_checks
    cleanup_old_resources
    generate_deployment_report

    log "🎉 Déploiement terminé avec succès!"
}

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi