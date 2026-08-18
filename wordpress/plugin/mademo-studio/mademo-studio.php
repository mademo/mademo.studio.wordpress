<?php
/**
 * Plugin Name:  Mademo Studio
 * Plugin URI:   https://mademo.studio
 * Description:  Custom Post Types, taxonomies, ACF, REST API et administration pour Mademo Studio.
 * Version:      2.2.0
 * Author:       Mademo Studio
 * Text Domain:  mademo-studio
 * Domain Path:  /languages
 * Requires WP:  6.4
 * Requires PHP: 8.1
 */

defined( 'ABSPATH' ) || exit;

define( 'MADEMO_VERSION',    '2.2.0' );
define( 'MADEMO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MADEMO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MADEMO_PER_PAGE_MAX', 200 );

// Pipeline CI/CD (GitHub Actions → WordPress admin)
require_once MADEMO_PLUGIN_DIR . 'includes/deploy.php';

// ─── 1. Custom Post Types ─────────────────────────────────────────────────────

add_action( 'init', 'mademo_register_post_types' );

function mademo_register_post_types(): void {
    $common = [
        'public'       => true,
        'show_in_rest' => true,
        'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields' ],
        'show_in_menu' => 'mademo-studio',
    ];

    register_post_type( 'mademo_project', array_merge( $common, [
        'label'        => 'Projets',
        'labels'       => mademo_labels( 'Projet', 'Projets' ),
        'rest_base'    => 'mademo_project',
        'menu_position'=> 5,
        'has_archive'  => 'projets',
        'rewrite'      => [ 'slug' => 'projets' ],
    ] ) );

    register_post_type( 'mademo_fragment', array_merge( $common, [
        'label'        => 'Fragments',
        'labels'       => mademo_labels( 'Fragment', 'Fragments' ),
        'rest_base'    => 'mademo_fragment',
        'has_archive'  => 'fragments',
        'rewrite'      => [ 'slug' => 'fragments' ],
    ] ) );

    register_post_type( 'mademo_text', array_merge( $common, [
        'label'        => 'Textes',
        'labels'       => mademo_labels( 'Texte', 'Textes' ),
        'rest_base'    => 'mademo_text',
        'has_archive'  => 'textes',
        'rewrite'      => [ 'slug' => 'textes' ],
    ] ) );

    register_post_type( 'mademo_research', array_merge( $common, [
        'label'        => 'Recherches',
        'labels'       => mademo_labels( 'Question de recherche', 'Recherches' ),
        'supports'     => [ 'title', 'revisions', 'custom-fields' ],
        'rest_base'    => 'mademo_research',
        'has_archive'  => 'recherches',
        'rewrite'      => [ 'slug' => 'recherches' ],
    ] ) );
}

function mademo_labels( string $singular, string $plural ): array {
    return [
        'name'               => $plural,
        'singular_name'      => $singular,
        'add_new'            => 'Ajouter',
        'add_new_item'       => "Ajouter un·e $singular",
        'edit_item'          => "Modifier $singular",
        'new_item'           => "Nouveau·elle $singular",
        'view_item'          => "Voir $singular",
        'search_items'       => "Chercher dans $plural",
        'not_found'          => "Aucun·e $singular trouvé·e.",
        'not_found_in_trash' => "Aucun·e $singular dans la corbeille.",
        'menu_name'          => $plural,
        'all_items'          => "Tous les $plural",
    ];
}

// ─── 2. Menu d'administration ─────────────────────────────────────────────────

add_action( 'admin_menu', 'mademo_admin_menu' );

function mademo_admin_menu(): void {
    $icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a7aaad" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="1.5"/><circle cx="20" cy="6" r="1.5"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/><line x1="6" y1="6" x2="10" y2="10"/><line x1="18" y1="6" x2="14" y2="10"/><line x1="6" y1="18" x2="10" y2="14"/><line x1="18" y1="18" x2="14" y2="14"/></svg>' );

    add_menu_page( 'Mademo Studio', 'Mademo Studio', 'edit_posts', 'mademo-studio', 'mademo_dashboard_page', $icon, 4 );
    add_submenu_page( 'mademo-studio', 'Projets',    'Projets',    'edit_posts',    'edit.php?post_type=mademo_project' );
    add_submenu_page( 'mademo-studio', 'Fragments',  'Fragments',  'edit_posts',    'edit.php?post_type=mademo_fragment' );
    add_submenu_page( 'mademo-studio', 'Textes',     'Textes',     'edit_posts',    'edit.php?post_type=mademo_text' );
    add_submenu_page( 'mademo-studio', 'Recherches', 'Recherches', 'edit_posts',    'edit.php?post_type=mademo_research' );
    add_submenu_page( 'mademo-studio', 'API REST',   'API REST',   'manage_options','mademo-api', 'mademo_api_page' );
    add_submenu_page( 'mademo-studio', 'Réglages du site', 'Réglages', 'manage_options', 'mademo-settings', 'mademo_settings_page' );
}

// Page placeholder — la vraie UI est dans l'options page ACF
function mademo_settings_page(): void {
    if ( function_exists( 'acf_get_options_page' ) && acf_get_options_page( 'mademo-settings' ) ) {
        // Rediriger vers la page options ACF
        wp_redirect( admin_url( 'admin.php?page=mademo-settings-acf' ) );
        exit;
    }
    echo '<div class="wrap"><h1>Réglages Mademo Studio</h1><p>ACF Pro est requis pour éditer les réglages du site.</p></div>';
}

add_action( 'acf/init', function (): void {
    if ( ! function_exists( 'acf_add_options_page' ) ) {
        return;
    }
    acf_add_options_page( [
        'page_title'  => 'Réglages Mademo Studio',
        'menu_title'  => 'Réglages du site',
        'menu_slug'   => 'mademo-settings-acf',
        'parent_slug' => 'mademo-studio',
        'capability'  => 'manage_options',
        'redirect'    => false,
    ] );
} );

