<?php
/**
 * Mademo Studio — Pipeline de déploiement CI/CD
 *
 * Flux :
 *   GitHub Actions → POST /mademo/v1/deploy (HMAC-SHA256)
 *     → ZIP stocké dans /uploads/mademo-deploys/
 *     → Admin WP : valider ou rejeter
 *     → "Appliquer" : extraction dans /wp-content/themes/mademo/dist/
 *
 * Secrets GitHub requis :
 *   MADEMO_DEPLOY_URL    = https://monsite.fr/wp-json/mademo/v1/deploy
 *   MADEMO_DEPLOY_SECRET = (valeur de l'option WP mademo_deploy_secret)
 */

defined( 'ABSPATH' ) || exit;

define( 'MADEMO_DEPLOY_DIR',        WP_CONTENT_DIR . '/uploads/mademo-deploys/' );
define( 'MADEMO_DEPLOY_OPTION',     'mademo_deploy_queue' );
define( 'MADEMO_DEPLOY_MAX_STORED', 20 ); // nb max de builds conservés sur disque

// ─── 1. Endpoint REST ─────────────────────────────────────────────────────────

add_action( 'rest_api_init', function (): void {
    register_rest_route( 'mademo/v1', '/deploy', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'mademo_rest_receive_deploy',
        'permission_callback' => '__return_true', // auth via HMAC — pas de nonce WP
    ] );
} );

function mademo_rest_receive_deploy( WP_REST_Request $request ): WP_REST_Response {

    // 1a. Récupérer le fichier
    $files = $request->get_file_params();
    $file  = $files['dist_zip'] ?? null;

    if ( ! $file || $file['error'] !== UPLOAD_ERR_OK ) {
        return new WP_REST_Response( [ 'error' => 'Fichier manquant ou erreur d\'upload.', 'code' => $file['error'] ?? -1 ], 400 );
    }

    // 1b. Vérifier la configuration
    $secret = get_option( 'mademo_deploy_secret', '' );
    if ( empty( $secret ) ) {
        return new WP_REST_Response( [ 'error' => 'Secret de déploiement non configuré dans l\'admin WordPress.' ], 500 );
    }

    // 1c. Vérifier la signature HMAC
    $sig_header = $request->get_header( 'X_Mademo_Deploy_Signature' );
    if ( ! $sig_header ) {
        return new WP_REST_Response( [ 'error' => 'En-tête X-Mademo-Deploy-Signature manquant.' ], 401 );
    }

    $file_content = file_get_contents( $file['tmp_name'] );
    if ( $file_content === false ) {
        return new WP_REST_Response( [ 'error' => 'Impossible de lire le fichier uploadé.' ], 500 );
    }

    $expected = 'sha256=' . hash_hmac( 'sha256', $file_content, $secret );
    if ( ! hash_equals( $expected, $sig_header ) ) {
        return new WP_REST_Response( [ 'error' => 'Signature invalide. Vérifiez MADEMO_DEPLOY_SECRET.' ], 401 );
    }

    // 1d. Métadonnées depuis les headers + form field
    $commit   = sanitize_text_field( (string) ( $request->get_header( 'X_Mademo_Deploy_Commit' )   ?? '' ) );
    $branch   = sanitize_text_field( (string) ( $request->get_header( 'X_Mademo_Deploy_Branch' )   ?? 'main' ) );
    $actor    = sanitize_text_field( (string) ( $request->get_header( 'X_Mademo_Deploy_Actor' )    ?? '' ) );
    $workflow = sanitize_text_field( (string) ( $request->get_header( 'X_Mademo_Deploy_Workflow' ) ?? '' ) );
    $message  = sanitize_textarea_field( (string) ( $request->get_param( 'message' ) ?? '' ) );

    // 1e. Préparer le dossier de stockage
    if ( ! is_dir( MADEMO_DEPLOY_DIR ) ) {
        wp_mkdir_p( MADEMO_DEPLOY_DIR );
        // Protéger le dossier contre l'accès HTTP direct
        file_put_contents( MADEMO_DEPLOY_DIR . '.htaccess', "Require all denied\n" );
    }

    // 1f. Nommer et déplacer le ZIP
    $short_sha = substr( $commit, 0, 7 ) ?: uniqid();
    $deploy_id = gmdate( 'YmdHis' ) . '-' . $short_sha;
    $zip_path  = MADEMO_DEPLOY_DIR . $deploy_id . '.zip';

    if ( ! move_uploaded_file( $file['tmp_name'], $zip_path ) ) {
        return new WP_REST_Response( [ 'error' => 'Impossible de sauvegarder le fichier sur le serveur.' ], 500 );
    }

    // 1g. Ajouter à la file d'attente
    $queue     = get_option( MADEMO_DEPLOY_OPTION, [] );
    $queue[]   = [
        'id'          => $deploy_id,
        'zip_path'    => $zip_path,
        'commit'      => $commit,
        'short_sha'   => $short_sha,
        'branch'      => $branch,
        'actor'       => $actor,
        'message'     => $message,
        'workflow'    => $workflow,
        'received_at' => gmdate( 'Y-m-d H:i:s' ),
        'status'      => 'pending',
    ];

    // Purger les vieux ZIPs rejetés au-delà du seuil
    mademo_purge_old_deploys( $queue );
    update_option( MADEMO_DEPLOY_OPTION, $queue );

    // 1h. Notifier l'administrateur
    $admin_email = get_option( 'admin_email' );
    $admin_url   = admin_url( 'admin.php?page=mademo-deploys' );
    wp_mail(
        $admin_email,
        sprintf( '[Mademo Studio] Build %s en attente de validation', $short_sha ),
        sprintf(
            "Un nouveau build React est prêt à être déployé.\n\n" .
            "Commit  : %s\nBranche : %s\nAuteur  : %s\nMessage : %s\n\n" .
            "Valider ou rejeter → %s",
            $commit, $branch, $actor, $message, $admin_url
        )
    );

    return new WP_REST_Response(
        [
            'success'   => true,
            'deploy_id' => $deploy_id,
            'message'   => "Build {$short_sha} reçu. En attente de validation dans l'admin.",
        ],
        201
    );
}

