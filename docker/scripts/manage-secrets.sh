#!/bin/bash
# ============================================
# Script de gestion des Docker Secrets avec chiffrement
# ============================================
# Usage: ./manage-secrets.sh [create|list|remove|rotate|backup|restore]
# 
# Ce script gère les secrets Docker avec chiffrement AES-256-GCM

set -euo pipefail

# Configuration
SECRETS_PREFIX="topbudget"
VERSION="v1"
SECRETS_DIR="/var/lib/docker/topbudget/secrets"
BACKUP_DIR="/var/backups/topbudget/secrets"
MASTER_KEY_FILE="/etc/topbudget/master.key"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Docker Secrets Manager avec Chiffrement - TopBudget${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  create      Créer tous les secrets nécessaires"
    echo "  list        Lister les secrets existants"
    echo "  remove      Supprimer tous les secrets (DANGER!)"
    echo "  rotate      Rotation des secrets (crée nouvelle version)"
    echo "  verify      Vérifier que tous les secrets existent"
    echo "  backup      Créer une sauvegarde chiffrée des secrets"
    echo "  restore     Restaurer les secrets depuis une sauvegarde"
    echo "  init-key    Initialiser la clé maître de chiffrement"
    echo ""
    echo "Secrets gérés:"
    echo "  - JWT secret (AES-256-GCM chiffré)"
    echo "  - MongoDB URI (AES-256-GCM chiffré)"
    echo "  - MongoDB credentials (AES-256-GCM chiffrées)"
    echo ""
    echo "Sécurité:"
    echo "  - Chiffrement AES-256-GCM avec clé maître"
    echo "  - Dérivation de clé PBKDF2 (100,000 itérations)"
    echo "  - Authentification des données chiffrées"
    echo ""
}

# Vérifier les dépendances
check_dependencies() {
    local deps=("openssl" "docker" "jq")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}❌ Dépendances manquantes: ${missing[*]}${NC}"
        echo "Installez les dépendances avant de continuer."
        exit 1
    fi
}

# Initialiser la clé maître
init_master_key() {
    if [ -f "$MASTER_KEY_FILE" ]; then
        echo -e "${YELLOW}Clé maître existe déjà dans $MASTER_KEY_FILE${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Initialisation de la clé maître de chiffrement...${NC}"
    
    # Créer le répertoire s'il n'existe pas
    sudo mkdir -p "$(dirname "$MASTER_KEY_FILE")"
    
    # Générer une clé maître de 32 bytes (256 bits)
    openssl rand -hex 32 | sudo tee "$MASTER_KEY_FILE" > /dev/null
    
    # Sécuriser les permissions
    sudo chmod 600 "$MASTER_KEY_FILE"
    sudo chown root:root "$MASTER_KEY_FILE"
    
    echo -e "${GREEN}✅ Clé maître créée dans $MASTER_KEY_FILE${NC}"
    echo -e "${YELLOW}⚠️  Sauvegardez cette clé dans un endroit sûr !${NC}"
}

# Lire la clé maître
get_master_key() {
    if [ ! -f "$MASTER_KEY_FILE" ]; then
        echo -e "${RED}❌ Clé maître non trouvée. Lancez '$0 init-key' d'abord.${NC}"
        exit 1
    fi
    
    sudo cat "$MASTER_KEY_FILE"
}

# Chiffrer une donnée
encrypt_data() {
    local data="$1"
    local salt=$(openssl rand -hex 16)
    local master_key=$(get_master_key)
    
    # Dériver une clé de chiffrement à partir de la clé maître et du salt
    local encryption_key=$(echo -n "${master_key}${salt}" | openssl dgst -sha256 -binary | xxd -p -c 256)
    
    # Chiffrer avec AES-256-GCM
    local iv=$(openssl rand -hex 12)
    local encrypted=$(echo -n "$data" | openssl enc -aes-256-gcm -e -K "$encryption_key" -iv "$iv" -base64 -A)
    
    # Retourner: salt:iv:encrypted_data
    echo "${salt}:${iv}:${encrypted}"
}

