#!/bin/bash

# ============================================================================
# TopBudget - Script de Versioning Automatique
# ============================================================================
# Usage: ./scripts/version.sh [action] [version_type]
# Actions: bump, tag, release, current, changelog
# Version types: patch, minor, major
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
ACTION=""
VERSION_TYPE=""
CUSTOM_VERSION=""
PUSH_TO_REMOTE=true
CREATE_RELEASE=false

# ============================================================================
# Fonctions utilitaires
# ============================================================================

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO: $1${NC}"
}

show_usage() {
    cat << EOF
📦 TopBudget - Script de Versioning Automatique

USAGE:
    ./scripts/version.sh [ACTION] [VERSION_TYPE] [OPTIONS]

ACTIONS:
    current             Affiche la version actuelle
    bump [type]         Incrémente la version (patch/minor/major)
    tag [version]       Crée un tag Git avec version personnalisée  
    release [type]      Bump + tag + release GitHub automatique
    changelog           Génère le changelog depuis le dernier tag

VERSION TYPES:
    patch               x.x.X (corrections de bugs)
    minor               x.X.x (nouvelles fonctionnalités)
    major               X.x.x (breaking changes)

OPTIONS:
    --no-push          Ne pas pousser vers le repository distant
    --github-release   Créer une release GitHub automatiquement
    --dry-run          Afficher les actions sans les exécuter
    -h, --help         Affiche cette aide

EXEMPLES:
    # Voir la version actuelle
    ./scripts/version.sh current

    # Incrémenter version patch (1.0.0 -> 1.0.1)
    ./scripts/version.sh bump patch

    # Incrémenter version mineure avec release GitHub
    ./scripts/version.sh release minor --github-release

    # Tag personnalisé
    ./scripts/version.sh tag 2.1.0

    # Générer le changelog
    ./scripts/version.sh changelog

WORKFLOW RECOMMANDÉ:
    1. Développez vos fonctionnalités
    2. Commitez tous vos changements
    3. Lancez: ./scripts/version.sh release [patch|minor|major]
    4. Le script gère automatiquement:
       - Incrémentation de version
       - Mise à jour package.json
       - Création du tag Git
       - Push vers GitHub
       - Création de la release (optionnel)

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            current|bump|tag|release|changelog)
                ACTION="$1"
                shift
                ;;
            patch|minor|major)
                VERSION_TYPE="$1"
                shift
                ;;
            --no-push)
                PUSH_TO_REMOTE=false
                shift
                ;;
            --github-release)
                CREATE_RELEASE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                if [[ "$ACTION" == "tag" && -z "$CUSTOM_VERSION" ]]; then
                    CUSTOM_VERSION="$1"
                else
                    error "Argument inconnu: $1"
                fi
                shift
                ;;
        esac
    done

    if [[ -z "$ACTION" ]]; then
        error "Action requise. Utilisez --help pour voir l'aide."
    fi
}

# ============================================================================
# Fonctions de versioning
# ============================================================================

get_current_version() {
    # Essayer de récupérer depuis package.json (backend)
    if [[ -f "$PROJECT_DIR/backend/package.json" ]]; then
        local backend_version=$(node -p "require('$PROJECT_DIR/backend/package.json').version" 2>/dev/null || echo "")
        if [[ -n "$backend_version" ]]; then
            echo "$backend_version"
            return 0
        fi
    fi

    # Essayer de récupérer depuis le dernier tag Git
    local git_version=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || echo "")
    if [[ -n "$git_version" ]]; then
        echo "$git_version"
        return 0
    fi

    # Version par défaut si rien trouvé
    echo "0.1.0"
}

increment_version() {
    local current_version="$1"
    local increment_type="$2"
    
    # Séparer les composants de version
    local major minor patch
    IFS='.' read -r major minor patch <<< "$current_version"
    
    case $increment_type in
        patch)
            patch=$((patch + 1))
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        *)
            error "Type de version invalide: $increment_type (utilisez: patch, minor, major)"
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

