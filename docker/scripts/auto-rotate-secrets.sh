#!/bin/bash
# ============================================
# Script de rotation automatique des secrets
# ============================================
# Usage: ./auto-rotate-secrets.sh [dry-run|force]
# 
# Ce script automatise la rotation des secrets selon une politique définie

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGE_SECRETS_SCRIPT="$SCRIPT_DIR/manage-secrets.sh"
LOG_FILE="/var/log/topbudget/secret-rotation.log"
LOCK_FILE="/var/run/topbudget-rotation.lock"

# Politique de rotation (en jours)
JWT_SECRET_ROTATION_DAYS=90
MONGO_PASSWORD_ROTATION_DAYS=30
NOTIFICATION_DAYS=7

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Rotation Automatique des Secrets - TopBudget${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check       Vérifier l'âge des secrets et les prochaines rotations"
    echo "  dry-run     Simulation de rotation (sans changements)"
    echo "  force       Forcer la rotation immédiate de tous les secrets"
    echo "  schedule    Configurer les tâches cron pour la rotation automatique"
    echo "  status      Afficher le statut de la rotation automatique"
    echo ""
    echo "Politique de rotation:"
    echo "  - JWT Secret: $JWT_SECRET_ROTATION_DAYS jours"
    echo "  - Mot de passe MongoDB: $MONGO_PASSWORD_ROTATION_DAYS jours"
    echo "  - Notification: $NOTIFICATION_DAYS jours avant expiration"
    echo ""
}