function mademo_dashboard_page(): void {
    $stats = [
        [ 'Projets',    'mademo_project',  '#111' ],
        [ 'Fragments',  'mademo_fragment',  '#333' ],
        [ 'Textes',     'mademo_text',      '#555' ],
        [ 'Recherches', 'mademo_research',  '#777' ],
    ];
    ?>
    <div class="wrap">
        <h1>Mademo Studio <span style="font-size:12px;color:#999;font-weight:400">v<?= esc_html( MADEMO_VERSION ) ?></span></h1>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:24px">
            <?php foreach ( $stats as [ $label, $type, $color ] ) :
                $count = (int) ( wp_count_posts( $type )->publish ?? 0 ); ?>
                <div style="background:#fff;border:1px solid #ddd;padding:20px;border-top:3px solid <?= esc_attr( $color ) ?>">
                    <div style="font-size:32px;font-weight:700;color:<?= esc_attr( $color ) ?>"><?= $count ?></div>
                    <div style="color:#666;margin-top:4px"><?= esc_html( $label ) ?></div>
                    <a href="<?= esc_url( admin_url( "edit.php?post_type=$type" ) ) ?>" style="font-size:12px;color:<?= esc_attr( $color ) ?>">Gérer →</a>
                </div>
            <?php endforeach; ?>
        </div>
        <div style="margin-top:24px;background:#fff;border:1px solid #ddd;padding:20px">
            <h2 style="margin-top:0">Endpoints REST</h2>
            <?php foreach ( [ 'projects', 'fragments', 'texts', 'research', 'settings' ] as $ep ) : ?>
                <div style="margin:6px 0;font-family:monospace;font-size:13px">
                    <a href="<?= esc_url( rest_url( "mademo/v1/$ep" ) ) ?>" target="_blank">
                        <?= esc_html( rest_url( "mademo/v1/$ep" ) ) ?>
                    </a>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php
}