update_package_json() {
    local new_version="$1"
    
    # Mettre à jour backend/package.json
    if [[ -f "$PROJECT_DIR/backend/package.json" ]]; then
        info "Mise à jour backend/package.json vers $new_version"
        if command -v jq > /dev/null; then
            jq --arg version "$new_version" '.version = $version' "$PROJECT_DIR/backend/package.json" > "$PROJECT_DIR/backend/package.json.tmp"
            mv "$PROJECT_DIR/backend/package.json.tmp" "$PROJECT_DIR/backend/package.json"
        else
            # Fallback sans jq
            sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" "$PROJECT_DIR/backend/package.json"
            rm -f "$PROJECT_DIR/backend/package.json.bak"
        fi
    fi
    
    # Mettre à jour frontend/package.json
    if [[ -f "$PROJECT_DIR/frontend/package.json" ]]; then
        info "Mise à jour frontend/package.json vers $new_version"
        if command -v jq > /dev/null; then
            jq --arg version "$new_version" '.version = $version' "$PROJECT_DIR/frontend/package.json" > "$PROJECT_DIR/frontend/package.json.tmp"
            mv "$PROJECT_DIR/frontend/package.json.tmp" "$PROJECT_DIR/frontend/package.json"
        else
            # Fallback sans jq
            sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" "$PROJECT_DIR/frontend/package.json"
            rm -f "$PROJECT_DIR/frontend/package.json.bak"
        fi
    fi
}

generate_changelog() {
    local from_tag="${1:-}"
    local to_tag="${2:-HEAD}"
    
    if [[ -z "$from_tag" ]]; then
        # Récupérer le dernier tag
        from_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
        if [[ -z "$from_tag" ]]; then
            from_tag="$(git rev-list --max-parents=0 HEAD)"  # Premier commit
        fi
    fi
    
    info "Génération du changelog depuis $from_tag vers $to_tag"
    
    local changelog_file="$PROJECT_DIR/CHANGELOG.md"
    local temp_changelog="$PROJECT_DIR/CHANGELOG_temp.md"
    
    # En-tête du changelog
    cat > "$temp_changelog" << EOF
# 📋 Changelog TopBudget

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [$(get_current_version)] - $(date +%Y-%m-%d)

EOF
    
    # Nouvelles fonctionnalités
    local features=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="feat:" --grep="✨" 2>/dev/null || echo "")
    if [[ -n "$features" ]]; then
        echo "### ✨ Nouvelles Fonctionnalités" >> "$temp_changelog"
        echo "$features" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Corrections de bugs  
    local fixes=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="fix:" --grep="🐛" 2>/dev/null || echo "")
    if [[ -n "$fixes" ]]; then
        echo "### 🐛 Corrections de Bugs" >> "$temp_changelog"
        echo "$fixes" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Améliorations et refactoring
    local improvements=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="refactor:" --grep="perf:" --grep="♻️" --grep="⚡" 2>/dev/null || echo "")
    if [[ -n "$improvements" ]]; then
        echo "### 🔧 Améliorations" >> "$temp_changelog"
        echo "$improvements" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Documentation
    local docs=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="docs:" --grep="📝" 2>/dev/null || echo "")
    if [[ -n "$docs" ]]; then
        echo "### 📝 Documentation" >> "$temp_changelog"
        echo "$docs" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Tests
    local tests=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="test:" --grep="✅" 2>/dev/null || echo "")
    if [[ -n "$tests" ]]; then
        echo "### 🧪 Tests" >> "$temp_changelog"
        echo "$tests" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Configuration et maintenance
    local chores=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" --grep="chore:" --grep="🔧" 2>/dev/null || echo "")
    if [[ -n "$chores" ]]; then
        echo "### 🛠️ Maintenance" >> "$temp_changelog"
        echo "$chores" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Tous les autres changements significatifs
    local others=$(git log "$from_tag..$to_tag" --pretty=format:"- %s (%h)" \
        --invert-grep \
        --grep="feat:" --grep="fix:" --grep="docs:" --grep="test:" --grep="chore:" --grep="refactor:" --grep="perf:" \
        --grep="✨" --grep="🐛" --grep="📝" --grep="✅" --grep="🔧" --grep="♻️" --grep="⚡" \
        2>/dev/null | head -10 || echo "")
    if [[ -n "$others" ]]; then
        echo "### 📦 Autres Changements" >> "$temp_changelog"
        echo "$others" >> "$temp_changelog"
        echo "" >> "$temp_changelog"
    fi
    
    # Ajouter le changelog existant s'il existe
    if [[ -f "$changelog_file" ]]; then
        echo "" >> "$temp_changelog"
        tail -n +2 "$changelog_file" >> "$temp_changelog" 2>/dev/null || true
    fi
    
    mv "$temp_changelog" "$changelog_file"
    log "✅ Changelog généré: $changelog_file"
}