// ─── 2. Admin — menu et page ──────────────────────────────────────────────────

add_action( 'admin_menu', function (): void {
    add_submenu_page(
        'mademo-studio',
        'Déploiements',
        'Déploiements',
        'manage_options',
        'mademo-deploys',
        'mademo_deploys_page'
    );
} );

function mademo_deploys_page(): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Accès refusé.' );
    }

    $queue  = get_option( MADEMO_DEPLOY_OPTION, [] );
    $secret = get_option( 'mademo_deploy_secret', '' );

    // ── Enregistrer le secret ──────────────────────────────────────────────────
    if ( isset( $_POST['mademo_save_secret'] ) ) {
        check_admin_referer( 'mademo_save_secret' );
        $new_secret = sanitize_text_field( wp_unslash( $_POST['deploy_secret'] ?? '' ) );
        update_option( 'mademo_deploy_secret', $new_secret );
        $secret = $new_secret;
        echo '<div class="notice notice-success is-dismissible"><p><strong>Secret mis à jour.</strong></p></div>';
    }

    // ── Notices ────────────────────────────────────────────────────────────────
    if ( ! empty( $_GET['applied'] ) ) {
        $sha = esc_html( $_GET['commit'] ?? '' );
        echo "<div class='notice notice-success is-dismissible'><p>✓ Build <code>{$sha}</code> appliqué — thème mis à jour.</p></div>";
    }
    if ( ! empty( $_GET['rejected'] ) ) {
        echo "<div class='notice notice-warning is-dismissible'><p>Build rejeté et supprimé.</p></div>";
    }
    if ( ! empty( $_GET['error'] ) ) {
        $errors = [
            'not_found'       => 'Déploiement introuvable dans la file.',
            'file_missing'    => 'Le fichier ZIP est introuvable sur le serveur.',
            'zip_error'       => 'Impossible d\'ouvrir le fichier ZIP (corrompu ?).',
            'unsafe_zip'      => 'ZIP rejeté : chemin suspect (traversée de répertoire).',
            'no_dist_folder'  => 'Le ZIP ne contient pas de dossier <code>dist/</code>.',
        ];
        $msg = $errors[ sanitize_key( $_GET['error'] ) ] ?? 'Erreur inconnue.';
        echo "<div class='notice notice-error is-dismissible'><p>❌ {$msg}</p></div>";
    }

    $pending  = array_values( array_filter( $queue, fn( $d ) => $d['status'] === 'pending' ) );
    $history  = array_reverse( array_values( array_filter( $queue, fn( $d ) => $d['status'] !== 'pending' ) ) );
    $history  = array_slice( $history, 0, 15 );

    // ── HTML ───────────────────────────────────────────────────────────────────
    ?>
    <div class="wrap">
        <h1>Déploiements — Mademo Studio</h1>

        <!-- Configuration -->
        <div style="background:#fff;border:1px solid #c3c4c7;padding:20px 24px;margin:20px 0 28px">
            <h2 style="margin-top:0">Configuration GitHub Actions</h2>
            <form method="post">
                <?php wp_nonce_field( 'mademo_save_secret' ); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="deploy_secret">Secret de déploiement</label></th>
                        <td>
                            <input type="password" id="deploy_secret" name="deploy_secret"
                                   value="<?= esc_attr( $secret ) ?>" class="regular-text"
                                   autocomplete="new-password" />
                            <p class="description">
                                Valeur identique à <code>MADEMO_DEPLOY_SECRET</code> dans
                                <em>GitHub → Settings → Secrets → Actions</em>.
                            </p>
                            <?php if ( empty( $secret ) ) : ?>
                                <p style="color:#d63638;margin-top:6px">
                                    ⚠ Aucun secret configuré — tous les déploiements seront refusés.
                                </p>
                            <?php else : ?>
                                <p style="color:#00a32a;margin-top:6px">✓ Secret configuré.</p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">URL d'envoi</th>
                        <td>
                            <code><?= esc_html( rest_url( 'mademo/v1/deploy' ) ) ?></code>
                            <p class="description">
                                À copier dans <code>MADEMO_DEPLOY_URL</code> dans les secrets GitHub.
                            </p>
                        </td>
                    </tr>
                </table>
                <p>
                    <button type="submit" name="mademo_save_secret" class="button button-primary">
                        Enregistrer
                    </button>
                </p>
            </form>
        </div>

        <!-- En attente -->
        <h2>
            En attente de validation
            <span style="font-size:14px;font-weight:400;color:#646970;margin-left:8px">
                (<?= count( $pending ) ?>)
            </span>
        </h2>

        <?php if ( empty( $pending ) ) : ?>
            <p style="color:#646970">Aucun déploiement en attente.</p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Commit</th>
                        <th>Branche</th>
                        <th>Auteur GitHub</th>
                        <th>Message</th>
                        <th>Reçu le</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $pending as $deploy ) : ?>
                    <tr>
                        <td>
                            <code style="font-size:13px"><?= esc_html( $deploy['short_sha'] ) ?></code>
                        </td>
                        <td><?= esc_html( $deploy['branch'] ) ?></td>
                        <td><?= esc_html( $deploy['actor'] ) ?></td>
                        <td style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                            <?= esc_html( $deploy['message'] ) ?>
                        </td>
                        <td><?= esc_html( $deploy['received_at'] ) ?></td>
                        <td style="white-space:nowrap">
                            <!-- Appliquer -->
                            <form method="post"
                                  action="<?= esc_url( admin_url( 'admin-post.php' ) ) ?>"
                                  style="display:inline"
                                  onsubmit="return confirm('Appliquer ce build ?\n\nIl remplacera le dossier dist/ du thème actif.\nCette action est immédiate et visible par les visiteurs.')">
                                <input type="hidden" name="action"    value="mademo_apply_deploy">
                                <input type="hidden" name="deploy_id" value="<?= esc_attr( $deploy['id'] ) ?>">
                                <?php wp_nonce_field( 'mademo_apply_' . $deploy['id'] ); ?>
                                <button type="submit" class="button button-primary">
                                    ✓ Appliquer
                                </button>
                            </form>
                            <!-- Rejeter -->
                            <form method="post"
                                  action="<?= esc_url( admin_url( 'admin-post.php' ) ) ?>"
                                  style="display:inline;margin-left:6px">
                                <input type="hidden" name="action"    value="mademo_reject_deploy">
                                <input type="hidden" name="deploy_id" value="<?= esc_attr( $deploy['id'] ) ?>">
                                <?php wp_nonce_field( 'mademo_reject_' . $deploy['id'] ); ?>
                                <button type="submit" class="button">✗ Rejeter</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <!-- Historique -->
        <h2 style="margin-top:32px">
            Historique
            <span style="font-size:14px;font-weight:400;color:#646970;margin-left:8px">
                (15 derniers)
            </span>
        </h2>

        <?php if ( empty( $history ) ) : ?>
            <p style="color:#646970">Aucun déploiement dans l'historique.</p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Commit</th>
                        <th>Branche</th>
                        <th>Auteur</th>
                        <th>Message</th>
                        <th>Statut</th>
                        <th>Par</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $history as $deploy ) :
                    $is_applied = $deploy['status'] === 'applied';
                    $label      = $is_applied ? '✓ Appliqué' : '✗ Rejeté';
                    $color      = $is_applied ? '#00a32a'    : '#d63638';
                    $date       = $deploy['applied_at'] ?? $deploy['rejected_at'] ?? $deploy['received_at'];
                    $by         = $deploy['applied_by']  ?? $deploy['rejected_by']  ?? '';
                ?>
                    <tr>
                        <td><code style="font-size:13px"><?= esc_html( $deploy['short_sha'] ) ?></code></td>
                        <td><?= esc_html( $deploy['branch'] ) ?></td>
                        <td><?= esc_html( $deploy['actor'] ) ?></td>
                        <td style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                            <?= esc_html( $deploy['message'] ) ?>
                        </td>
                        <td>
                            <span style="color:<?= esc_attr( $color ) ?>;font-weight:600">
                                <?= esc_html( $label ) ?>
                            </span>
                        </td>
                        <td><?= esc_html( $by ) ?></td>
                        <td><?= esc_html( $date ) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    <?php
}