function mademo_api_page(): void {
    $endpoints = [
        [ '/mademo/v1/projects',  'GET', '?status=production&theme=corps&orderby=date&order=desc&per_page=20' ],
        [ '/mademo/v1/fragments', 'GET', '?type=hypothèse&project=la-monade&per_page=50' ],
        [ '/mademo/v1/texts',     'GET', '?type=Essai' ],
        [ '/mademo/v1/research',  'GET', '' ],
        [ '/mademo/v1/settings',  'GET', '' ],
    ];
    ?>
    <div class="wrap">
        <h1>Endpoints REST — Mademo Studio</h1>
        <table class="widefat" style="margin-top:16px">
            <thead><tr><th>Endpoint</th><th>Méthode</th><th>Paramètres</th><th>Tester</th></tr></thead>
            <tbody>
            <?php foreach ( $endpoints as [ $path, $method, $params ] ) :
                $url = rest_url( ltrim( $path, '/' ) ); ?>
                <tr>
                    <td><code><?= esc_html( $path ) ?></code></td>
                    <td><span style="background:#0073aa;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px"><?= esc_html( $method ) ?></span></td>
                    <td><code style="color:#777;font-size:12px"><?= esc_html( $params ) ?></code></td>
                    <td><a href="<?= esc_url( $url ) ?>" target="_blank">↗ Ouvrir</a></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// ─── 3. Taxonomies ────────────────────────────────────────────────────────────

add_action( 'init', 'mademo_register_taxonomies' );

function mademo_register_taxonomies(): void {
    register_taxonomy( 'project_status', [ 'mademo_project' ], [
        'label'             => 'Statut',
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'project_status',
        'rewrite'           => [ 'slug' => 'statut-projet' ],
        'show_admin_column' => true,
        'show_in_menu'      => false,
    ] );

    register_taxonomy( 'fragment_type', [ 'mademo_fragment' ], [
        'label'             => 'Type de fragment',
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'fragment_type',
        'rewrite'           => [ 'slug' => 'type-fragment' ],
        'show_admin_column' => true,
        'show_in_menu'      => false,
    ] );

    register_taxonomy( 'mademo_theme', [ 'mademo_project', 'mademo_fragment', 'mademo_text', 'mademo_research' ], [
        'label'             => 'Thèmes',
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'mademo_theme',
        'rewrite'           => [ 'slug' => 'theme' ],
        'show_admin_column' => true,
        'show_in_menu'      => false,
    ] );

    register_taxonomy( 'fragment_status', [ 'mademo_fragment' ], [
        'label'             => 'Statut du fragment',
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'fragment_status',
        'rewrite'           => [ 'slug' => 'statut-fragment' ],
        'show_admin_column' => true,
        'show_in_menu'      => false,
    ] );
}

// ─── 4. Termes par défaut ─────────────────────────────────────────────────────

function mademo_seed_terms(): void {
    $project_statuses = [
        'intuition'       => 'Intuition',
        'documentation'   => 'Documentation',
        'recherche'       => 'Recherche',
        'experimentation' => 'Expérimentation',
        'production'      => 'Production',
        'en-pause'        => 'En pause',
        'termine'         => 'Terminé',
    ];
    foreach ( $project_statuses as $slug => $name ) {
        if ( ! term_exists( $slug, 'project_status' ) ) {
            wp_insert_term( $name, 'project_status', [ 'slug' => $slug ] );
        }
    }

    $fragment_types = [
        'note', 'photographie', 'citation', 'hypothese', 'question',
        'experience', 'resultat', 'echec', 'reference', 'decision',
    ];
    foreach ( $fragment_types as $slug ) {
        if ( ! term_exists( $slug, 'fragment_type' ) ) {
            wp_insert_term( ucfirst( $slug ), 'fragment_type', [ 'slug' => $slug ] );
        }
    }

    $fragment_statuses = [
        'brut'       => 'Brut',
        'a-relire'   => 'À relire',
        'valide'     => 'Validé',
        'abandonne'  => 'Abandonné',
        'transforme' => 'Transformé',
    ];
    foreach ( $fragment_statuses as $slug => $name ) {
        if ( ! term_exists( $slug, 'fragment_status' ) ) {
            wp_insert_term( $name, 'fragment_status', [ 'slug' => $slug ] );
        }
    }

    $themes = [
        'corps', 'matiere', 'perception', 'handicap', 'soin',
        'politique', 'vivant', 'lumiere', 'memoire', 'technologie', 'transformation',
    ];
    foreach ( $themes as $slug ) {
        if ( ! term_exists( $slug, 'mademo_theme' ) ) {
            wp_insert_term( ucfirst( $slug ), 'mademo_theme', [ 'slug' => $slug ] );
        }
    }
}

// ─── 5. ACF — Synchronisation JSON ───────────────────────────────────────────

add_filter( 'acf/settings/save_json', fn() => MADEMO_PLUGIN_DIR . 'acf-json' );

add_filter( 'acf/settings/load_json', function ( array $paths ): array {
    $paths[] = MADEMO_PLUGIN_DIR . 'acf-json';
    return $paths;
} );

add_action( 'acf/init', 'mademo_register_acf_fields' );

function mademo_register_acf_fields(): void {
    if ( ! function_exists( 'acf_add_local_field_group' ) ) {
        return;
    }

    acf_add_local_field_group( [
        'key'        => 'group_projet',
        'title'      => 'Projet — Informations',
        'location'   => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'mademo_project' ] ] ],
        'menu_order' => 0,
        'fields'     => [
            [ 'key' => 'field_projet_category',    'label' => 'Catégorie courte',         'name' => 'category',     'type' => 'text',     'placeholder' => 'ex: anim. / install. / rech.' ],
            [ 'key' => 'field_projet_year',        'label' => 'Année',                    'name' => 'year',         'type' => 'text',     'placeholder' => '2024 ou 2021–' ],
            [ 'key' => 'field_projet_question',    'label' => 'Question centrale',        'name' => 'question',     'type' => 'textarea', 'rows' => 2 ],
            [ 'key' => 'field_projet_manifeste',   'label' => 'Phrase manifeste',         'name' => 'manifeste',    'type' => 'textarea', 'rows' => 2, 'instructions' => 'Une phrase courte, poétique. Apparaît sur les cartes.' ],
            [ 'key' => 'field_projet_last_updated','label' => 'Dernière mise à jour',     'name' => 'last_updated', 'type' => 'text',     'placeholder' => 'ex: 12 jan. 2025' ],
            [ 'key' => 'field_projet_tags',        'label' => 'Tags (séparés par virgule)','name' => 'tags',        'type' => 'text',     'placeholder' => 'Animation, Corps, Narration' ],
            [
                'key'        => 'field_maintenant',
                'label'      => '— Maintenant',
                'name'       => 'maintenant',
                'type'       => 'group',
                'layout'     => 'block',
                'instructions' => "Décrit l'état actuel du projet (onglet Maintenant).",
                'sub_fields' => [
                    [ 'key' => 'field_maint_cherche',   'label' => 'Ce que je cherche',       'name' => 'cherche',   'type' => 'textarea', 'rows' => 2 ],
                    [ 'key' => 'field_maint_avancee',   'label' => 'Dernière avancée',         'name' => 'avancee',   'type' => 'textarea', 'rows' => 2 ],
                    [ 'key' => 'field_maint_bloque',    'label' => 'Ce qui bloque',            'name' => 'bloque',    'type' => 'textarea', 'rows' => 2, 'instructions' => 'Laisser vide si rien ne bloque.' ],
                    [ 'key' => 'field_maint_prochaine', 'label' => 'Prochaine étape',          'name' => 'prochaine', 'type' => 'textarea', 'rows' => 2 ],
                    [ 'key' => 'field_maint_question',  'label' => 'Question encore ouverte',  'name' => 'question',  'type' => 'textarea', 'rows' => 2 ],
                ],
            ],
            [
                'key'          => 'field_journal',
                'label'        => '— Journal',
                'name'         => 'journal',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => '+ Ajouter une entrée',
                'instructions' => 'Entrées chronologiques — la plus récente en premier.',
                'sub_fields'   => [
                    [ 'key' => 'field_journal_date',    'label' => 'Date',    'name' => 'date',    'type' => 'text',     'wrapper' => [ 'width' => '20' ] ],
                    [ 'key' => 'field_journal_title',   'label' => 'Titre',   'name' => 'title',   'type' => 'text',     'wrapper' => [ 'width' => '80' ] ],
                    [ 'key' => 'field_journal_content', 'label' => 'Contenu', 'name' => 'content', 'type' => 'textarea', 'rows' => 3 ],
                    [
                        'key'           => 'field_journal_type',
                        'label'         => 'Type',
                        'name'          => 'type',
                        'type'          => 'select',
                        'choices'       => [
                            'decouverte'      => 'Découverte',
                            'hypothese'       => 'Hypothèse',
                            'experimentation' => 'Expérimentation',
                            'resultat'        => 'Résultat',
                            'difficulte'      => 'Difficulté',
                            'decision'        => 'Décision',
                        ],
                        'default_value' => 'decouverte',
                        'wrapper'       => [ 'width' => '30' ],
                    ],
                ],
            ],
            [
                'key'          => 'field_references',
                'label'        => '— Références bibliographiques',
                'name'         => 'references',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => '+ Ajouter une référence',
                'sub_fields'   => [
                    [ 'key' => 'field_ref_title',  'label' => 'Titre',  'name' => 'title',  'type' => 'text', 'wrapper' => [ 'width' => '60' ] ],
                    [ 'key' => 'field_ref_author', 'label' => 'Auteur', 'name' => 'author', 'type' => 'text', 'wrapper' => [ 'width' => '25' ] ],
                    [ 'key' => 'field_ref_year',   'label' => 'Année',  'name' => 'year',   'type' => 'text', 'wrapper' => [ 'width' => '15' ] ],
                ],
            ],
            // ── Constellation ────────────────────────────────────────────────
            [ 'key' => 'field_proj_const_tab', 'label' => '— Constellation SVG', 'name' => '', 'type' => 'tab' ],
            [
                'key'         => 'field_proj_const_x',
                'label'       => 'Position X',
                'name'        => 'constellation_x',
                'type'        => 'number',
                'min'         => 0, 'max' => 760, 'step' => 1,
                'placeholder' => '380',
                'instructions'=> 'Axe horizontal dans le viewBox 760×480.',
                'wrapper'     => [ 'width' => '33' ],
            ],
            [
                'key'         => 'field_proj_const_y',
                'label'       => 'Position Y',
                'name'        => 'constellation_y',
                'type'        => 'number',
                'min'         => 0, 'max' => 480, 'step' => 1,
                'placeholder' => '240',
                'instructions'=> 'Axe vertical dans le viewBox 760×480.',
                'wrapper'     => [ 'width' => '33' ],
            ],
            [
                'key'         => 'field_proj_const_r',
                'label'       => 'Rayon',
                'name'        => 'constellation_r',
                'type'        => 'number',
                'min'         => 5, 'max' => 40, 'step' => 1,
                'placeholder' => '18',
                'instructions'=> 'Rayon du cercle en px (5–40). Les projets principaux : 18–22, secondaires : 12–16.',
                'wrapper'     => [ 'width' => '33' ],
            ],
        ],
    ] );

    acf_add_local_field_group( [
        'key'      => 'group_fragment',
        'title'    => 'Fragment — Informations',
        'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'mademo_fragment' ] ] ],
        'fields'   => [
            [ 'key' => 'field_frag_number',   'label' => 'Numéro',           'name' => 'number',     'type' => 'text', 'placeholder' => 'F.001', 'wrapper' => [ 'width' => '25' ] ],
            [ 'key' => 'field_frag_date',     'label' => 'Date de création', 'name' => 'date',       'type' => 'text', 'placeholder' => 'ex: 10 jan. 2025', 'wrapper' => [ 'width' => '35' ] ],
            [
                'key'           => 'field_frag_projects',
                'label'         => 'Projets associés',
                'name'          => 'project_ids',
                'type'          => 'relationship',
                'post_type'     => [ 'mademo_project' ],
                'return_format' => 'id',
                'filters'       => [ 'search' ],
                'wrapper'       => [ 'width' => '100' ],
            ],
            [ 'key' => 'field_frag_keywords', 'label' => 'Mots-clés (séparés par virgule)', 'name' => 'keywords', 'type' => 'text' ],
        ],
    ] );

    acf_add_local_field_group( [
        'key'      => 'group_text',
        'title'    => 'Texte — Informations',
        'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'mademo_text' ] ] ],
        'fields'   => [
            [ 'key' => 'field_text_date',     'label' => 'Date de publication', 'name' => 'date',              'type' => 'text',     'placeholder' => 'Mars 2024',             'wrapper' => [ 'width' => '30' ] ],
            [ 'key' => 'field_text_type',     'label' => 'Type de texte',       'name' => 'type',              'type' => 'text',     'placeholder' => 'Essai, Fragment littéraire…', 'wrapper' => [ 'width' => '40' ] ],
            [ 'key' => 'field_text_readtime', 'label' => 'Temps de lecture',    'name' => 'read_time',         'type' => 'text',     'placeholder' => '8 min',                 'wrapper' => [ 'width' => '30' ] ],
            [ 'key' => 'field_text_excerpt',  'label' => 'Extrait (accroche)',  'name' => 'excerpt',           'type' => 'textarea', 'rows' => 3, 'instructions' => "Phrase d'accroche visible avant ouverture." ],
            [
                'key'           => 'field_text_project',
                'label'         => 'Projet lié',
                'name'          => 'related_project_id',
                'type'          => 'relationship',
                'post_type'     => [ 'mademo_project' ],
                'return_format' => 'id',
                'max'           => 1,
                'filters'       => [ 'search' ],
            ],
        ],
    ] );

    acf_add_local_field_group( [
        'key'          => 'group_research',
        'title'        => 'Recherche — Informations',
        'instructions' => 'Le Titre du post = nom du territoire (ex: "Le corps comme matière"). Renseignez la question de recherche dans le champ dédié ci-dessous.',
        'location'     => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'mademo_research' ] ] ],
        'fields'       => [
            [
                'key'          => 'field_res_question',
                'label'        => 'Question de recherche',
                'name'         => 'question',
                'type'         => 'textarea',
                'rows'         => 2,
                'instructions' => 'La question centrale, formulée en une phrase (ex: "Comment la douleur peut-elle être partagée ?").',
            ],
            [
                'key'          => 'field_res_description',
                'label'        => 'Description',
                'name'         => 'description',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Développement du territoire en 2-4 phrases.',
            ],
            [
                'key'          => 'field_res_genealogies',
                'label'        => 'Filiations (une par ligne)',
                'name'         => 'genealogies',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Références historiques, philosophiques ou artistiques fondatrices. Une entrée par ligne.',
                'placeholder'  => "Merleau-Ponty, Phénoménologie de la perception\nFrancis Bacon",
            ],
            [
                'key'          => 'field_res_contemporary_artists',
                'label'        => 'Artistes contemporain·es (un·e par ligne)',
                'name'         => 'contemporary_artists',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Artistes actuel·les dont le travail résonne avec ce territoire.',
                'placeholder'  => "Kiki Smith\nAnn Hamilton",
            ],
            [
                'key'          => 'field_res_forms',
                'label'        => 'Formes d\'expression (une par ligne)',
                'name'         => 'forms',
                'type'         => 'textarea',
                'rows'         => 3,
                'instructions' => 'Médiums, dispositifs ou formes que ce territoire génère.',
                'placeholder'  => "Installation sonore\nPerformance avec moulage",
            ],
            [ 'key' => 'field_res_last_updated',   'label' => 'Dernière mise à jour', 'name' => 'last_updated',   'type' => 'text',   'placeholder' => 'ex: 8 jan. 2025' ],
            [ 'key' => 'field_res_fragment_count', 'label' => 'Nombre de fragments',  'name' => 'fragment_count', 'type' => 'number', 'min' => 0 ],
            [
                'key'           => 'field_res_projects',
                'label'         => 'Projets associés',
                'name'          => 'project_ids',
                'type'          => 'relationship',
                'post_type'     => [ 'mademo_project' ],
                'return_format' => 'id',
                'filters'       => [ 'search' ],
            ],
        ],
    ] );

    // ── Réglages du site (options page ACF) ───────────────────────────────────
    acf_add_local_field_group( [
        'key'        => 'group_settings',
        'title'      => 'Réglages du site',
        'location'   => [ [ [ 'param' => 'options_page', 'operator' => '==', 'value' => 'mademo-settings-acf' ] ] ],
        'menu_order' => 0,
        'fields'     => [
            // ── À propos ──────────────────────────────────────────────────────
            [ 'key' => 'field_set_tab_about', 'label' => 'À propos', 'name' => '', 'type' => 'tab' ],
            [ 'key' => 'field_set_subtitle',  'label' => 'Sous-titre',           'name' => 'subtitle',        'type' => 'text',
              'placeholder'  => 'Artiste · Designer · Photographe · Autrice',
              'instructions' => 'Apparaît sur la page À propos et dans le hero.' ],
            [ 'key' => 'field_set_city',      'label' => 'Ville',                'name' => 'city',            'type' => 'text',
              'placeholder'  => 'Basée à Paris' ],
            [ 'key' => 'field_set_bio',       'label' => 'Bio — paragraphe 1',   'name' => 'bio',             'type' => 'textarea', 'rows' => 4,
              'instructions' => 'Présentation principale. Texte long, visible en premier.' ],
            [ 'key' => 'field_set_bio2',      'label' => 'Bio — paragraphe 2',   'name' => 'bio_secondary',   'type' => 'textarea', 'rows' => 3,
              'instructions' => 'Description du site / de la démarche. Texte secondaire (muted).' ],
            [ 'key' => 'field_set_about_img', 'label' => 'Image À propos',       'name' => 'about_image',     'type' => 'image',  'return_format' => 'url',
              'instructions' => 'Utilisée dans le hero de la page À propos. Format paysage recommandé.' ],
            [ 'key' => 'field_set_practices', 'label' => 'Pratiques (une par ligne)',       'name' => 'practices',  'type' => 'textarea', 'rows' => 6,
              'placeholder'  => "Installation\nAnimation\nJoaillerie\nDirection artistique\nPhotographie\nÉcriture & recherche" ],
            [ 'key' => 'field_set_available', 'label' => 'Disponible pour (une par ligne)', 'name' => 'available',  'type' => 'textarea', 'rows' => 4,
              'placeholder'  => "Collaborations artistiques\nRésidences\nCommandes\nDirection artistique" ],
            // ── Contact ───────────────────────────────────────────────────────
            [ 'key' => 'field_set_tab_contact',        'label' => 'Contact',             'name' => '',                      'type' => 'tab' ],
            [ 'key' => 'field_set_contact_intro',      'label' => 'Phrase d\'intro',      'name' => 'contact_intro',         'type' => 'textarea', 'rows' => 2,
              'placeholder'  => 'Pour collaborations, résidences, commandes ou simplement pour échanger.' ],
            [ 'key' => 'field_set_contact_email',      'label' => 'Email',                'name' => 'contact_email',         'type' => 'email',
              'placeholder'  => 'mademo@studio.fr' ],
            [ 'key' => 'field_set_contact_ig',         'label' => 'Instagram — label',    'name' => 'contact_instagram',     'type' => 'text',
              'placeholder'  => '@mademo.studio' ],
            [ 'key' => 'field_set_contact_ig_url',     'label' => 'Instagram — URL',      'name' => 'contact_instagram_url', 'type' => 'url',
              'placeholder'  => 'https://instagram.com/mademo.studio' ],
            [ 'key' => 'field_set_contact_vimeo',      'label' => 'Vimeo — label',        'name' => 'contact_vimeo',         'type' => 'text',
              'placeholder'  => 'vimeo.com/mademo' ],
            [ 'key' => 'field_set_contact_vimeo_url',  'label' => 'Vimeo — URL',          'name' => 'contact_vimeo_url',     'type' => 'url',
              'placeholder'  => 'https://vimeo.com/mademo' ],
        ],
    ] );
}

