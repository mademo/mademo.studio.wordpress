# Mademo Studio

L'atelier vivant — application React servie par WordPress.

## Architecture

```
Figma Make (React + Tailwind)
    ↓ push main
GitHub Actions
    ↓ BUILD_TARGET=wordpress pnpm build → ZIP signé HMAC-SHA256
WordPress REST API  /mademo/v1/deploy
    ↓ admin valide
wp-content/themes/mademo/dist/   ← bundle actif
```

Le front-end est une **SPA React 18** (Vite + Tailwind CSS v4). WordPress joue le rôle de CMS headless : il sert le bundle et expose les données via une API REST custom (`/mademo/v1/`). Tout le rendu est côté client.

---

## Structure du dépôt

```
.
├── src/                        # Application React
│   ├── app/App.tsx             # Composant racine (router, pages, nav)
│   ├── lib/
│   │   ├── api.ts              # Types TypeScript + client WordPress REST
│   │   ├── fallback-data.ts    # Données statiques (dev sans WordPress)
│   │   └── useData.ts          # Hook central de chargement
│   └── styles/
│       ├── fonts.css           # Imports Google Fonts
│       ├── theme.css           # Tokens Tailwind + focus-visible
│       └── index.css           # Entrée Tailwind
├── wordpress/
│   ├── theme/mademo/           # Thème WordPress
│   │   ├── functions.php       # Enqueue bundle, expose MADEMO_CONFIG, SPA fallback
│   │   ├── index.php           # Shell HTML minimal
│   │   └── .htaccess           # Compression, cache, réécriture SPA
│   └── plugin/mademo-studio/   # Plugin custom
│       ├── mademo-studio.php   # CPT, ACF, REST API, administration
│       └── includes/
│           └── deploy.php      # Pipeline CI/CD (endpoint + admin validation)
├── .github/
│   └── workflows/
│       └── deploy.yml          # Build automatique + envoi à WordPress
├── index.html                  # Shell SPA (dev)
├── vite.config.ts
└── package.json
```

---

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| WordPress | 6.4+ |
| PHP | 8.1+ |
| ACF Pro | 6+ |

---

## Installation locale

### 1. Dépendances Node

```bash
pnpm install
```

### 2. Développement (sans WordPress)

```bash
pnpm dev
```

L'application démarre sur `http://localhost:5173` avec les données statiques de `fallback-data.ts`.

### 3. Build ciblé WordPress

```bash
BUILD_TARGET=wordpress pnpm build
```

Les assets sont émis dans `wordpress/theme/mademo/dist/`.

### 4. Déployer le thème et le plugin en local

```bash
pnpm deploy:all
```

Copie le plugin, le thème et le build dans votre installation WordPress locale (chemin défini dans `package.json` → `build:wp`). Adaptez le chemin si vous n'utilisez pas Local by Flywheel.

---

## Pipeline CI/CD

### Vue d'ensemble

```
push → main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       1. pnpm install + BUILD_TARGET=wordpress pnpm build
       2. Génère deploy-manifest.json (commit, branche, auteur, horodatage)
       3. Crée mademo-dist-{sha7}.zip
       4. Signe le ZIP : HMAC-SHA256(fichier, MADEMO_DEPLOY_SECRET)
       5. POST /mademo/v1/deploy  [multipart + signature en header]
       6. Upload artifact GitHub (sauvegarde 30 jours)
  └─ WordPress reçoit le ZIP
       • Vérifie la signature
       • Stocke dans wp-content/uploads/mademo-deploys/
       • Notifie l'admin par email
  └─ Admin WordPress → Mademo Studio → Déploiements
       • [✓ Appliquer]  → extrait dist/ dans le thème, mise en ligne immédiate
       • [✗ Rejeter]    → supprime le ZIP, aucun impact sur le site
```

### Configuration initiale (une seule fois)

**Dans WordPress admin → Mademo Studio → Déploiements**

1. Génère un secret fort :
   ```bash
   openssl rand -hex 32
   ```
2. Colle-le dans le champ **Secret de déploiement** et enregistre.
3. Note l'**URL d'envoi** affichée (`https://ton-site.fr/wp-json/mademo/v1/deploy`).

**Dans GitHub → Settings → Secrets → Actions**

| Secret | Valeur |
|---|---|
| `MADEMO_DEPLOY_SECRET` | Le secret généré ci-dessus |
| `MADEMO_DEPLOY_URL` | L'URL d'envoi copiée depuis l'admin WP |

### Rollback

Chaque build appliqué est conservé dans l'historique. En cas de problème (écran blanc, régression), applique simplement le build précédent depuis la page Déploiements.

---

## API REST WordPress

Base : `https://ton-site.fr/wp-json/mademo/v1/`

| Endpoint | Description |
|---|---|
| `GET /projects` | Tous les projets publiés |
| `GET /fragments` | Tous les fragments |
| `GET /texts` | Tous les textes |
| `GET /research` | Territoires de recherche |
| `POST /deploy` | Réception d'un build (CI/CD uniquement) |

Paramètres communs : `per_page`, `orderby`, `order`, `theme`.

En développement, l'application utilise automatiquement les données de `src/lib/fallback-data.ts` si `window.MADEMO_CONFIG` est absent.

---

## Accessibilité

Le site cible **WCAG 2.1 AA** et la checklist **Opquast** :

- Lien d'évitement `Passer au contenu principal`
- Landmark `<main id="main-content">`
- Piège de focus sur tous les modaux (menus, recherche, fil de recherche)
- `aria-current="page"` sur la navigation active
- `aria-live="polite"` pour les changements de page
- Hiérarchie de titres `<h1>` unique par page
- SVG Constellation navigable au clavier (Tab + Entrée/Espace)
- `document.title` mis à jour à chaque changement de page
- Anneau `focus-visible` visible sur fond clair et fond sombre
- Contraste `--muted-foreground` : 5.74:1 (WCAG AA)

---

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 18, TypeScript |
| Style | Tailwind CSS v4, CSS custom properties |
| Animations | motion/react |
| Icônes | Lucide React |
| Fonts | Fraunces (display), Bricolage Grotesque (body), DM Mono |
| Build | Vite 6, pnpm |
| CMS | WordPress 6.4+, ACF Pro |
| CI/CD | GitHub Actions |