# Vérifier les prérequis
check_prerequisites() {
    if [ ! -f "$MANAGE_SECRETS_SCRIPT" ]; then
        log "ERROR" "Script manage-secrets.sh non trouvé: $MANAGE_SECRETS_SCRIPT"
        exit 1
    fi
    
    if [ ! -x "$MANAGE_SECRETS_SCRIPT" ]; then
        chmod +x "$MANAGE_SECRETS_SCRIPT"
        log "INFO" "Permissions d'exécution ajoutées à $MANAGE_SECRETS_SCRIPT"
    fi
    
    # Créer le répertoire de logs
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Obtenir l'âge d'un secret en jours
get_secret_age() {
    local secret_name="$1"
    local version="${2:-v1}"
    local secrets_dir="/var/lib/docker/topbudget/secrets"
    local secret_file="$secrets_dir/${secret_name}_${version}.json"
    
    if [ ! -f "$secret_file" ]; then
        echo "-1"
        return
    fi
    
    local created_at=$(jq -r '.created_at' "$secret_file" 2>/dev/null)
    if [ "$created_at" = "null" ] || [ -z "$created_at" ]; then
        echo "-1"
        return
    fi
    
    # Convertir la date en timestamp
    local created_timestamp=$(date -d "$created_at" +%s 2>/dev/null || echo "0")
    local current_timestamp=$(date +%s)
    
    if [ "$created_timestamp" = "0" ]; then
        echo "-1"
        return
    fi
    
    # Calculer la différence en jours
    local age_seconds=$((current_timestamp - created_timestamp))
    local age_days=$((age_seconds / 86400))
    
    echo "$age_days"
}

# Vérifier si un secret nécessite une rotation
needs_rotation() {
    local secret_name="$1"
    local max_age="$2"
    local version="${3:-v1}"
    
    local age=$(get_secret_age "$secret_name" "$version")
    
    if [ "$age" -eq -1 ]; then
        log "WARN" "Impossible de déterminer l'âge du secret: $secret_name"
        return 1
    fi
    
    if [ "$age" -ge "$max_age" ]; then
        return 0  # Nécessite rotation
    else
        return 1  # Pas besoin de rotation
    fi
}

# Envoyer une notification (placeholder pour intégration future)
send_notification() {
    local level="$1"
    local subject="$2"
    local message="$3"
    
    log "$level" "NOTIFICATION: $subject - $message"
    
    # TODO: Intégrer avec un système de notification (email, Slack, etc.)
    # if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"[$level] $subject: $message\"}" \
    #         "$SLACK_WEBHOOK_URL"
    # fi
}

# Vérifier l'état des secrets
check_secrets_status() {
    echo -e "${BLUE}État des secrets TopBudget:${NC}"
    echo ""
    
    local secrets=("jwt_secret:$JWT_SECRET_ROTATION_DAYS" "mongo_root_password:$MONGO_PASSWORD_ROTATION_DAYS")
    local rotation_needed=false
    local notifications_needed=false
    
    for secret_info in "${secrets[@]}"; do
        local secret_name=$(echo "$secret_info" | cut -d: -f1)
        local max_age=$(echo "$secret_info" | cut -d: -f2)
        local age=$(get_secret_age "$secret_name")
        
        if [ "$age" -eq -1 ]; then
            echo -e "${RED}❌ $secret_name: Âge indéterminable${NC}"
            continue
        fi
        
        local days_until_rotation=$((max_age - age))
        
        if [ "$age" -ge "$max_age" ]; then
            echo -e "${RED}🔄 $secret_name: ROTATION REQUISE (âge: $age jours, max: $max_age)${NC}"
            rotation_needed=true
        elif [ "$days_until_rotation" -le "$NOTIFICATION_DAYS" ]; then
            echo -e "${YELLOW}⚠️  $secret_name: Rotation dans $days_until_rotation jours (âge: $age jours)${NC}"
            notifications_needed=true
        else
            echo -e "${GREEN}✅ $secret_name: OK (âge: $age jours, rotation dans $days_until_rotation jours)${NC}"
        fi
    done
    
    echo ""
    
    if [ "$rotation_needed" = true ]; then
        echo -e "${RED}🚨 Certains secrets nécessitent une rotation immédiate !${NC}"
        send_notification "CRITICAL" "Rotation des secrets requise" "Des secrets ont dépassé leur durée de vie maximale"
    elif [ "$notifications_needed" = true ]; then
        echo -e "${YELLOW}📢 Certains secrets arriveront bientôt à expiration${NC}"
        send_notification "WARNING" "Rotation des secrets prochainement" "Des secrets nécessiteront une rotation sous peu"
    else
        echo -e "${GREEN}✅ Tous les secrets sont dans leurs délais${NC}"
    fi
}

# Effectuer la rotation automatique
perform_rotation() {
    local dry_run="${1:-false}"
    
    if [ "$dry_run" = true ]; then
        log "INFO" "=== MODE DRY-RUN: Aucun changement ne sera effectué ==="
    fi
    
    log "INFO" "Début de la rotation automatique des secrets"
    
    # Acquérir le verrou
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log "ERROR" "Rotation déjà en cours (PID: $lock_pid)"
            exit 1
        else
            log "WARN" "Suppression d'un verrou obsolète"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    if [ "$dry_run" != true ]; then
        echo $$ > "$LOCK_FILE"
        trap 'rm -f "$LOCK_FILE"' EXIT
    fi
    
    local rotation_performed=false
    
    # Vérifier chaque secret
    if needs_rotation "jwt_secret" "$JWT_SECRET_ROTATION_DAYS"; then
        log "INFO" "Rotation du JWT secret nécessaire"
        if [ "$dry_run" = true ]; then
            echo -e "${YELLOW}[DRY-RUN] Rotation du JWT secret${NC}"
        else
            send_notification "INFO" "Rotation JWT" "Début de la rotation du JWT secret"
            if "$MANAGE_SECRETS_SCRIPT" rotate; then
                log "SUCCESS" "JWT secret rotationné avec succès"
                rotation_performed=true
            else
                log "ERROR" "Échec de la rotation du JWT secret"
                send_notification "ERROR" "Échec rotation JWT" "La rotation du JWT secret a échoué"
            fi
        fi
    fi
    
    if needs_rotation "mongo_root_password" "$MONGO_PASSWORD_ROTATION_DAYS"; then
        log "INFO" "Rotation du mot de passe MongoDB nécessaire"
        if [ "$dry_run" = true ]; then
            echo -e "${YELLOW}[DRY-RUN] Rotation du mot de passe MongoDB${NC}"
        else
            # Note: La rotation MongoDB nécessite une coordination avec la base
            log "WARN" "Rotation MongoDB détectée mais nécessite intervention manuelle"
            send_notification "WARNING" "Rotation MongoDB" "Le mot de passe MongoDB nécessite une rotation manuelle"
        fi
    fi
    
    if [ "$rotation_performed" = true ] && [ "$dry_run" != true ]; then
        log "SUCCESS" "Rotation automatique terminée avec succès"
        send_notification "SUCCESS" "Rotation terminée" "La rotation automatique des secrets est terminée"
        
        # Redémarrer les services si nécessaire
        log "INFO" "Redémarrage des services Docker..."
        if docker compose -f docker-compose.prod.yml restart; then
            log "SUCCESS" "Services redémarrés avec succès"
        else
            log "ERROR" "Échec du redémarrage des services"
            send_notification "ERROR" "Redémarrage échoué" "Le redémarrage des services après rotation a échoué"
        fi
    fi
    
    log "INFO" "Fin de la rotation automatique"
}

# Configurer les tâches cron
setup_cron() {
    echo -e "${BLUE}Configuration de la rotation automatique...${NC}"
    
    local cron_script="/etc/cron.d/topbudget-secrets"
    
    cat > "$cron_script" << EOF
# Rotation automatique des secrets TopBudget
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Vérification quotidienne à 2h du matin
0 2 * * * root $SCRIPT_DIR/$(basename "$0") check

# Rotation automatique le dimanche à 3h du matin
0 3 * * 0 root $SCRIPT_DIR/$(basename "$0") rotate

# Vérification de l'état toutes les 6 heures
0 */6 * * * root $SCRIPT_DIR/$(basename "$0") status >> $LOG_FILE 2>&1
EOF
    
    chmod 644 "$cron_script"
    
    echo -e "${GREEN}✅ Tâches cron configurées dans $cron_script${NC}"
    echo ""
    echo -e "${BLUE}Planification:${NC}"
    echo "- Vérification quotidienne: 2h00"
    echo "- Rotation automatique: Dimanche 3h00"  
    echo "- Monitoring: Toutes les 6h"
    echo ""
    echo -e "${YELLOW}Redémarrez le service cron pour prendre en compte les changements:${NC}"
    echo "  sudo systemctl restart cron"
}

# Programme principal
check_prerequisites

case "${1:-help}" in
    "check")
        check_secrets_status
        ;;
    "dry-run")
        perform_rotation true
        ;;
    "rotate"|"force")
        perform_rotation false
        ;;
    "schedule")
        setup_cron
        ;;
    "status")
        echo "=== Status de la rotation automatique ==="
        check_secrets_status
        echo ""
        echo "=== Dernières rotations ==="
        tail -n 20 "$LOG_FILE" 2>/dev/null || echo "Aucun log disponible"
        ;;
    "help"|*)
        show_help
        ;;
esac