// ─── 6. Colonnes d'administration ─────────────────────────────────────────────

add_filter( 'manage_mademo_project_posts_columns', function ( array $cols ): array {
    return [
        'cb'           => $cols['cb'],
        'title'        => 'Titre',
        'status'       => 'Statut',
        'year'         => 'Année',
        'fragments'    => 'Fragments',
        'last_updated' => 'Mise à jour',
        'date'         => 'Publié',
    ];
} );

add_action( 'manage_mademo_project_posts_custom_column', function ( string $col, int $id ): void {
    switch ( $col ) {
        case 'status':
            $terms = wp_get_post_terms( $id, 'project_status' );
            if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
                echo '<span style="background:#333;color:#fff;padding:2px 8px;border-radius:2px;font-size:11px">'
                    . esc_html( $terms[0]->name ) . '</span>';
            }
            break;
        case 'year':
            echo esc_html( get_field( 'year', $id ) ?? '—' );
            break;
        case 'fragments':
            // Fragment count via transient cache — evite N requêtes
            $cache_key = 'mademo_fcount_' . $id;
            $count     = get_transient( $cache_key );
            if ( false === $count ) {
                global $wpdb;
                $count = (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(DISTINCT p.ID)
                     FROM {$wpdb->posts} p
                     INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
                     WHERE p.post_type = 'mademo_fragment'
                       AND p.post_status = 'publish'
                       AND pm.meta_key = 'project_ids'
                       AND pm.meta_value LIKE %s",
                    '%"' . $wpdb->esc_like( (string) $id ) . '"%'
                ) );
                set_transient( $cache_key, $count, HOUR_IN_SECONDS );
            }
            echo '<strong>' . $count . '</strong>';
            break;
        case 'last_updated':
            echo esc_html( get_field( 'last_updated', $id ) ?? '—' );
            break;
    }
}, 10, 2 );