// ─── 3. Action : appliquer ────────────────────────────────────────────────────

add_action( 'admin_post_mademo_apply_deploy', function (): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Accès refusé.' );
    }

    $deploy_id = sanitize_text_field( wp_unslash( $_POST['deploy_id'] ?? '' ) );
    check_admin_referer( 'mademo_apply_' . $deploy_id );

    $queue  = get_option( MADEMO_DEPLOY_OPTION, [] );
    $deploy = null;
    $index  = null;

    foreach ( $queue as $i => $d ) {
        if ( $d['id'] === $deploy_id && $d['status'] === 'pending' ) {
            $deploy = $d;
            $index  = $i;
            break;
        }
    }

    if ( $deploy === null ) {
        wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&error=not_found' ) );
        exit;
    }

    if ( ! file_exists( $deploy['zip_path'] ) ) {
        wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&error=file_missing' ) );
        exit;
    }

    // Ouvrir le ZIP
    $zip = new ZipArchive();
    if ( $zip->open( $deploy['zip_path'] ) !== true ) {
        wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&error=zip_error' ) );
        exit;
    }

    // Contrôle de sécurité : aucun chemin relatif (path traversal)
    for ( $i = 0; $i < $zip->numFiles; $i++ ) {
        $name = $zip->getNameIndex( $i );
        if ( $name === false || strpos( $name, '..' ) !== false ) {
            $zip->close();
            wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&error=unsafe_zip' ) );
            exit;
        }
    }

    // Extraction dans un dossier temporaire
    $tmp_dir = MADEMO_DEPLOY_DIR . 'extract-' . $deploy_id . '/';
    wp_mkdir_p( $tmp_dir );
    $zip->extractTo( $tmp_dir );
    $zip->close();

    $extracted_dist = $tmp_dir . 'dist/';
    if ( ! is_dir( $extracted_dist ) ) {
        mademo_rrmdir( $tmp_dir );
        wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&error=no_dist_folder' ) );
        exit;
    }

    // Remplacer le dist/ du thème
    $theme_dist = get_template_directory() . '/dist/';
    if ( is_dir( $theme_dist ) ) {
        mademo_rrmdir( $theme_dist );
    }
    rename( $extracted_dist, $theme_dist );
    mademo_rrmdir( $tmp_dir );

    // Invalider le cache manifest
    wp_cache_delete( 'mademo_manifest_' . filemtime( $theme_dist . '.vite/manifest.json' ), 'mademo' );
    wp_cache_flush_group( 'mademo' );

    // Mettre à jour la file
    $queue[ $index ]['status']     = 'applied';
    $queue[ $index ]['applied_at'] = gmdate( 'Y-m-d H:i:s' );
    $queue[ $index ]['applied_by'] = wp_get_current_user()->user_login;

    // Supprimer le ZIP appliqué (libérer de l'espace)
    if ( file_exists( $deploy['zip_path'] ) ) {
        unlink( $deploy['zip_path'] );
        $queue[ $index ]['zip_path'] = '';
    }

    update_option( MADEMO_DEPLOY_OPTION, $queue );

    wp_safe_redirect( admin_url(
        'admin.php?page=mademo-deploys&applied=1&commit=' . urlencode( $deploy['short_sha'] )
    ) );
    exit;
} );

