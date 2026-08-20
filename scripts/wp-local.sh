#!/usr/bin/env bash
# Installation et déploiement local reproductibles pour Mademo Studio.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
ACTION="${1:-setup}"

info()    { printf '\033[0;34m→\033[0m %s\n' "$*"; }
success() { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
warn()    { printf '\033[1;33m⚠\033[0m %s\n' "$*"; }
error()   { printf '\033[0;31m✗\033[0m %s\n' "$*" >&2; }
die()     { error "$*"; exit 1; }

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

case "${ACTION}" in
  setup|deploy|plugin|theme|check) ;;
  *) die "Action inconnue : ${ACTION}. Utilisez setup, deploy, plugin, theme ou check." ;;
esac

DEFAULT_WP_ROOT="/Users/${USER:-mademo}/Library/Application Support/Local/sites/mademo-studio/app/public"
WP_ROOT="${MADEMO_WP_ROOT:-${DEFAULT_WP_ROOT}}"
WP_URL="${MADEMO_WP_URL:-}"
WP_CLI="${MADEMO_WP_CLI:-wp}"
SKIP_HTTP_CHECK="${MADEMO_SKIP_HTTP_CHECK:-0}"

THEME_SOURCE="${ROOT_DIR}/wordpress/theme/mademo"
PLUGIN_SOURCE="${ROOT_DIR}/wordpress/plugin/mademo-studio"

validate_environment() {
  command -v rsync >/dev/null 2>&1 || die "rsync est requis. Sur macOS : brew install rsync"
  command -v node >/dev/null 2>&1 || die "Node.js est introuvable."

  [[ -d "${WP_ROOT}" ]] || die "WordPress local introuvable : ${WP_ROOT}. Copiez .env.example vers .env.local."
  WP_ROOT="$(cd "${WP_ROOT}" && pwd -P)"
  [[ "${WP_ROOT}" != "/" ]] || die "MADEMO_WP_ROOT ne peut pas viser la racine du disque."
  [[ -f "${WP_ROOT}/wp-load.php" ]] || die "wp-load.php est absent de ${WP_ROOT}."
  [[ -d "${WP_ROOT}/wp-content/themes" ]] || die "Dossier themes WordPress introuvable."
  [[ -d "${WP_ROOT}/wp-content/plugins" ]] || die "Dossier plugins WordPress introuvable."

  THEME_DEST="${WP_ROOT}/wp-content/themes/mademo"
  PLUGIN_DEST="${WP_ROOT}/wp-content/plugins/mademo-studio"
  BACKUP_ROOT="${WP_ROOT}/wp-content/mademo-local-backups"
}

validate_manifest() {
  local theme_dir="$1"
  local manifest="${theme_dir}/dist/.vite/manifest.json"

  if [[ ! -f "${manifest}" ]]; then
    error "Manifest Vite absent : ${manifest}"
    return 1
  fi
  if ! node - "${theme_dir}" "${manifest}" <<'NODE'
const fs = require('fs');
const path = require('path');
const themeDir = process.argv[2];
const manifestPath = process.argv[3];
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entry = manifest['index.html'] || manifest['src/main.tsx'];
if (!entry || !entry.file) throw new Error('Entrée Vite index.html/src/main.tsx absente');
const files = [entry.file, ...(entry.css || [])];
for (const file of files) {
  const absolute = path.join(themeDir, 'dist', file);
  if (!fs.existsSync(absolute)) throw new Error(`Asset référencé mais absent : ${file}`);
}
NODE
  then
    error "Le manifeste Vite ou ses assets sont invalides."
    return 1
  fi
}

wp_cli_available() {
  command -v "${WP_CLI}" >/dev/null 2>&1
}

run_wp() {
  "${WP_CLI}" --path="${WP_ROOT}" "$@"
}

copy_component() {
  local label="$1"
  local source="$2"
  local destination="$3"
  local backup_dir="$4"
  local stage="${destination}.mademo-stage-$$"

  [[ ! -L "${destination}" ]] || die "${label} installé via lien symbolique : ${destination}. Retirez le lien avant le déploiement."
  [[ ! -e "${stage}" ]] || die "Dossier temporaire déjà présent : ${stage}"

  mkdir -p "${stage}"
  rsync -a --delete --exclude='.DS_Store' --exclude='.cache' "${source}/" "${stage}/"

  if [[ "${label}" == "Thème" ]]; then
    validate_manifest "${stage}" || die "Le thème préparé ne peut pas être installé."
  fi

  mkdir -p "${backup_dir}"
  if [[ -d "${destination}" ]]; then
    mv "${destination}" "${backup_dir}/current"
  fi

  if ! mv "${stage}" "${destination}"; then
    [[ -d "${backup_dir}/current" ]] && mv "${backup_dir}/current" "${destination}"
    die "Impossible d’installer ${label}. L’ancienne version a été restaurée."
  fi
  success "${label} installé : ${destination}"
}

restore_component() {
  local destination="$1"
  local backup_dir="$2"
  local failed_dir="${backup_dir}/failed"

  if [[ -d "${destination}" ]]; then
    mv "${destination}" "${failed_dir}"
  fi
  if [[ -d "${backup_dir}/current" ]]; then
    mv "${backup_dir}/current" "${destination}"
  fi
}

