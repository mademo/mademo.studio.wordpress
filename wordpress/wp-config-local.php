<?php
/**
 * wp-config.php — Mademo Studio / Local by Flywheel
 *
 * Copier ce fichier à la racine WordPress :
 *   .../mademo-studio/app/public/wp-config.php
 *
 * ⚠️  Remplacer les clés AUTH_KEY etc. par de vraies valeurs :
 *   https://api.wordpress.org/secret-key/1.1/salt/
 */

// ─── Base de données ──────────────────────────────────────────────────────────

define( 'DB_NAME',     'local' );
define( 'DB_USER',     'root' );
define( 'DB_PASSWORD', 'root' );

// Local by Flywheel utilise un socket Unix — ne pas mettre juste "localhost"
define( 'DB_HOST',     'localhost:/Users/mademo/Library/Application Support/Local/run/QYWJk-USJ/mysql/mysqld.sock' );

define( 'DB_CHARSET',  'utf8mb4' );
define( 'DB_COLLATE',  'utf8mb4_unicode_520_ci' );

// ─── Clés de sécurité ─────────────────────────────────────────────────────────
// Générer les vraies clés sur : https://api.wordpress.org/secret-key/1.1/salt/

define( 'AUTH_KEY',         'remplacer-par-une-vraie-cle-aleatoire-1' );
define( 'SECURE_AUTH_KEY',  'remplacer-par-une-vraie-cle-aleatoire-2' );
define( 'LOGGED_IN_KEY',    'remplacer-par-une-vraie-cle-aleatoire-3' );
define( 'NONCE_KEY',        'remplacer-par-une-vraie-cle-aleatoire-4' );
define( 'AUTH_SALT',        'remplacer-par-une-vraie-cle-aleatoire-5' );
define( 'SECURE_AUTH_SALT', 'remplacer-par-une-vraie-cle-aleatoire-6' );
define( 'LOGGED_IN_SALT',   'remplacer-par-une-vraie-cle-aleatoire-7' );
define( 'NONCE_SALT',       'remplacer-par-une-vraie-cle-aleatoire-8' );

// ─── Préfixe des tables ───────────────────────────────────────────────────────

$table_prefix = 'wp_';

// ─── URL du site ──────────────────────────────────────────────────────────────

define( 'WP_HOME',    'http://localhost:10003' );
define( 'WP_SITEURL', 'http://localhost:10003' );

// ─── Debug (développement local) ─────────────────────────────────────────────

define( 'WP_DEBUG',         true  );   // affiche les erreurs PHP
define( 'WP_DEBUG_LOG',     true  );   // écrit dans wp-content/debug.log
define( 'WP_DEBUG_DISPLAY', false );   // ne pas afficher en frontend
define( 'SCRIPT_DEBUG',     true  );   // charge les JS/CSS non-minifiés de WP

// ─── Performance ─────────────────────────────────────────────────────────────

define( 'WP_MEMORY_LIMIT',       '256M' );
define( 'WP_MAX_MEMORY_LIMIT',   '512M' );  // pour wp-admin

// Désactiver les révisions (inutiles en dev, économise la base)
define( 'WP_POST_REVISIONS', 3 );

// Vider la corbeille automatiquement après 7 jours
define( 'EMPTY_TRASH_DAYS', 7 );

// ─── Mises à jour ─────────────────────────────────────────────────────────────

// En local : désactiver les mises à jour automatiques
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'WP_AUTO_UPDATE_CORE',        false );

// ─── Fichiers directs (Local n'a pas besoin de FTP) ───────────────────────────

define( 'FS_METHOD', 'direct' );

// ─── Chemin absolu WordPress ──────────────────────────────────────────────────

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