// Invalider le cache de count quand un fragment est sauvegardé
add_action( 'save_post_mademo_fragment', function ( int $id ): void {
    $project_ids = get_field( 'project_ids', $id );
    if ( is_array( $project_ids ) ) {
        foreach ( $project_ids as $pid ) {
            delete_transient( 'mademo_fcount_' . (int) $pid );
        }
    }
} );

add_filter( 'manage_mademo_fragment_posts_columns', function ( array $cols ): array {
    return [
        'cb'       => $cols['cb'],
        'title'    => 'Titre',
        'number'   => 'N°',
        'type'     => 'Type',
        'fstatus'  => 'Statut',
        'projects' => 'Projets',
        'date'     => 'Date',
    ];
} );

add_action( 'manage_mademo_fragment_posts_custom_column', function ( string $col, int $id ): void {
    switch ( $col ) {
        case 'number':
            echo '<code>' . esc_html( get_field( 'number', $id ) ?? '—' ) . '</code>';
            break;
        case 'type':
            $terms = wp_get_post_terms( $id, 'fragment_type' );
            if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
                echo '<span style="background:#f0f0f0;padding:2px 6px;font-size:11px">' . esc_html( $terms[0]->name ) . '</span>';
            }
            break;
        case 'fstatus':
            $terms = wp_get_post_terms( $id, 'fragment_status' );
            echo ! is_wp_error( $terms ) && ! empty( $terms ) ? esc_html( $terms[0]->name ) : '—';
            break;
        case 'projects':
            $ids = get_field( 'project_ids', $id );
            if ( is_array( $ids ) && ! empty( $ids ) ) {
                // Un seul appel WP pour tous les projets
                $titles = array_map( fn( $pid ) => get_the_title( (int) $pid ), $ids );
                echo esc_html( implode( ', ', array_filter( $titles ) ) );
            } else {
                echo '—';
            }
            break;
    }
}, 10, 2 );

// ─── 7. REST API ──────────────────────────────────────────────────────────────

add_action( 'rest_api_init', 'mademo_register_rest_routes' );