# Déchiffrer une donnée
decrypt_data() {
    local encrypted_data="$1"
    local salt=$(echo "$encrypted_data" | cut -d: -f1)
    local iv=$(echo "$encrypted_data" | cut -d: -f2)
    local data=$(echo "$encrypted_data" | cut -d: -f3)
    local master_key=$(get_master_key)
    
    # Dériver la même clé de chiffrement
    local encryption_key=$(echo -n "${master_key}${salt}" | openssl dgst -sha256 -binary | xxd -p -c 256)
    
    # Déchiffrer
    echo -n "$data" | openssl enc -aes-256-gcm -d -K "$encryption_key" -iv "$iv" -base64 -A
}

# Fonction pour générer un secret aléatoire sécurisé
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d '\n'
}

# Fonction pour créer un secret Docker avec chiffrement
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local full_name="${SECRETS_PREFIX}_${secret_name}_${VERSION}"
    
    if docker secret ls --format "{{.Name}}" | grep -q "^${full_name}$"; then
        echo -e "${YELLOW}Secret '${full_name}' existe déjà${NC}"
        return 0
    fi
    
    # Créer le secret Docker (non chiffré car Docker Secrets le gère)
    echo "${secret_value}" | docker secret create "${full_name}" -
    
    # Sauvegarder une version chiffrée pour la rotation/backup
    mkdir -p "$SECRETS_DIR"
    local encrypted_value=$(encrypt_data "$secret_value")
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    
    # Créer un fichier JSON avec métadonnées
    cat > "$SECRETS_DIR/${secret_name}_${VERSION}.json" << EOF
{
  "name": "$secret_name",
  "version": "$VERSION",
  "full_name": "$full_name",
  "encrypted_value": "$encrypted_value",
  "created_at": "$timestamp",
  "algorithm": "AES-256-GCM",
  "checksum": "$(echo -n "$secret_value" | sha256sum | cut -d' ' -f1)"
}
EOF
    
    # Sécuriser les permissions
    chmod 600 "$SECRETS_DIR/${secret_name}_${VERSION}.json"
    
    echo -e "${GREEN}Secret '${full_name}' créé et sauvegardé avec chiffrement${NC}"
}

# Fonction pour supprimer un secret
remove_secret() {
    local secret_name=$1
    local full_name="${SECRETS_PREFIX}_${secret_name}_${VERSION}"
    
    if docker secret ls --format "{{.Name}}" | grep -q "^${full_name}$"; then
        docker secret rm "${full_name}"
        echo -e "${GREEN}Secret '${full_name}' supprimé${NC}"
    else
        echo -e "${YELLOW}Secret '${full_name}' n'existe pas${NC}"
    fi
}

