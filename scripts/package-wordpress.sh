#!/usr/bin/env bash
# =============================================================================
# Mademo Studio — Packaging WordPress
#
# Produit deux ZIPs installables directement dans WordPress :
#   releases/mademo-theme-{version}.zip   → Apparence → Thèmes → Téléverser
#   releases/mademo-plugin-{version}.zip  → Extensions → Téléverser une extension
#
# Usage :
#   ./scripts/package-wordpress.sh           # build + package
#   ./scripts/package-wordpress.sh --no-build  # package sans rebuilder
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RELEASE_DIR="${ROOT_DIR}/releases"

THEME_DIR="${ROOT_DIR}/wordpress/theme/mademo"
PLUGIN_DIR="${ROOT_DIR}/wordpress/plugin/mademo-studio"

# Lire la version depuis style.css du thème
VERSION=$(grep -m1 "^Version:" "${THEME_DIR}/style.css" | awk '{print $2}' | tr -d '[:space:]')
if [[ -z "${VERSION}" ]]; then
  VERSION="dev"
fi

# ── Couleurs ──────────────────────────────────────────────────────────────────

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
BOLD="\033[1m"
RESET="\033[0m"

info()    { echo -e "${BLUE}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ── Arguments ─────────────────────────────────────────────────────────────────

BUILD=true
for arg in "$@"; do
  case $arg in
    --no-build) BUILD=false ;;
    --help|-h)
      echo "Usage: $0 [--no-build]"
      echo ""
      echo "  --no-build   Saute l'étape de build Vite (utilise le dist/ existant)"
      exit 0
      ;;
    *)
      error "Argument inconnu : $arg"
      exit 1
      ;;
  esac
done

# ── Vérifications préalables ──────────────────────────────────────────────────

header "Mademo Studio — Packaging v${VERSION}"

cd "${ROOT_DIR}"

if ! command -v zip &>/dev/null; then
  error "La commande 'zip' est introuvable. Installez-la (ex: apt install zip / brew install zip)."
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  error "pnpm introuvable. Installez-le : npm i -g pnpm"
  exit 1
fi

# ── Étape 1 : Build React ─────────────────────────────────────────────────────

if [[ "${BUILD}" == "true" ]]; then
  header "1/4  Build React (cible WordPress)"
  info "Exécution : BUILD_TARGET=wordpress pnpm build"
  BUILD_TARGET=wordpress pnpm build
  success "Build terminé → wordpress/theme/mademo/dist/"
else
  header "1/4  Build ignoré (--no-build)"
  if [[ ! -d "${THEME_DIR}/dist" ]]; then
    error "Dossier dist/ introuvable. Lancez sans --no-build pour builder d'abord."
    exit 1
  fi
  warn "Utilisation du dist/ existant : ${THEME_DIR}/dist"
fi

# Vérifier que le dist/ est présent et non vide
MANIFEST="${THEME_DIR}/dist/.vite/manifest.json"
if [[ ! -f "${MANIFEST}" ]]; then
  error "Manifest Vite introuvable : ${MANIFEST}"
  error "Le build semble incomplet. Relancez sans --no-build."
  exit 1
fi
pnpm verify:wp
success "Manifest Vite et assets validés."

# ── Étape 2 : Préparer le dossier releases/ ───────────────────────────────────

header "2/4  Préparation du dossier releases/"
mkdir -p "${RELEASE_DIR}"
success "Dossier : ${RELEASE_DIR}"

THEME_ZIP="${RELEASE_DIR}/mademo-theme-${VERSION}.zip"
PLUGIN_ZIP="${RELEASE_DIR}/mademo-plugin-${VERSION}.zip"

# Supprimer les anciens ZIPs de la même version
rm -f "${THEME_ZIP}" "${PLUGIN_ZIP}"

# ── Étape 3 : ZIP du thème ────────────────────────────────────────────────────

header "3/4  Packaging du thème"
info "Source : wordpress/theme/mademo/"
info "Cible  : releases/mademo-theme-${VERSION}.zip"

(
  cd "${ROOT_DIR}/wordpress/theme"
  zip -r "${THEME_ZIP}" mademo/ \
    --exclude "mademo/.DS_Store" \
    --exclude "mademo/Thumbs.db" \
    --exclude "mademo/**/.DS_Store"
)

THEME_SIZE=$(du -sh "${THEME_ZIP}" | cut -f1)
success "Thème packagé : ${THEME_SIZE}"

# Contenu du ZIP thème
echo ""
info "Contenu du thème :"
unzip -l "${THEME_ZIP}" | grep -E "\.(php|css|js|json|woff2?|svg|webp|png|jpg)$" \
  | awk '{print "    " $4}' | head -30
TOTAL=$(unzip -l "${THEME_ZIP}" | tail -1 | awk '{print $2}')
echo "    … (${TOTAL} fichiers au total)"

# ── Étape 4 : ZIP du plugin ───────────────────────────────────────────────────

header "4/4  Packaging du plugin"
info "Source : wordpress/plugin/mademo-studio/"
info "Cible  : releases/mademo-plugin-${VERSION}.zip"

(
  cd "${ROOT_DIR}/wordpress/plugin"
  zip -r "${PLUGIN_ZIP}" mademo-studio/ \
    --exclude "mademo-studio/.DS_Store" \
    --exclude "mademo-studio/Thumbs.db" \
    --exclude "mademo-studio/**/.DS_Store"
)

PLUGIN_SIZE=$(du -sh "${PLUGIN_ZIP}" | cut -f1)
success "Plugin packagé : ${PLUGIN_SIZE}"

# ── Résumé ────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  Packages prêts — Mademo Studio v${VERSION}${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Thème${RESET}  (${THEME_SIZE})"
echo -e "  ${BLUE}releases/mademo-theme-${VERSION}.zip${RESET}"
echo -e "  WordPress → Apparence → Thèmes → Téléverser"
echo ""
echo -e "  ${BOLD}Plugin${RESET} (${PLUGIN_SIZE})"
echo -e "  ${BLUE}releases/mademo-plugin-${VERSION}.zip${RESET}"
echo -e "  WordPress → Extensions → Téléverser une extension"
echo ""
echo -e "  ${BOLD}Ordre d'installation${RESET}"
echo -e "  1. Plugin (mademo-plugin-${VERSION}.zip)"
echo -e "  2. Thème  (mademo-theme-${VERSION}.zip)"
echo -e "  3. Activer le thème Mademo Studio"
echo -e "  4. Vérifier que le plugin Mademo Studio est activé"
echo ""
echo -e "  ${YELLOW}Rappel .htaccess${RESET}"
echo -e "  Copier wordpress/theme/mademo/.htaccess"
echo -e "  à la racine WordPress (/public_html/ ou /www/)."
echo ""