function mademo_register_rest_routes(): void {
    $ns       = 'mademo/v1';
    $routes   = [
        'projects'  => 'mademo_rest_projects',
        'fragments' => 'mademo_rest_fragments',
        'texts'     => 'mademo_rest_texts',
        'research'  => 'mademo_rest_research',
    ];
    $schema = [
        'per_page' => [ 'description' => 'Nombre max de résultats.', 'type' => 'integer', 'default' => 100, 'minimum' => 1, 'maximum' => MADEMO_PER_PAGE_MAX ],
        'orderby'  => [ 'description' => 'Tri.',                    'type' => 'string',  'default' => 'menu_order', 'enum' => [ 'date', 'title', 'menu_order' ] ],
        'order'    => [ 'description' => 'Ordre.',                  'type' => 'string',  'default' => 'ASC',        'enum' => [ 'ASC', 'DESC' ] ],
        'theme'    => [ 'description' => 'Filtrer par thème (slug).','type' => 'string' ],
    ];

    foreach ( $routes as $route => $callback ) {
        register_rest_route( $ns, "/$route", [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => $callback,
            'permission_callback' => '__return_true',
            'args'                => $schema,
        ] );
    }

    // /settings — pas de paramètre de filtrage
    register_rest_route( $ns, '/settings', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'mademo_rest_settings',
        'permission_callback' => '__return_true',
    ] );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mademo_get_image( int $post_id, string $size = 'large' ): string {
    $tid = get_post_thumbnail_id( $post_id );
    if ( ! $tid ) {
        return '';
    }
    $src = wp_get_attachment_image_src( $tid, $size );
    return $src ? $src[0] : '';
}

function mademo_csv( ?string $v ): array {
    if ( ! $v ) {
        return [];
    }
    return array_values( array_filter( array_map( 'trim', explode( ',', $v ) ) ) );
}

/**
 * Convertit un champ textarea (une valeur par ligne) en tableau.
 *
 * @param mixed $v
 * @return string[]
 */
function mademo_lines( $v ): array {
    if ( ! is_string( $v ) || $v === '' ) {
        return [];
    }
    return array_values( array_filter( array_map( 'trim', explode( "\n", str_replace( "\r", '', $v ) ) ) ) );
}

/**
 * Convertit un tableau d'IDs WordPress en slugs — une seule requête DB.
 *
 * @param int[] $ids
 * @return string[]
 */
function mademo_ids_to_slugs( array $ids ): array {
    if ( empty( $ids ) ) {
        return [];
    }
    global $wpdb;
    $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
    // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
    $rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT ID, post_name FROM {$wpdb->posts} WHERE ID IN ($placeholders) AND post_status = 'publish'",
        ...$ids
    ), ARRAY_A );

    $map = [];
    foreach ( $rows as $row ) {
        $map[ (int) $row['ID'] ] = $row['post_name'];
    }
    return array_values( array_filter( array_map( fn( $id ) => $map[ (int) $id ] ?? null, $ids ) ) );
}

/**
 * Construit un tableau projectId => fragmentCount en une seule requête SQL.
 * Remplace les N WP_Query imbriquées.
 *
 * @param int[] $project_ids
 * @return array<int,int>
 */
function mademo_fragment_counts( array $project_ids ): array {
    if ( empty( $project_ids ) ) {
        return [];
    }
    global $wpdb;
    $rows = $wpdb->get_results(
        "SELECT pm.meta_value, COUNT(DISTINCT p.ID) as cnt
         FROM {$wpdb->posts} p
         INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
         WHERE p.post_type = 'mademo_fragment'
           AND p.post_status = 'publish'
           AND pm.meta_key = 'project_ids'
         GROUP BY pm.meta_value",
        ARRAY_A
    );

    $counts = [];
    foreach ( $rows as $row ) {
        // ACF stocke le champ relationship comme tableau sérialisé
        $ids = maybe_unserialize( $row['meta_value'] );
        if ( ! is_array( $ids ) ) {
            continue;
        }
        foreach ( $ids as $pid ) {
            $pid = (int) $pid;
            if ( in_array( $pid, $project_ids, true ) ) {
                $counts[ $pid ] = ( $counts[ $pid ] ?? 0 ) + (int) $row['cnt'];
            }
        }
    }
    return $counts;
}