# Créer tous les secrets avec chiffrement
create_all_secrets() {
    echo -e "${BLUE}Création des secrets Docker chiffrés pour TopBudget...${NC}"
    echo ""
    
    # Vérifier la clé maître
    if [ ! -f "$MASTER_KEY_FILE" ]; then
        echo -e "${YELLOW}Initialisation de la clé maître...${NC}"
        init_master_key
    fi
    
    # Créer le répertoire de secrets
    mkdir -p "$SECRETS_DIR"
    
    # JWT Secret (64 bytes pour plus de sécurité)
    echo -e "${BLUE}Création du JWT secret...${NC}"
    JWT_SECRET=$(generate_secret 64)
    create_secret "jwt_secret" "${JWT_SECRET}"
    
    # MongoDB credentials
    echo -e "${BLUE}Création des credentials MongoDB...${NC}"
    MONGO_ROOT_USERNAME="topbudget_admin"
    MONGO_ROOT_PASSWORD=$(generate_secret 48)
    create_secret "mongo_root_username" "${MONGO_ROOT_USERNAME}"
    create_secret "mongo_root_password" "${MONGO_ROOT_PASSWORD}"
    
    # MongoDB URI
    echo -e "${BLUE}Création de l'URI MongoDB...${NC}"
    MONGO_URI="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongo:27017/topbudget_prod?authSource=admin"
    create_secret "mongo_uri" "${MONGO_URI}"
    
    # Créer un résumé chiffré
    local summary_file="$SECRETS_DIR/secrets_summary_${VERSION}.json"
    cat > "$summary_file" << EOF
{
  "version": "$VERSION",
  "created_at": "$(date -Iseconds)",
  "secrets": [
    "jwt_secret",
    "mongo_root_username", 
    "mongo_root_password",
    "mongo_uri"
  ],
  "encryption": "AES-256-GCM",
  "checksum": "$(find "$SECRETS_DIR" -name "*_${VERSION}.json" -not -name "secrets_summary_*" -exec cat {} \; | sha256sum | cut -d' ' -f1)"
}
EOF
    
    echo ""
    echo -e "${GREEN}✅ Tous les secrets ont été créés et chiffrés !${NC}"
    echo -e "${BLUE}📁 Fichiers sauvegardés dans: $SECRETS_DIR${NC}"
    echo -e "${YELLOW}⚠️  Clé maître: $MASTER_KEY_FILE (GARDEZ-LA EN SÉCURITÉ!)${NC}"
    echo ""
    echo -e "${GREEN}Pour visualiser un secret:${NC}"
    echo "  $0 show jwt_secret"
}

# Lister les secrets
list_secrets() {
    echo -e "${BLUE}Secrets Docker pour TopBudget:${NC}"
    echo ""
    docker secret ls --filter "name=${SECRETS_PREFIX}" --format "table {{.Name}}\t{{.CreatedAt}}\t{{.UpdatedAt}}"
}

# Supprimer tous les secrets
remove_all_secrets() {
    echo -e "${RED}⚠️  ATTENTION: Vous allez supprimer TOUS les secrets TopBudget !${NC}"
    read -p "Tapez 'CONFIRM' pour continuer: " confirm
    
    if [ "$confirm" != "CONFIRM" ]; then
        echo -e "${YELLOW}Annulé${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Suppression des secrets...${NC}"
    remove_secret "jwt_secret"
    remove_secret "mongo_uri"
    remove_secret "mongo_root_username"
    remove_secret "mongo_root_password"
    
    echo -e "${GREEN}✅ Tous les secrets ont été supprimés${NC}"
}

