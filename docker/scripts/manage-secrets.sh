#!/bin/bash
# ============================================
# Script de gestion des Docker Secrets
# ============================================
# Usage: ./manage-secrets.sh [create|list|remove|rotate]
# 
# Ce script gère les secrets Docker pour l'environnement de production

set -euo pipefail

# Configuration
SECRETS_PREFIX="topbudget"
VERSION="v1"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Docker Secrets Manager pour TopBudget${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  create    Créer tous les secrets nécessaires"
    echo "  list      Lister les secrets existants"
    echo "  remove    Supprimer tous les secrets (DANGER!)"
    echo "  rotate    Rotation des secrets (crée nouvelle version)"
    echo "  verify    Vérifier que tous les secrets existent"
    echo ""
    echo "Secrets gérés:"
    echo "  - JWT secret"
    echo "  - MongoDB URI"
    echo "  - MongoDB root username/password"
    echo ""
}

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -base64 32
}

# Fonction pour créer un secret Docker
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local full_name="${SECRETS_PREFIX}_${secret_name}_${VERSION}"
    
    if docker secret ls --format "{{.Name}}" | grep -q "^${full_name}$"; then
        echo -e "${YELLOW}Secret '${full_name}' existe déjà${NC}"
        return 0
    fi
    
    echo "${secret_value}" | docker secret create "${full_name}" -
    echo -e "${GREEN}Secret '${full_name}' créé avec succès${NC}"
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

# Créer tous les secrets
create_all_secrets() {
    echo -e "${BLUE}Création des secrets Docker pour TopBudget...${NC}"
    echo ""
    
    # JWT Secret
    echo -e "${BLUE}Création du JWT secret...${NC}"
    JWT_SECRET=$(generate_secret)
    create_secret "jwt_secret" "${JWT_SECRET}"
    
    # MongoDB credentials
    echo -e "${BLUE}Création des credentials MongoDB...${NC}"
    MONGO_ROOT_USERNAME="topbudget_admin"
    MONGO_ROOT_PASSWORD=$(generate_secret)
    create_secret "mongo_root_username" "${MONGO_ROOT_USERNAME}"
    create_secret "mongo_root_password" "${MONGO_ROOT_PASSWORD}"
    
    # MongoDB URI
    echo -e "${BLUE}Création de l'URI MongoDB...${NC}"
    MONGO_URI="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongo:27017/topbudget_prod?authSource=admin"
    create_secret "mongo_uri" "${MONGO_URI}"
    
    echo ""
    echo -e "${GREEN}✅ Tous les secrets ont été créés !${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Sauvegardez ces informations dans un endroit sûr:${NC}"
    echo "- JWT Secret: ${JWT_SECRET}"
    echo "- MongoDB Username: ${MONGO_ROOT_USERNAME}"
    echo "- MongoDB Password: ${MONGO_ROOT_PASSWORD}"
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

# Programme principal
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
        echo -e "${YELLOW}Rotation des secrets pas encore implémentée${NC}"
        echo "TODO: Créer une nouvelle version des secrets"
        ;;
    "help"|*)
        show_help
        ;;
esac