function mademo_parse_query( WP_REST_Request $req ): array {
    $per_page = (int) ( $req->get_param( 'per_page' ) ?? 100 );
    $per_page = max( 1, min( $per_page, MADEMO_PER_PAGE_MAX ) );

    $valid_orderby = [ 'date', 'title', 'menu_order' ];
    $orderby       = in_array( $req->get_param( 'orderby' ), $valid_orderby, true )
        ? $req->get_param( 'orderby' )
        : 'menu_order';

    $order = strtoupper( (string) ( $req->get_param( 'order' ) ?? 'ASC' ) ) === 'DESC' ? 'DESC' : 'ASC';

    $args = [
        'post_status'            => 'publish',
        'posts_per_page'         => $per_page,
        'orderby'                => $orderby,
        'order'                  => $order,
        'no_found_rows'          => true,   // évite COUNT(*) inutile
        'update_post_meta_cache' => true,   // charge les meta en une requête
        'update_post_term_cache' => true,   // charge les termes en une requête
    ];

    if ( $theme = sanitize_text_field( (string) $req->get_param( 'theme' ) ) ) {
        $args['tax_query'] = [ [ 'taxonomy' => 'mademo_theme', 'field' => 'slug', 'terms' => $theme ] ];
    }

    return $args;
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

function mademo_rest_settings( WP_REST_Request $req ): WP_REST_Response {
    $has_acf = function_exists( 'get_field' );

    if ( ! $has_acf ) {
        return mademo_response( [] );
    }

    $email = (string) ( get_field( 'contact_email', 'option' ) ?? '' );

    $settings = [
        'subtitle'      => (string) ( get_field( 'subtitle',      'option' ) ?? 'Artiste · Designer · Photographe · Autrice' ),
        'city'          => (string) ( get_field( 'city',          'option' ) ?? 'Basée à Paris' ),
        'bio'           => (string) ( get_field( 'bio',           'option' ) ?? '' ),
        'bioSecondary'  => (string) ( get_field( 'bio_secondary', 'option' ) ?? '' ),
        'aboutImage'    => (string) ( get_field( 'about_image',   'option' ) ?? '' ),
        'practices'     => mademo_lines( get_field( 'practices', 'option' ) ),
        'available'     => mademo_lines( get_field( 'available', 'option' ) ),
        'contact'       => [
            'intro'         => (string) ( get_field( 'contact_intro',         'option' ) ?? '' ),
            'email'         => $email,
            'emailHref'     => $email ? 'mailto:' . $email : '',
            'instagram'     => (string) ( get_field( 'contact_instagram',     'option' ) ?? '' ),
            'instagramHref' => (string) ( get_field( 'contact_instagram_url', 'option' ) ?? '#' ),
            'vimeo'         => (string) ( get_field( 'contact_vimeo',         'option' ) ?? '' ),
            'vimeoHref'     => (string) ( get_field( 'contact_vimeo_url',     'option' ) ?? '#' ),
        ],
    ];

    return mademo_response( $settings );
}

function mademo_rest_projects( WP_REST_Request $req ): WP_REST_Response {
    $args              = mademo_parse_query( $req );
    $args['post_type'] = 'mademo_project';

    if ( $status = sanitize_text_field( (string) $req->get_param( 'status' ) ) ) {
        $args['tax_query'][] = [ 'taxonomy' => 'project_status', 'field' => 'slug', 'terms' => $status ];
    }

    $query    = new WP_Query( $args );
    $has_acf  = function_exists( 'get_field' );
    $post_ids = wp_list_pluck( $query->posts, 'ID' );

    // Compte les fragments de tous les projets en une seule requête
    $fragment_counts = mademo_fragment_counts( $post_ids );

    $projects = [];
    foreach ( $query->posts as $post ) {
        $st_terms    = wp_get_post_terms( $post->ID, 'project_status' );
        $th_terms    = wp_get_post_terms( $post->ID, 'mademo_theme' );
        $status_slug = ! is_wp_error( $st_terms ) && ! empty( $st_terms ) ? $st_terms[0]->slug : 'intuition';
        $themes      = ! is_wp_error( $th_terms ) ? wp_list_pluck( $th_terms, 'name' ) : [];

        $projects[] = [
            'id'            => $post->post_name,
            'wp_id'         => $post->ID,
            'title'         => get_the_title( $post ),
            'category'      => $has_acf ? ( get_field( 'category',     $post->ID ) ?? '' ) : '',
            'status'        => str_replace( [ '-', '_' ], ' ', $status_slug ),
            'year'          => $has_acf ? ( get_field( 'year',         $post->ID ) ?? '' ) : '',
            'question'      => $has_acf ? ( get_field( 'question',     $post->ID ) ?? '' ) : '',
            'manifeste'     => $has_acf ? ( get_field( 'manifeste',    $post->ID ) ?? '' ) : '',
            'description'   => get_the_excerpt( $post ) ?: wp_trim_words( get_the_content( null, false, $post ), 60 ),
            'lastUpdated'   => $has_acf ? ( get_field( 'last_updated', $post->ID ) ?? get_the_modified_date( 'j M Y', $post ) ) : get_the_modified_date( 'j M Y', $post ),
            'themes'        => $themes,
            'tags'          => $has_acf ? mademo_csv( get_field( 'tags', $post->ID ) ) : [],
            'image'         => mademo_get_image( $post->ID ),
            'imageMedium'   => mademo_get_image( $post->ID, 'medium_large' ),
            'fragmentCount' => $fragment_counts[ $post->ID ] ?? 0,
            'journal'       => $has_acf ? ( get_field( 'journal',    $post->ID ) ?? [] ) : [],
            'maintenant'    => $has_acf ? ( get_field( 'maintenant', $post->ID ) ?? [ 'cherche' => '', 'avancee' => '', 'bloque' => null, 'prochaine' => '', 'question' => '' ] ) : [],
            'references'    => $has_acf ? ( get_field( 'references', $post->ID ) ?? [] ) : [],
            'constellation' => [
                'x' => (int) ( $has_acf ? ( get_field( 'constellation_x', $post->ID ) ?: 0 ) : 0 ),
                'y' => (int) ( $has_acf ? ( get_field( 'constellation_y', $post->ID ) ?: 0 ) : 0 ),
                'r' => (int) ( $has_acf ? ( get_field( 'constellation_r', $post->ID ) ?: 18 ) : 18 ),
            ],
        ];
    }

    return mademo_response( $projects );
}

function mademo_rest_fragments( WP_REST_Request $req ): WP_REST_Response {
    $args              = mademo_parse_query( $req );
    $args['post_type'] = 'mademo_fragment';
    $args['orderby']   = 'date';
    $args['order']     = 'DESC';

    if ( $type = sanitize_text_field( (string) $req->get_param( 'type' ) ) ) {
        $args['tax_query'][] = [ 'taxonomy' => 'fragment_type', 'field' => 'slug', 'terms' => $type ];
    }

    if ( $project_slug = sanitize_text_field( (string) $req->get_param( 'project' ) ) ) {
        $project = get_page_by_path( $project_slug, OBJECT, 'mademo_project' );
        if ( $project ) {
            $args['meta_query'][] = [ 'key' => 'project_ids', 'value' => '"' . $project->ID . '"', 'compare' => 'LIKE' ];
        }
    }

    $query     = new WP_Query( $args );
    $has_acf   = function_exists( 'get_field' );
    $fragments = [];

    foreach ( $query->posts as $post ) {
        $type_terms = wp_get_post_terms( $post->ID, 'fragment_type' );
        $stat_terms = wp_get_post_terms( $post->ID, 'fragment_status' );
        $ftype      = ! is_wp_error( $type_terms ) && ! empty( $type_terms ) ? $type_terms[0]->slug : 'note';
        $fstatus    = ! is_wp_error( $stat_terms ) && ! empty( $stat_terms ) ? $stat_terms[0]->name : 'brut';
        $proj_ids   = $has_acf ? ( (array) ( get_field( 'project_ids', $post->ID ) ?? [] ) ) : [];

        $fragments[] = [
            'id'         => $post->post_name,
            'wp_id'      => $post->ID,
            'number'     => $has_acf ? ( get_field( 'number',   $post->ID ) ?? '' ) : '',
            'title'      => get_the_title( $post ),
            'date'       => $has_acf ? ( get_field( 'date',     $post->ID ) ?? get_the_date( 'j M Y', $post ) ) : get_the_date( 'j M Y', $post ),
            'type'       => $ftype,
            'content'    => wp_strip_all_tags( get_the_content( null, false, $post ) ),
            'status'     => $fstatus,
            'keywords'   => $has_acf ? mademo_csv( get_field( 'keywords', $post->ID ) ) : [],
            'projectIds' => mademo_ids_to_slugs( array_map( 'intval', $proj_ids ) ),
            'image'      => mademo_get_image( $post->ID ),
        ];
    }

    return mademo_response( $fragments );
}

function mademo_rest_texts( WP_REST_Request $req ): WP_REST_Response {
    $args              = mademo_parse_query( $req );
    $args['post_type'] = 'mademo_text';
    $args['orderby']   = 'date';
    $args['order']     = 'DESC';

    $query   = new WP_Query( $args );
    $has_acf = function_exists( 'get_field' );
    $texts   = [];

    foreach ( $query->posts as $post ) {
        $rel_raw  = $has_acf ? ( (array) ( get_field( 'related_project_id', $post->ID ) ?? [] ) ) : [];
        $rel_slug = ! empty( $rel_raw ) ? ( mademo_ids_to_slugs( [ (int) $rel_raw[0] ] )[0] ?? '' ) : '';

        $texts[] = [
            'id'               => $post->post_name,
            'wp_id'            => $post->ID,
            'title'            => get_the_title( $post ),
            'date'             => $has_acf ? ( get_field( 'date',      $post->ID ) ?? get_the_date( 'M Y', $post ) ) : get_the_date( 'M Y', $post ),
            'type'             => $has_acf ? ( get_field( 'type',      $post->ID ) ?? 'Texte' ) : 'Texte',
            'excerpt'          => $has_acf ? ( get_field( 'excerpt',   $post->ID ) ?? get_the_excerpt( $post ) ) : get_the_excerpt( $post ),
            'body'             => wp_strip_all_tags( get_the_content( null, false, $post ) ),
            'relatedProjectId' => $rel_slug,
            'readTime'         => $has_acf ? ( get_field( 'read_time', $post->ID ) ?? '' ) : '',
        ];
    }

    return mademo_response( $texts );
}

function mademo_rest_research( WP_REST_Request $req ): WP_REST_Response {
    $args              = mademo_parse_query( $req );
    $args['post_type'] = 'mademo_research';

    $query    = new WP_Query( $args );
    $has_acf  = function_exists( 'get_field' );
    $research = [];

    foreach ( $query->posts as $post ) {
        $proj_ids = $has_acf ? ( (array) ( get_field( 'project_ids', $post->ID ) ?? [] ) ) : [];

        $research[] = [
            'id'                 => $post->post_name,
            'wp_id'              => $post->ID,
            // Titre du territoire (WP post title)
            'title'              => get_the_title( $post ),
            // Question de recherche (champ ACF)
            'question'           => $has_acf ? ( get_field( 'question',             $post->ID ) ?? '' ) : '',
            'description'        => $has_acf ? ( get_field( 'description',          $post->ID ) ?? '' ) : '',
            'genealogies'        => mademo_lines( $has_acf ? get_field( 'genealogies',           $post->ID ) : null ),
            'contemporaryArtists'=> mademo_lines( $has_acf ? get_field( 'contemporary_artists',  $post->ID ) : null ),
            'forms'              => mademo_lines( $has_acf ? get_field( 'forms',                 $post->ID ) : null ),
            'projectIds'         => mademo_ids_to_slugs( array_map( 'intval', $proj_ids ) ),
            'fragmentCount'      => (int) ( $has_acf ? ( get_field( 'fragment_count', $post->ID ) ?? 0 ) : 0 ),
            'lastUpdated'        => $has_acf ? ( get_field( 'last_updated', $post->ID ) ?? get_the_modified_date( 'j M Y', $post ) ) : get_the_modified_date( 'j M Y', $post ),
        ];
    }

    return mademo_response( $research );
}

function mademo_response( array $data ): WP_REST_Response {
    $response = new WP_REST_Response( $data, 200 );
    $response->header( 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300' );
    $response->header( 'X-Mademo-Version', MADEMO_VERSION );
    return $response;
}

// ─── 8. CORS ──────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function (): void {
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
    add_filter( 'rest_pre_serve_request', function ( bool $served ): bool {
        $origin  = sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ?? '' ) );
        $allowed = array_filter( array_unique( [
            'http://localhost:5173',
            'http://localhost:3000',
            (string) getenv( 'MADEMO_CORS_ORIGIN' ),
            get_site_url(),
        ] ) );
        if ( $origin && in_array( $origin, $allowed, true ) ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
            header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
            header( 'Access-Control-Allow-Credentials: true' );
            header( 'Vary: Origin' );
        }
        return $served;
    } );
}, 15 );

