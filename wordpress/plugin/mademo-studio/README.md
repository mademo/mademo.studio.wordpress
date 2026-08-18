# Mademo Studio — Plugin WordPress

Plugin WordPress sur-mesure pour Mademo Studio. Il fournit les Custom Post Types, les champs ACF, l'API REST consommée par React, l'administration, et le pipeline de déploiement CI/CD.

## Installation

### Via ZIP (recommandé)

```bash
pnpm package:wp
```

Installe `releases/mademo-plugin-x.x.x.zip` via **Extensions → Téléverser une extension**.

> Activer le plugin **avant** d'activer le thème.

### Manuellement

Copier le dossier `mademo-studio/` dans `wp-content/plugins/` et activer depuis **Extensions**.

## Contenu

```
mademo-studio/
├── mademo-studio.php      # Fichier principal
├── includes/
│   └── deploy.php         # Pipeline CI/CD (endpoint REST + admin validation)
└── acf-json/              # Groupes de champs ACF (synchronisation JSON)
    ├── group_projet.json
    ├── group_fragment.json
    ├── group_text.json
    └── group_research.json
```

## Custom Post Types

| CPT | Slug | Description |
|---|---|---|
| `mademo_project` | `projets` | Projets artistiques |
| `mademo_fragment` | `fragments` | Notes, photos, citations, hypothèses |
| `mademo_text` | `textes` | Essais et textes publiés |
| `mademo_research` | `recherches` | Territoires de recherche |

## Taxonomies

| Taxonomie | CPT | Description |
|---|---|---|
| `project_status` | Project | intuition / recherche / production / terminé… |
| `fragment_type` | Fragment | note / citation / hypothèse / échec… |
| `fragment_status` | Fragment | brut / à relire / validé / transformé |
| `mademo_theme` | Tous | Corps, matière, perception, lumière… |

## API REST — `/mademo/v1/`

Tous les endpoints sont publics (lecture seule). Authentification WP Nonce optionnelle.

### `GET /projects`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `per_page` | int | 100 | Max 200 |
| `orderby` | string | `menu_order` | `date`, `title`, `menu_order` |
| `order` | string | `ASC` | `ASC` ou `DESC` |
| `theme` | string | — | Filtrer par slug de thème |
| `status` | string | — | Filtrer par statut (`production`, `recherche`…) |

Champs retournés : `id`, `wp_id`, `title`, `category`, `status`, `year`, `question`, `manifeste`, `description`, `lastUpdated`, `themes[]`, `tags[]`, `image`, `fragmentCount`, `journal[]`, `maintenant{}`, `references[]`.

### `GET /fragments`

Paramètres : `per_page`, `orderby`, `order`, `theme`, `type` (slug fragment_type), `project` (slug projet).

Champs : `id`, `wp_id`, `number`, `title`, `date`, `type`, `content`, `status`, `keywords[]`, `projectIds[]`, `image`.

### `GET /texts`

Paramètres : `per_page`, `orderby`, `order`, `theme`.

Champs : `id`, `wp_id`, `title`, `date`, `type`, `excerpt`, `body`, `relatedProjectId`, `readTime`.

### `GET /research`

Champs : `id`, `wp_id`, `title`, `question`, `description`, `genealogies[]`, `contemporaryArtists[]`, `forms[]`, `projectIds[]`, `fragmentCount`, `lastUpdated`.

### `POST /deploy` — CI/CD uniquement

Reçoit un ZIP du bundle React depuis GitHub Actions. Voir [Pipeline CI/CD](#pipeline-cicd).

## Champs ACF — Projets

| Champ | Clé ACF | Type |
|---|---|---|
| Catégorie courte | `category` | Texte |
| Année | `year` | Texte |
| Question centrale | `question` | Textarea |
| Phrase manifeste | `manifeste` | Textarea |
| Dernière mise à jour | `last_updated` | Texte |
| Tags | `tags` | Texte (CSV) |
| **Maintenant** | `maintenant` | Groupe |
| — Ce que je cherche | `cherche` | Textarea |
| — Dernière avancée | `avancee` | Textarea |
| — Ce qui bloque | `bloque` | Textarea |
| — Prochaine étape | `prochaine` | Textarea |
| — Question ouverte | `question` | Textarea |
| **Journal** | `journal` | Repeater |
| **Références** | `references` | Repeater |

## Champs ACF — Territoires de recherche

| Champ | Clé ACF | Type |
|---|---|---|
| Question de recherche | `question` | Textarea |
| Description | `description` | Textarea |
| Filiations | `genealogies` | Textarea (1 par ligne) |
| Artistes contemporain·es | `contemporary_artists` | Textarea (1 par ligne) |
| Formes d'expression | `forms` | Textarea (1 par ligne) |
| Projets associés | `project_ids` | Relationship |
| Nombre de fragments | `fragment_count` | Nombre |
| Dernière mise à jour | `last_updated` | Texte |

## Pipeline CI/CD

Le fichier `includes/deploy.php` ajoute :

**Endpoint REST** `POST /mademo/v1/deploy`
- Authentification par HMAC-SHA256 (en-tête `X-Mademo-Deploy-Signature`)
- Stockage du ZIP dans `wp-content/uploads/mademo-deploys/` (protégé par `.htaccess`)
- Notification email à l'administrateur

**Page admin** — Mademo Studio → Déploiements
- Configuration du secret partagé avec GitHub Actions
- Liste des builds en attente avec commit, branche, auteur, message
- Bouton **Appliquer** : extrait le ZIP dans `wp-content/themes/mademo/dist/`
- Bouton **Rejeter** : supprime le ZIP
- Historique des 15 derniers déploiements

**Sécurité**
- Vérification `hash_equals()` anti-timing-attack
- Contrôle anti path-traversal avant extraction ZIP
- Nonce WordPress sur toutes les actions admin
- Dossier de stockage inaccessible en HTTP (`.htaccess`)

## Tailles d'images enregistrées

| Nom | Dimensions | Crop |
|---|---|---|
| `mademo-hero` | 1600 × 900 | oui |
| `mademo-card` | 800 × 600 | oui |
| `mademo-thumb` | 400 × 300 | oui |
| `mademo-square` | 600 × 600 | oui |

## Administration

Menu **Mademo Studio** dans la barre latérale WordPress :

- **Tableau de bord** — compteurs (projets, fragments, textes, recherches) + liens endpoints REST
- **Projets / Fragments / Textes / Recherches** — listes avec colonnes personnalisées
- **API REST** — tableau des endpoints avec liens de test
- **Déploiements** — pipeline CI/CD

## Activation

Au premier clic sur **Activer**, le plugin :

1. Enregistre les CPT et taxonomies
2. Crée les termes par défaut (statuts, types, thèmes)
3. Crée les pages WordPress pour chaque route React (`/projets`, `/fragments`…)
4. Crée le dossier `acf-json/` si absent
5. Flush les règles de réécriture

## Prérequis

- WordPress 6.4+
- PHP 8.1+ (avec extension `ZipArchive`)
- ACF Pro 6+ (recommandé — le plugin fonctionne sans mais sans les champs riches)