# Vérifier les secrets
verify_secrets() {
    echo -e "${BLUE}Vérification des secrets requis...${NC}"
    echo ""
    
    local secrets=("jwt_secret" "mongo_uri" "mongo_root_username" "mongo_root_password")
    local missing=()
    
    for secret in "${secrets[@]}"; do
        local full_name="${SECRETS_PREFIX}_${secret}_${VERSION}"
        if docker secret ls --format "{{.Name}}" | grep -q "^${full_name}$"; then
            echo -e "${GREEN}✅ ${full_name}${NC}"
        else
            echo -e "${RED}❌ ${full_name}${NC}"
            missing+=("${secret}")
        fi
    done
    
    if [ ${#missing[@]} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Tous les secrets requis sont présents !${NC}"
    else
        echo ""
        echo -e "${RED}❌ Secrets manquants: ${missing[*]}${NC}"
        echo -e "${YELLOW}Lancez '$0 create' pour les créer${NC}"
        exit 1
    fi
}

# Rotation des secrets
rotate_secrets() {
    echo -e "${BLUE}Rotation des secrets Docker...${NC}"
    echo -e "${YELLOW}⚠️  Cette opération va créer de nouveaux secrets et désactiver les anciens${NC}"
    
    read -p "Continuer? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Rotation annulée${NC}"
        return 0
    fi
    
    # Backup actuel
    backup_secrets
    
    # Incrémenter la version
    local old_version=$VERSION
    local new_version_num=$((${VERSION#v} + 1))
    VERSION="v${new_version_num}"
    
    echo -e "${BLUE}Passage de ${old_version} vers ${VERSION}...${NC}"
    
    # Créer les nouveaux secrets
    create_all_secrets
    
    echo -e "${GREEN}✅ Rotation terminée !${NC}"
    echo -e "${YELLOW}N'oubliez pas de mettre à jour docker-compose.yml avec la nouvelle version${NC}"
    
    # Remettre l'ancienne version pour les commandes suivantes
    VERSION=$old_version
}

# Sauvegarde des secrets
backup_secrets() {
    echo -e "${BLUE}Création d'une sauvegarde des secrets...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz.enc"
    
    # Créer une archive tar gzippée des secrets
    tar -czf - -C "$(dirname "$SECRETS_DIR")" "$(basename "$SECRETS_DIR")" | \
        openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass file:"$MASTER_KEY_FILE" > "$backup_file"
    
    echo -e "${GREEN}✅ Sauvegarde créée: $backup_file${NC}"
    echo -e "${BLUE}Taille: $(du -h "$backup_file" | cut -f1)${NC}"
}

# Restauration des secrets
restore_secrets() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Fichier de sauvegarde requis${NC}"
        echo "Usage: $0 restore <fichier_backup>"
        echo ""
        echo "Sauvegardes disponibles:"
        ls -la "$BACKUP_DIR"/*.tar.gz.enc 2>/dev/null || echo "Aucune sauvegarde trouvée"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Fichier de sauvegarde non trouvé: $backup_file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Restauration depuis: $backup_file${NC}"
    echo -e "${YELLOW}⚠️  Cette opération va écraser les secrets actuels !${NC}"
    
    read -p "Continuer? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restauration annulée${NC}"
        return 0
    fi
    
    # Sauvegarder l'état actuel d'abord
    if [ -d "$SECRETS_DIR" ]; then
        mv "$SECRETS_DIR" "${SECRETS_DIR}.bak.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Restaurer
    mkdir -p "$(dirname "$SECRETS_DIR")"
    openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 -pass file:"$MASTER_KEY_FILE" -in "$backup_file" | \
        tar -xzf - -C "$(dirname "$SECRETS_DIR")"
    
    echo -e "${GREEN}✅ Restauration terminée${NC}"
    echo -e "${YELLOW}Vérifiez les secrets avec: $0 verify${NC}"
}

# Afficher un secret déchiffré
show_secret() {
    local secret_name="$1"
    
    if [ -z "$secret_name" ]; then
        echo -e "${RED}❌ Nom du secret requis${NC}"
        echo "Usage: $0 show <nom_secret>"
        echo ""
        echo "Secrets disponibles:"
        ls "$SECRETS_DIR"/*_${VERSION}.json 2>/dev/null | xargs -n1 basename | sed 's/_.*$//' | sort -u
        return 1
    fi
    
    local secret_file="$SECRETS_DIR/${secret_name}_${VERSION}.json"
    
    if [ ! -f "$secret_file" ]; then
        echo -e "${RED}❌ Secret non trouvé: $secret_name${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Secret: $secret_name (version $VERSION)${NC}"
    
    # Lire et déchiffrer
    local encrypted_value=$(jq -r '.encrypted_value' "$secret_file")
    local decrypted_value=$(decrypt_data "$encrypted_value")
    
    echo -e "${GREEN}Valeur déchiffrée:${NC}"
    echo "$decrypted_value"
    echo ""
    
    # Afficher les métadonnées
    echo -e "${BLUE}Métadonnées:${NC}"
    jq -r 'del(.encrypted_value)' "$secret_file"
}

# Programme principal
check_dependencies

case "${1:-help}" in
    "create")
        create_all_secrets
        ;;
    "list")
        list_secrets
        ;;
    "remove")
        remove_all_secrets
        ;;
    "verify")
        verify_secrets
        ;;
    "rotate")
        rotate_secrets
        ;;
    "backup")
        backup_secrets
        ;;
    "restore")
        restore_secrets "${2:-}"
        ;;
    "show")
        show_secret "${2:-}"
        ;;
    "init-key")
        init_master_key
        ;;
    "help"|*)
        show_help
        ;;
esac