create_git_tag() {
    local version="$1"
    local tag_name="v$version"
    
    # Vérifier que le tag n'existe pas déjà
    if git tag -l | grep -q "^$tag_name$"; then
        error "Le tag $tag_name existe déjà"
    fi
    
    # Vérifier que le working directory est propre
    if ! git diff-index --quiet HEAD --; then
        error "Le working directory n'est pas propre. Commitez vos changements d'abord."
    fi
    
    info "Création du tag Git: $tag_name"
    
    # Créer le tag avec message
    git tag -a "$tag_name" -m "🚀 Release version $version

$(generate_changelog_summary)"
    
    log "✅ Tag $tag_name créé"
    
    # Pousser vers remote si demandé
    if [[ "$PUSH_TO_REMOTE" == "true" ]]; then
        info "Push du tag vers le repository distant..."
        git push origin "$tag_name"
        git push origin HEAD
        log "✅ Tag poussé vers le repository distant"
    fi
}

generate_changelog_summary() {
    local last_tag=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "")
    if [[ -n "$last_tag" ]]; then
        git log "$last_tag..HEAD" --oneline | head -5 | sed 's/^/- /'
    else
        git log --oneline | head -5 | sed 's/^/- /'
    fi
}

create_github_release() {
    local version="$1"
    local tag_name="v$version"
    
    if [[ "$CREATE_RELEASE" != "true" ]]; then
        return 0
    fi
    
    info "Déclenchement de la création de release GitHub..."
    
    # Le workflow GitHub Actions se chargera de créer la release
    # quand le tag sera poussé
    log "✅ La release GitHub sera créée automatiquement par GitHub Actions"
}

# ============================================================================
# Actions principales
# ============================================================================

action_current() {
    local current_version=$(get_current_version)
    echo "📦 Version actuelle: $current_version"
    
    # Informations additionnelles
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "Aucun tag")
    local commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    
    echo "🏷️  Dernier tag: $last_tag"
    echo "📊 Commits totaux: $commit_count"
    echo "🌿 Branche actuelle: $current_branch"
    
    if git status --porcelain | grep -q .; then
        echo "⚠️  Fichiers modifiés détectés"
    else
        echo "✅ Working directory propre"
    fi
}

action_bump() {
    if [[ -z "$VERSION_TYPE" ]]; then
        error "Type de version requis pour bump (patch, minor, major)"
    fi
    
    local current_version=$(get_current_version)
    local new_version=$(increment_version "$current_version" "$VERSION_TYPE")
    
    log "📦 Incrémentation de version: $current_version → $new_version"
    
    # Mettre à jour les package.json
    update_package_json "$new_version"
    
    # Committer les changements
    git add -A
    git commit -m "🔖 Bump version to $new_version" || warn "Aucun changement à committer"
    
    log "✅ Version mise à jour vers $new_version"
}

action_tag() {
    local version
    if [[ -n "$CUSTOM_VERSION" ]]; then
        version="$CUSTOM_VERSION"
    else
        version=$(get_current_version)
    fi
    
    create_git_tag "$version"
}

action_release() {
    if [[ -z "$VERSION_TYPE" ]]; then
        error "Type de version requis pour release (patch, minor, major)"
    fi
    
    log "🚀 Création d'une nouvelle release..."
    
    # Bump de version
    action_bump
    
    # Générer le changelog
    generate_changelog
    
    # Committer le changelog
    git add CHANGELOG.md
    git commit -m "📝 Update changelog for release" || warn "Changelog déjà à jour"
    
    local new_version=$(get_current_version)
    
    # Créer le tag
    create_git_tag "$new_version"
    
    # Créer la release GitHub si demandé
    create_github_release "$new_version"
    
    log "🎉 Release $new_version créée avec succès!"
    
    if [[ "$CREATE_RELEASE" == "true" ]]; then
        echo "📢 Une release GitHub sera créée automatiquement."
        echo "🔗 Surveillez: https://github.com/VincentTRAHIN/TopBudget/releases"
    fi
}

action_changelog() {
    generate_changelog
    echo "📋 Changelog généré. Consultez CHANGELOG.md"
}

# ============================================================================
# Script principal
# ============================================================================

main() {
    cd "$PROJECT_DIR"
    
    # Vérifier que nous sommes dans un repo Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Ce script doit être exécuté dans un repository Git"
    fi
    
    case $ACTION in
        current)
            action_current
            ;;
        bump)
            action_bump
            ;;
        tag)
            action_tag
            ;;
        release)
            action_release
            ;;
        changelog)
            action_changelog
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