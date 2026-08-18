# Mademo Studio

L'atelier vivant — une application React servie par WordPress.

Mademo Studio est une SPA React conçue pour fonctionner comme un front-end moderne couplé à un CMS headless WordPress. Le code frontend est livré via un bundle généré par Vite, alors que WordPress sert de couche éditoriale, de gestion des contenus et de moteur de déploiement.

## Architecture

```text
Figma Make / React + Tailwind
        ↓
push main
        ↓
GitHub Actions
        ↓
BUILD_TARGET=wordpress pnpm build
        ↓
ZIP signé HMAC-SHA256
        ↓
WordPress REST API /mademo/v1/deploy
        ↓
Validation admin
        ↓
wp-content/themes/mademo/dist/  ← bundle actif
```

Le front-end est une SPA React 18 basée sur Vite et Tailwind CSS v4. WordPress joue le rôle de CMS headless : il sert le bundle, expose les données via une API REST custom (`/mademo/v1/`) et sécurise le flux de déploiement.

---

## Structure du dépôt

```text
.
├── src/                         # Application React
│   ├── app/
│   │   └── App.tsx             # Composant racine, navigation, routes
│   ├── lib/
│   │   ├── api.ts              # Types + client WordPress REST
│   │   ├── fallback-data.ts    # Données statiques (dev sans WordPress)
│   │   └── useData.ts          # Hook central de chargement
│   └── styles/
│       ├── fonts.css           # Imports des polices
│       ├── theme.css           # Tokens, focus-visible, palette
│       ├── globals.css         # Styles globaux du site
│       └── index.css           # Entrée Tailwind
├── wordpress/
│   ├── theme/mademo/           # Thème WordPress actif
│   │   ├── functions.php       # Enqueue du bundle, config, fallback SPA
│   │   ├── index.php           # Shell HTML minimal
│   │   ├── style.css           # Header du thème
│   │   └── README.md           # Documentation thème
│   └── plugin/mademo-studio/   # Plugin custom WordPress
│       ├── mademo-studio.php   # CPT, ACF, REST API, admin
│       ├── acf-json/           # JSON ACF
│       └── includes/
│           └── deploy.php      # Endpoint et pipeline de déploiement
├── scripts/
│   ├── package-wordpress.sh    # Packaging du bundle WordPress
│   └── README.md               # Documentation scripts
├── audit/
│   ├── colors.md               # Audit couleurs
│   └── opquast.md              # Checklist Opquast
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD GitHub Actions
├── index.html                  # Shell SPA pour le dev Vite
├── vite.config.ts              # Configuration Vite + build WordPress
├── package.json                # Scripts, dépendances, scripts de déploiement
├── pnpm-workspace.yaml         # Workspace pnpm
├── postcss.config.mjs          # PostCSS
├── README.md                   # Ce fichier
├── ATTRIBUTIONS.md             # Crédits et licences
├── default_shadcn_theme.css    # Thème visuel de base
└── guidelines/
    └── Guidelines.md          # Directives de design et d'intégration
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

### 1. Installer les dépendances

```bash
pnpm install
```

> Sur certaines versions de pnpm, il faut approuver les scripts natives de build avant l'installation : `pnpm approve-builds --all`.

### 2. Lancer le projet en mode développement

```bash
pnpm dev
```

L'application est ensuite accessible sur `http://localhost:5173` et fonctionne avec les données de secours de `src/lib/fallback-data.ts`.

### 3. Builder pour WordPress

```bash
BUILD_TARGET=wordpress pnpm build
```

Le bundle est généré dans `wordpress/theme/mademo/dist/`.

### 4. Déployer le thème et le plugin localement

```bash
pnpm deploy:all
```

Cette commande copie le plugin, le thème et le build vers l'installation WordPress locale configurée dans `package.json` (`deploy:plugin`, `deploy:theme`, `dev:local`). Ajustez les chemins si votre environnement local diffère.

---

## Pipeline CI/CD

### Vue d'ensemble

```text
push → main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       1. pnpm install
       2. BUILD_TARGET=wordpress pnpm build
       3. Génération d'un manifest de déploiement
       4. Création d'un ZIP signé HMAC-SHA256
       5. POST /mademo/v1/deploy
       6. Upload artifact GitHub (30 jours)
  └─ WordPress reçoit le ZIP
       • Vérifie la signature
       • Stocke dans wp-content/uploads/mademo-deploys/
       • Notifie l'admin par e-mail
  └─ Admin WordPress → Mademo Studio → Déploiements
       • [✓ Appliquer] → extrait dist/ dans le thème
       • [✗ Rejeter] → supprime le ZIP, aucun impact sur le site
```

### Configuration initiale (à faire une fois)

**Dans l'admin WordPress → Mademo Studio → Déploiements**

1. Générer un secret fort :
   ```bash
   openssl rand -hex 32
   ```
2. Le copier dans le champ **Secret de déploiement**.
3. Noter l'URL d'envoi affichée : `https://ton-site.fr/wp-json/mademo/v1/deploy`.

**Dans GitHub → Settings → Secrets → Actions**

| Secret | Valeur |
|---|---|
| `MADEMO_DEPLOY_SECRET` | Le secret généré précédemment |
| `MADEMO_DEPLOY_URL` | L'URL d'envoi WordPress |

### Rollback

Chaque build validé est conservé dans l'historique. En cas de régression, il suffit d'appliquer le build précédent depuis la page Déploiements.

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

Paramètres courants : `per_page`, `orderby`, `order`, `theme`.

En développement, l'application utilise automatiquement les données de `src/lib/fallback-data.ts` si `window.MADEMO_CONFIG` est absent.

---

## Accessibilité

Le site cible **WCAG 2.1 AA** et la checklist **Opquast** :

- Lien d'évitement `Passer au contenu principal`
- Landmark `<main id="main-content">`
- Piège de focus sur les modaux et le menu de navigation
- `aria-current="page"` sur la navigation active
- `aria-live="polite"` pour les changements de page
- Hiérarchie de titres unique et logique
- SVG Constellation navigable au clavier (Tab + Entrée/Espace)
- `document.title` mis à jour à chaque changement de page
- Anneau `focus-visible` visible sur fond clair et sombre
- Contraste `--muted-foreground` : 5.74:1 (WCAG AA)

---

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 18, TypeScript |
| Style | Tailwind CSS v4, CSS custom properties |
| Animations | motion/react |
| Icônes | Lucide React |
| Fonts | Fraunces, Bricolage Grotesque, DM Mono |
| Build | Vite 6, pnpm |
| CMS | WordPress 6.4+, ACF Pro |
| CI/CD | GitHub Actions |

---

## Dépannage rapide

### `pnpm install` échoue sur les scripts natifs

```bash
pnpm approve-builds --all
pnpm install
```

### Le build WordPress ne se fait pas

```bash
BUILD_TARGET=wordpress pnpm build
```

### Le bundle ne s'affiche pas dans WordPress

- Vérifier que le thème `wordpress/theme/mademo` est bien activé
- Vérifier la présence du build dans `dist/`
- Vérifier les logs de déploiement dans l'admin WordPress

---

## Licence

Ce projet est utilisé pour un atelier de création numérique et de publication web. Les contenus et licences externes sont documentés dans [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