health_check() {
  if ! validate_manifest "${THEME_DEST}"; then
    return 1
  fi

  if ! wp_cli_available; then
    error "WP-CLI (${WP_CLI}) est introuvable. Dans Local, utilisez « Open Site Shell », puis relancez."
    return 1
  fi

  if ! run_wp plugin is-active mademo-studio >/dev/null; then
    error "L’extension Mademo Studio n’est pas active."
    return 1
  fi
  if ! run_wp theme is-active mademo >/dev/null; then
    error "Le thème Mademo n’est pas actif."
    return 1
  fi

  if [[ -z "${WP_URL}" ]]; then
    WP_URL="$(run_wp option get home 2>/dev/null || true)"
  fi

  if [[ "${SKIP_HTTP_CHECK}" == "1" ]]; then
    warn "Vérification HTTP ignorée (MADEMO_SKIP_HTTP_CHECK=1)."
    return
  fi

  if ! command -v curl >/dev/null 2>&1; then
    error "curl est requis pour vérifier le site."
    return 1
  fi
  if [[ -z "${WP_URL}" ]]; then
    error "MADEMO_WP_URL est vide et WP-CLI n’a pas retourné l’URL du site."
    return 1
  fi

  if ! curl --fail --silent --show-error --location --max-time 20 "${WP_URL%/}/" >/dev/null; then
    error "La page d’accueil ne répond pas correctement : ${WP_URL%/}/"
    return 1
  fi
  if ! curl --fail --silent --show-error --location --max-time 20 "${WP_URL%/}/wp-json/mademo/v1/settings" >/dev/null; then
    error "L’API Mademo ne répond pas correctement."
    return 1
  fi
  success "Site et API REST accessibles : ${WP_URL%/}"
}

rollback_deployment() {
  local deploy_theme="$1"
  local deploy_plugin="$2"
  local backup_dir="$3"

  error "La vérification a échoué : restauration locale en cours."
  [[ "${deploy_theme}" == "1" ]] && restore_component "${THEME_DEST}" "${backup_dir}/theme"
  [[ "${deploy_plugin}" == "1" ]] && restore_component "${PLUGIN_DEST}" "${backup_dir}/plugin"
  wp_cli_available && run_wp rewrite flush --hard >/dev/null 2>&1 || true
}

deploy_components() {
  local deploy_theme="$1"
  local deploy_plugin="$2"
  local timestamp backup_dir
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_dir="${BACKUP_ROOT}/${timestamp}"

  if [[ "${deploy_theme}" == "1" ]]; then
    copy_component "Thème" "${THEME_SOURCE}" "${THEME_DEST}" "${backup_dir}/theme"
  fi
  if [[ "${deploy_plugin}" == "1" ]]; then
    copy_component "Extension" "${PLUGIN_SOURCE}" "${PLUGIN_DEST}" "${backup_dir}/plugin"
  fi

  if ! wp_cli_available; then
    [[ "${deploy_theme}" == "1" ]] && restore_component "${THEME_DEST}" "${backup_dir}/theme"
    [[ "${deploy_plugin}" == "1" ]] && restore_component "${PLUGIN_DEST}" "${backup_dir}/plugin"
    die "WP-CLI (${WP_CLI}) est introuvable. Les fichiers précédents ont été restaurés."
  fi

  if [[ "${deploy_plugin}" == "1" ]] && ! run_wp plugin activate mademo-studio; then
    rollback_deployment "${deploy_theme}" "${deploy_plugin}" "${backup_dir}"
    die "Activation de l’extension impossible."
  fi
  if [[ "${deploy_theme}" == "1" ]] && ! run_wp theme activate mademo; then
    rollback_deployment "${deploy_theme}" "${deploy_plugin}" "${backup_dir}"
    die "Activation du thème impossible."
  fi
  if ! run_wp rewrite flush --hard; then
    rollback_deployment "${deploy_theme}" "${deploy_plugin}" "${backup_dir}"
    die "Impossible de régénérer les permaliens."
  fi

  if ! health_check; then
    rollback_deployment "${deploy_theme}" "${deploy_plugin}" "${backup_dir}"
    die "Déploiement annulé. La version précédente est de nouveau installée."
  fi
}

cd "${ROOT_DIR}"
validate_environment

case "${ACTION}" in
  setup)
    command -v pnpm >/dev/null 2>&1 || die "pnpm est introuvable. Activez Corepack : corepack enable"
    info "Installation déterministe des dépendances"
    pnpm install --frozen-lockfile
    info "Build WordPress"
    pnpm build:wp
    deploy_components 1 1
    ;;
  deploy)
    command -v pnpm >/dev/null 2>&1 || die "pnpm est introuvable."
    info "Build WordPress"
    pnpm build:wp
    deploy_components 1 1
    ;;
  plugin)
    deploy_components 0 1
    ;;
  theme)
    command -v pnpm >/dev/null 2>&1 || die "pnpm est introuvable."
    pnpm build:wp
    deploy_components 1 0
    ;;
  check)
    health_check
    ;;
esac

success "Automatisation locale terminée."
