# Mademo Studio — Thème WordPress

Thème headless minimaliste. Son seul rôle est de charger le bundle React compilé et d'exposer la configuration WordPress à l'application.

**Tout le rendu visuel est géré par React côté client.** Ce thème ne contient aucun template Blade, aucun shortcode, aucune mise en page PHP.

## Contenu

```
mademo/
├── style.css        # En-tête du thème (obligatoire WordPress)
├── functions.php    # Enqueue bundle, MADEMO_CONFIG, SPA fallback
├── index.php        # Shell HTML : <div id="root"></div>
├── header.php       # <!DOCTYPE html> … <body>
├── footer.php       # </body></html>
├── 404.php          # Redirige vers React (même shell)
├── .htaccess        # À copier à la racine WordPress — compression, cache, SPA
└── dist/            # Bundle React (généré par `pnpm build:wp` — absent en dev)
    ├── .vite/
    │   └── manifest.json
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

## Installation

### Via ZIP (recommandé en production)

```bash
pnpm package:wp
```

Installe `releases/mademo-theme-x.x.x.zip` via **Apparence → Thèmes → Téléverser** dans WordPress.

> Installer le plugin `mademo-studio` **avant** le thème.

### En local (Local by Flywheel)

```bash
pnpm deploy:theme   # copie le thème
pnpm build:wp       # compile React dans dist/
```

### Manuellement

1. Copier ce dossier dans `wp-content/themes/mademo/`
2. Lancer `BUILD_TARGET=wordpress pnpm build` depuis la racine du dépôt
3. Copier `dist/` généré dans `wp-content/themes/mademo/dist/`
4. Activer le thème dans WordPress

## .htaccess

Le fichier `.htaccess` fourni est destiné à la **racine WordPress** (`/public_html/` ou `/www/`), pas au dossier thème. Il configure :

- Compression Brotli / Gzip
- Cache navigateur (assets hashés Vite → 1 an immuable)
- Réécriture SPA : toutes les URLs non-fichier → `index.php`
- Protection : accès bloqué à `.env`, `wp-config.php`, `xmlrpc.php`
- Types MIME corrects pour `.mjs`, `.woff2`, `.webp`

## `functions.php` — ce qu'il fait

| Fonction | Rôle |
|---|---|
| `mademo_enqueue_assets()` | Lit `dist/.vite/manifest.json`, enqueue JS + CSS avec les hashes corrects |
| `mademo_inline_config()` | Injecte `window.MADEMO_CONFIG` (apiBase, nonce, siteUrl, uploadsUrl) avant le bundle |
| `template_include` filter | Force toutes les URLs non-admin à passer par `index.php` (SPA fallback) |
| `mademo_script_attributes()` | Ajoute `type="module" crossorigin` sur les `<script>` React |

## `window.MADEMO_CONFIG`

L'objet injecté par `functions.php` dans le `<head>` :

```js
window.MADEMO_CONFIG = {
  apiBase:    "https://monsite.fr/wp-json/mademo/v1",
  nonce:      "abc123",          // X-WP-Nonce pour les requêtes authentifiées
  siteUrl:    "https://monsite.fr",
  uploadsUrl: "https://monsite.fr/wp-content/uploads",
  isLoggedIn: false,
  themeUrl:   "https://monsite.fr/wp-content/themes/mademo"
}
```

Si cet objet est absent (dev Vite local), l'application utilise `src/lib/fallback-data.ts`.

## Dépendances

- **Plugin Mademo Studio** — obligatoire (CPT, ACF, REST API)
- **ACF Pro 6+** — pour les champs avancés (projets, fragments, recherche)
- WordPress 6.4+, PHP 8.1+