// ─── 4. Action : rejeter ──────────────────────────────────────────────────────

add_action( 'admin_post_mademo_reject_deploy', function (): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Accès refusé.' );
    }

    $deploy_id = sanitize_text_field( wp_unslash( $_POST['deploy_id'] ?? '' ) );
    check_admin_referer( 'mademo_reject_' . $deploy_id );

    $queue = get_option( MADEMO_DEPLOY_OPTION, [] );

    foreach ( $queue as $i => $d ) {
        if ( $d['id'] === $deploy_id && $d['status'] === 'pending' ) {
            if ( file_exists( $d['zip_path'] ) ) {
                unlink( $d['zip_path'] );
            }
            $queue[ $i ]['status']      = 'rejected';
            $queue[ $i ]['rejected_at'] = gmdate( 'Y-m-d H:i:s' );
            $queue[ $i ]['rejected_by'] = wp_get_current_user()->user_login;
            $queue[ $i ]['zip_path']    = '';
            break;
        }
    }

    update_option( MADEMO_DEPLOY_OPTION, $queue );
    wp_safe_redirect( admin_url( 'admin.php?page=mademo-deploys&rejected=1' ) );
    exit;
} );

// ─── 5. Nettoyage ─────────────────────────────────────────────────────────────

/**
 * Supprime les entrées rejetées en excès pour garder la file courte.
 *
 * @param array<int,array<string,mixed>> $queue (modifié par référence)
 */
