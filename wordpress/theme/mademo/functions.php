<?php
/**
 * Thème Mademo Studio — functions.php
 *
 * Rôle unique : servir le bundle React dans WordPress.
 * Tout le rendu est géré par l'application React (SPA).
 */

defined( 'ABSPATH' ) || exit;

// ─── Support thème ────────────────────────────────────────────────────────────

add_action( 'after_setup_theme', function (): void {
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style' ] );
} );

// ─── Enqueue du bundle React ───────────────────────────────────────────────────

add_action( 'wp_enqueue_scripts', 'mademo_enqueue_assets' );

function mademo_enqueue_assets(): void {
    $theme_dir = get_template_directory();
    $theme_uri = get_template_directory_uri();
    $manifest  = $theme_dir . '/dist/.vite/manifest.json';

    if ( ! file_exists( $manifest ) ) {
        add_action( 'wp_head', function (): void {
            echo "\n<!-- [Mademo] Bundle introuvable dans /dist/. Lancez : BUILD_TARGET=wordpress npm run build -->\n";
        } );
        return;
    }

    // Lire le manifest — avec mise en cache objet si disponible
    $cache_key = 'mademo_manifest_' . filemtime( $manifest );
    $data      = wp_cache_get( $cache_key, 'mademo' );
    if ( false === $data ) {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
        $raw  = file_get_contents( $manifest );
        $data = $raw ? json_decode( $raw, true ) : null;
        if ( $data ) {
            wp_cache_set( $cache_key, $data, 'mademo', HOUR_IN_SECONDS );
        }
    }

    if ( ! is_array( $data ) ) {
        return;
    }

    // Vite 5 indexe par le chemin d'entrée relatif depuis la racine du projet
    $entry = $data['index.html'] ?? $data['src/main.tsx'] ?? null;
    if ( ! $entry ) {
        return;
    }

    // CSS
    foreach ( $entry['css'] ?? [] as $css_file ) {
        wp_enqueue_style( 'mademo-app', $theme_uri . '/dist/' . $css_file, [], null );
    }

    // JS principal — pas de version (hash Vite dans le nom de fichier)
    wp_enqueue_script( 'mademo-app', $theme_uri . '/dist/' . $entry['file'], [], null, true );

    // Préchargement des chunks dynamiques via modulepreload
    // Ne pas enqueue les chunks : Vite injecte les <link rel="modulepreload"> lui-même
    // Les enqueuer en plus causerait un double-chargement des modules ES
    add_action( 'wp_head', function () use ( $theme_uri, $data, $entry ): void {
        foreach ( $entry['imports'] ?? [] as $chunk_key ) {
            $chunk = $data[ $chunk_key ] ?? null;
            if ( $chunk && isset( $chunk['file'] ) ) {
                printf(
                    '<link rel="modulepreload" href="%s" crossorigin>' . "\n",
                    esc_url( $theme_uri . '/dist/' . $chunk['file'] )
                );
            }
        }
    }, 2 );

    // type="module" + crossorigin requis pour les ES modules
    add_filter( 'script_loader_tag', 'mademo_script_attributes', 10, 2 );
}

function mademo_script_attributes( string $tag, string $handle ): string {
    if ( ! str_starts_with( $handle, 'mademo-' ) ) {
        return $tag;
    }
    // Ajoute type="module" et crossorigin (requis pour modulepreload + CORS)
    return str_replace( '<script ', '<script type="module" crossorigin ', $tag );
}

// ─── Config exposée à React ───────────────────────────────────────────────────

add_action( 'wp_head', 'mademo_inline_config', 1 );

function mademo_inline_config(): void {
    $upload = wp_upload_dir();
    $config = [
        'apiBase'    => esc_url_raw( rest_url( 'mademo/v1' ) ),
        'nonce'      => wp_create_nonce( 'wp_rest' ),
        'siteUrl'    => esc_url_raw( get_site_url() ),
        'uploadsUrl' => esc_url_raw( $upload['baseurl'] ),
        'isLoggedIn' => is_user_logged_in(),
        'themeUrl'   => esc_url_raw( get_template_directory_uri() ),
    ];
    // wp_json_encode échappe les slashes et les caractères spéciaux — sûr pour inline JS
    echo '<script>window.MADEMO_CONFIG=' . wp_json_encode( $config, JSON_UNESCAPED_SLASHES ) . ';</script>' . "\n";
}

// ─── SPA fallback ─────────────────────────────────────────────────────────────

add_filter( 'template_include', function ( string $template ): string {
    // Laisser passer : admin, REST API, flux, robots, sitemaps, trackbacks
    if (
        is_admin()
        || ( defined( 'REST_REQUEST' ) && REST_REQUEST )
        || is_feed()
        || is_robots()
        || is_trackback()
        || ( defined( 'DOING_CRON' ) && DOING_CRON )
    ) {
        return $template;
    }
    $spa = get_template_directory() . '/index.php';
    return file_exists( $spa ) ? $spa : $template;
} );

// ─── Nettoyage du <head> ──────────────────────────────────────────────────────

// Lien REST dans le head (déjà dans les headers HTTP)
remove_action( 'wp_head', 'rest_output_link_wp_head' );
// Flux RSS inutiles pour une SPA
remove_action( 'wp_head', 'feed_links_extra', 3 );
remove_action( 'wp_head', 'feed_links', 2 );
// Meta generator (sécurité : ne pas exposer la version WP)
remove_action( 'wp_head', 'wp_generator' );
// Emoji (~12 Ko économisés)
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
// oEmbed — inutile pour la SPA
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'wp_oembed_add_host_js' );
// RSD et Windows Live Writer
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
// Shortlink
remove_action( 'wp_head', 'wp_shortlink_wp_head' );

// ─── Barre d'admin ────────────────────────────────────────────────────────────

add_filter( 'show_admin_bar', fn(): bool => current_user_can( 'administrator' ) );

// ─── Désactiver commentaires et trackbacks sur les CPT ───────────────────────

add_action( 'init', function (): void {
    $types = [ 'mademo_project', 'mademo_fragment', 'mademo_text', 'mademo_research' ];
    foreach ( $types as $type ) {
        remove_post_type_support( $type, 'comments' );
        remove_post_type_support( $type, 'trackbacks' );
    }
} );

// ─── Désactiver xmlrpc si non nécessaire ─────────────────────────────────────

add_filter( 'xmlrpc_enabled', '__return_false' );

// ─── Headers de sécurité supplémentaires ─────────────────────────────────────

add_action( 'send_headers', function (): void {
    if ( is_admin() ) {
        return;
    }
    header( 'X-Content-Type-Options: nosniff' );
    header( 'X-Frame-Options: SAMEORIGIN' );
    header( 'Referrer-Policy: strict-origin-when-cross-origin' );
} );