// Répondre aux preflight OPTIONS sans exécuter WordPress complet
add_action( 'init', function (): void {
    if ( 'OPTIONS' === $_SERVER['REQUEST_METHOD'] && isset( $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ) ) {
        status_header( 204 );
        header( 'Content-Length: 0' );
        exit;
    }
} );

// ─── 9. Tailles d'images ──────────────────────────────────────────────────────

add_action( 'init', function (): void {
    add_image_size( 'mademo-hero',  1600, 900,  true );
    add_image_size( 'mademo-card',   800, 600,  true );
    add_image_size( 'mademo-thumb',  400, 300,  true );
    add_image_size( 'mademo-square', 600, 600,  true );
} );

add_filter( 'image_size_names_choose', function ( array $sizes ): array {
    return array_merge( $sizes, [
        'mademo-hero'   => 'Mademo — Héro (1600×900)',
        'mademo-card'   => 'Mademo — Carte (800×600)',
        'mademo-thumb'  => 'Mademo — Miniature (400×300)',
        'mademo-square' => 'Mademo — Carré (600×600)',
    ] );
} );

// ─── 10. Activation / Désactivation ──────────────────────────────────────────

register_activation_hook( __FILE__, function (): void {
    mademo_register_post_types();
    mademo_register_taxonomies();
    mademo_seed_terms();
    mademo_create_spa_pages();
    flush_rewrite_rules();

    $dir = MADEMO_PLUGIN_DIR . 'acf-json';
    if ( ! is_dir( $dir ) ) {
        wp_mkdir_p( $dir );
    }

    set_transient( 'mademo_activated', true, 30 );
} );

/**
 * Crée les pages WordPress pour chaque route React.
 * Permet à WordPress (et Nginx) de reconnaître les URLs de la SPA.
 */
function mademo_create_spa_pages(): void {
    $pages = [
        'atelier'       => 'Atelier',
        'projets'       => 'Projets',
        'fragments'     => 'Fragments',
        'recherches'    => 'Recherches',
        'textes'        => 'Textes',
        'constellation' => 'Constellation',
        'a-propos'      => 'À propos',
        'contact'       => 'Contact',
    ];

    foreach ( $pages as $slug => $title ) {
        // Ne créer que si la page n'existe pas déjà
        if ( get_page_by_path( $slug ) ) {
            continue;
        }
        wp_insert_post( [
            'post_title'   => $title,
            'post_name'    => $slug,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '',
            'meta_input'   => [ '_mademo_spa_page' => '1' ],
        ] );
    }
}

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

add_action( 'admin_notices', function (): void {
    if ( get_transient( 'mademo_activated' ) ) {
        delete_transient( 'mademo_activated' );
        printf(
            '<div class="notice notice-success is-dismissible"><p><strong>Mademo Studio activé.</strong> Taxonomies et termes créés. <a href="%s">Tableau de bord →</a></p></div>',
            esc_url( admin_url( 'admin.php?page=mademo-studio' ) )
        );
    }
} );