function mademo_purge_old_deploys( array &$queue ): void {
    $non_pending = array_filter( $queue, fn( $d ) => $d['status'] !== 'pending' );

    if ( count( $non_pending ) <= MADEMO_DEPLOY_MAX_STORED ) {
        return;
    }

    // Trier par date de réception (plus ancien en premier)
    usort( $non_pending, fn( $a, $b ) => strcmp( $a['received_at'], $b['received_at'] ) );
    $to_delete = array_slice( $non_pending, 0, count( $non_pending ) - MADEMO_DEPLOY_MAX_STORED );

    foreach ( $to_delete as $old ) {
        if ( ! empty( $old['zip_path'] ) && file_exists( $old['zip_path'] ) ) {
            unlink( $old['zip_path'] );
        }
    }

    $ids_to_delete = array_column( $to_delete, 'id' );
    $queue = array_values( array_filter(
        $queue,
        fn( $d ) => ! in_array( $d['id'], $ids_to_delete, true )
    ) );
}

/**
 * Suppression récursive d'un dossier.
 */
function mademo_rrmdir( string $dir ): void {
    if ( ! is_dir( $dir ) ) {
        return;
    }
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS ),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ( $items as $item ) {
        $item->isDir() ? rmdir( $item->getRealPath() ) : unlink( $item->getRealPath() );
    }
    rmdir( $dir );
}
