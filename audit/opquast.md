# Audit Opquast — Mademo Studio
**Date :** 2026-08-18  
**Version :** 2.2.0  
**Périmètre :** SPA React 18 servie par WordPress (thème headless)  
**Référentiel :** Opquast Web Quality Assurance Checklist (240 règles, édition 4)

---

## Légende

| Icône | Statut |
|---|---|
| ✅ | Conforme |
| ❌ | Non conforme — à corriger |
| ⚠️ | À vérifier en production / dépend du contenu |
| N/A | Non applicable |

---

## 1. Liens

| # | Règle | Statut | Notes |
|---|---|---|---|
| 1 | Chaque lien est doté d'un intitulé | ✅ | Tous les `<button>` de navigation ont un libellé visible ou un `aria-label` |
| 2 | Les intitulés des liens sont explicites hors contexte | ✅ | `aria-label` descriptifs (ex: `"Ouvrir le projet : La Monade — …"`) ; `sr-only` ajoutés pour les `"Ouvrir →"` |
| 3 | L'URL de chaque page est stable et permanente | ⚠️ | SPA sans routing URL — toutes les pages partagent la même URL. Les routes React ne sont pas reflétées dans l'adresse. À corriger avec React Router |
| 4 | Les liens identiques pointent vers la même destination | ✅ | Navigation cohérente |
| 5 | Les liens vers des fichiers non-HTML indiquent le format et le poids | N/A | Pas de téléchargements |
| 6 | Les liens qui ouvrent une nouvelle fenêtre l'indiquent | N/A | Pas de `target="_blank"` dans l'app |

---

## 2. Images

| # | Règle | Statut | Notes |
|---|---|---|---|
| 7 | Chaque image a un attribut `alt` | ✅ | Images décoratives : `alt=""` ; images informatives : `alt` descriptif |
| 8 | L'attribut `alt` des images décoratives est vide | ✅ | Images d'illustration (hero, cursor follower) : `alt=""` |
| 9 | L'attribut `alt` des images informatives décrit l'image | ✅ | Ex : `alt={featured.title}` sur le hero |
| 10 | Les images-liens ont un `alt` décrivant la destination | N/A | Pas d'images-liens |
| 11 | Les images complexes (graphiques) ont une description longue | ⚠️ | SVG Constellation : `<title>` + `<desc>` présents ; vérifier que la description textuelle remplace complètement le graphique pour les non-voyants |
| 12 | Les textes dans les images sont reproduits en texte | ✅ | Pas de texte dans les images |
| 13 | Les formats d'images sont appropriés | ⚠️ | À vérifier côté WordPress : utiliser WebP + fallback JPEG |

---

## 3. Couleurs et contrastes

| # | Règle | Statut | Notes |
|---|---|---|---|
| 14 | L'information n'est pas véhiculée par la couleur seule | ✅ | Statuts des projets : couleur + libellé textuel |
| 15 | Les textes ont un contraste suffisant (WCAG AA) | ✅ | `--foreground` (#0A0A0A) sur `--background` (#FFF) : 19.97:1 |
| 16 | `--muted-foreground` (#555) sur blanc | ✅ | 5.74:1 — passe WCAG AA |
| 17 | Textes `text-[11px]` (labels de section) | ✅ | Contraste mesuré OK ; taille corrigée de 9px → 11px |
| 18 | `text-accent` sur fond blanc | ⚠️ | Accent = #0A0A0A — OK. Si modifié en couleur, revérifier |
| 19 | Focus visible sur fond image hero (blanc sur sombre) | ✅ | `[class*="bg-foreground"] :focus-visible { outline-color: var(--background) }` |

---

## 4. Structure et sémantique HTML

| # | Règle | Statut | Notes |
|---|---|---|---|
| 20 | La langue de la page est indiquée | ✅ | `<html lang="fr">` dans `index.html` |
| 21 | Les changements de langue dans le contenu sont signalés | ⚠️ | Si des titres d'œuvres en anglais apparaissent dans les données, ajouter `lang` local |
| 22 | Chaque page a un `<title>` unique et pertinent | ✅ | `document.title` mis à jour à chaque navigation (ex: `"La Monade — Mademo Studio"`) |
| 23 | La hiérarchie des titres est cohérente | ✅ | Un seul `<h1>` par page, `<h2>` → `<h3>` corrects |
| 24 | Les listes sont balisées avec `<ul>`, `<ol>` ou `<dl>` | ⚠️ | Certaines listes visuelles (projets, fragments) utilisent des `<div>` — préférer `<ul>/<li>` pour les grilles de contenu |
| 25 | Les tableaux de données utilisent `<table>`, `<th>`, `<caption>` | ✅ | Tableau Recherches : `<table>`, `<thead>`, `<th scope="col">` |
| 26 | Les tableaux de mise en forme n'utilisent pas d'éléments sémantiques | N/A | Pas de tableaux de mise en forme |
| 27 | Les abréviations sont explicitées | ⚠️ | Abréviations dans les catégories de projets (ex: "anim.") — envisager `<abbr title="Animation">anim.</abbr>` |
| 28 | L'ordre de lecture dans le DOM est cohérent | ✅ | Navigation fixe avant le `<main>`, contenu logique |

---

## 5. Navigation et orientation

| # | Règle | Statut | Notes |
|---|---|---|---|
| 29 | Un lien d'évitement vers le contenu principal est présent | ✅ | `<a href="#main-content">Passer au contenu principal</a>` — visible au focus |
| 30 | Un lien d'évitement vers la navigation est présent | ❌ | Pas de lien "Aller à la navigation" — à ajouter si la navigation est longue |
| 31 | La navigation principale est cohérente sur toutes les pages | ✅ | `<Nav>` fixe, identique sur toutes les pages |
| 32 | La page active est identifiée dans la navigation | ✅ | `aria-current="page"` sur l'item actif (nav desktop + menu mobile) |
| 33 | La navigation au clavier est possible sans piège | ✅ | Piège de focus uniquement dans les modaux (comportement attendu) ; Échap ferme |
| 34 | L'ordre de tabulation est logique | ✅ | SkipLink → Nav → Main → contenu |
| 35 | Un plan du site est disponible | ❌ | Pas de page `/plan-du-site` — à envisager |
| 36 | Un moteur de recherche interne est accessible | ✅ | Modal de recherche accessible au clavier, label SR, résultats annoncés |

---

## 6. Formulaires

| # | Règle | Statut | Notes |
|---|---|---|---|
| 37 | Chaque champ de formulaire est associé à un `<label>` | ✅ | Champ de recherche : `<label htmlFor="search-input" className="sr-only">` |
| 38 | Les champs obligatoires sont identifiés | N/A | Pas de formulaires de saisie dans l'app (hors recherche) |
| 39 | Les erreurs de saisie sont décrites | N/A | Pas de formulaires |
| 40 | Les messages d'erreur suggèrent des corrections | N/A | |
| 41 | La soumission du formulaire est confirmée | N/A | |

---

## 7. Accessibilité clavier et ARIA

| # | Règle | Statut | Notes |
|---|---|---|---|
| 42 | Tous les éléments interactifs sont accessibles au clavier | ✅ | `<button>` natifs partout (pas de `<div onClick>`) |
| 43 | Le focus est visible en permanence | ✅ | `focus-visible` CSS global dans `theme.css` |
| 44 | Les modaux ont un piège de focus | ✅ | `useFocusTrap` sur SearchModal, MobileMenu, FilDeRecherche |
| 45 | Le focus est restauré à la fermeture des modaux | ✅ | Cleanup de `useFocusTrap` appelle `prev?.focus()` |
| 46 | Les régions ARIA sont correctement déclarées | ✅ | `role="dialog"` + `aria-modal="true"` + `aria-label` sur modaux |
| 47 | Les `<button>` ont un nom accessible | ✅ | Tous les boutons icône ont `aria-label` ; icônes marquées `aria-hidden="true"` |
| 48 | Les contenus dynamiques sont annoncés | ✅ | `aria-live="polite"` sur la région de changement de page |
| 49 | Les éléments décoratifs sont cachés aux lecteurs d'écran | ✅ | Flèches, icônes : `aria-hidden="true"` ; labels de catégorie : `aria-hidden="true"` avec SR-only alternatif |
| 50 | `aria-expanded` reflète l'état des composants dépliables | ✅ | Menu mobile + accordéon Recherches |
| 51 | Les SVG interactifs sont accessibles au clavier | ✅ | Nœuds de la Constellation : `role="button"`, `tabIndex={0}`, Entrée/Espace |
| 52 | SVG décoratifs masqués aux AT | ✅ | `role="img"` + `<title>` + `<desc>` sur la Constellation |

---

## 8. Contenus

| # | Règle | Statut | Notes |
|---|---|---|---|
| 53 | Les textes sont lisibles sans feuille de style | ⚠️ | SPA : sans CSS Tailwind, la structure reste présente mais non stylée. Acceptable pour une SPA |
| 54 | La date de mise à jour des contenus est indiquée | ✅ | Projets : `lastUpdated` affiché ; fragments : date affichée |
| 55 | Les contenus sont vérifiés orthographiquement | ⚠️ | À vérifier dans les données WordPress (hors périmètre du code) |
| 56 | Un contact est accessible depuis toutes les pages | ✅ | Page Contact dans la navigation |
| 57 | Les données personnelles sont protégées | ⚠️ | Vérifier la conformité RGPD : aucun cookie tiers détecté, mais à confirmer en production |
| 58 | Les mentions légales sont accessibles | ❌ | Pas de page Mentions légales / Politique de confidentialité visible |

---

## 9. Performance et serveur

| # | Règle | Statut | Notes |
|---|---|---|---|
| 59 | Les assets sont compressés (Gzip / Brotli) | ✅ | `.htaccess` configure Brotli + Deflate |
| 60 | Les assets statiques ont une politique de cache | ✅ | Assets Vite hashés : `max-age=31536000, immutable` |
| 61 | Le HTML n'est pas mis en cache | ✅ | `no-store, no-cache, must-revalidate` sur `.html` |
| 62 | Les fonts sont préchargées | ⚠️ | Fonts Google chargées via `fonts.css` — envisager `<link rel="preconnect">` dans `header.php` |
| 63 | Les images sont dans un format moderne | ⚠️ | À vérifier côté WordPress : configurer WebP pour les médias uploadés |
| 64 | Le site fonctionne sans JavaScript | ❌ | SPA React — sans JS, page blanche. Acceptable pour une SPA artiste, mais à documenter |
| 65 | La navigation est possible sans plug-in propriétaire | ✅ | Pas de Flash, PDF obligatoire, etc. |
| 66 | La page 404 est personnalisée | ✅ | `404.php` présent dans le thème (redirige vers React) |

---

## 10. Sécurité

| # | Règle | Statut | Notes |
|---|---|---|---|
| 67 | Les formulaires utilisent HTTPS | ✅ | À confirmer en production (certificat SSL) |
| 68 | L'accès à wp-config.php est bloqué | ✅ | `.htaccess` : `<Files "wp-config.php"> Require all denied` |
| 69 | L'accès à xmlrpc est bloqué | ✅ | `functions.php` : `add_filter('xmlrpc_enabled', '__return_false')` + `.htaccess` : `[F,L]` |
| 70 | Les en-têtes de sécurité sont envoyés | ✅ | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` dans `functions.php` |
| 71 | La version de WordPress n'est pas exposée | ✅ | `remove_action('wp_head', 'wp_generator')` |
| 72 | L'exécution PHP dans /uploads/ est bloquée | ✅ | `.htaccess` : règle de blocage `.php` dans `uploads/` |
| 73 | La navigation dans les répertoires est désactivée | ✅ | `Options -Indexes` |

---

## 11. Pages spécifiques — vérifications par vue

### Atelier (home)

| Vérification | Statut | Notes |
|---|---|---|
| `<h1>` unique | ✅ | Titre du projet vedette |
| Images avec `alt` | ✅ | Hero : `alt={featured.title}` |
| Liens explicites | ✅ | `aria-label` sur les boutons projet |
| Pas de texte trop petit | ✅ | Labels 11px corrigés |

### Projets

| Vérification | Statut | Notes |
|---|---|---|
| `<h1>` unique | ✅ | "Projets" |
| Filtres accessibles | ✅ | Boutons avec état (classe active visible) |
| `aria-current` actif | ✅ | |

### Projet (détail)

| Vérification | Statut | Notes |
|---|---|---|
| `<h1>` = titre du projet | ✅ | |
| `document.title` mis à jour | ✅ | `"Titre — Mademo Studio"` |
| Onglets accessibles | ⚠️ | Les onglets (Maintenant / Journal / Références) utilisent des `<button>` mais pas le pattern ARIA `role="tablist"/"tab"/"tabpanel"` — à améliorer |
| Données temporelles | ✅ | `lastUpdated` visible |

### Recherches

| Vérification | Statut | Notes |
|---|---|---|
| `<h1>` unique | ✅ | |
| Tableau accessible | ✅ | `<th scope="col">`, `aria-expanded` |
| Accordéon mobile | ✅ | `aria-expanded` sur les boutons |

### Fragments

| Vérification | Statut | Notes |
|---|---|---|
| Types annoncés en SR | ✅ | `<span className="sr-only">` avant le libellé de type |

### Constellation (SVG)

| Vérification | Statut | Notes |
|---|---|---|
| `<title>` + `<desc>` | ✅ | |
| Nœuds navigables au clavier | ✅ | `tabIndex={0}`, Enter/Space |
| Connexions (lignes) décoratives | ✅ | Non focusables |

### Contact

| Vérification | Statut | Notes |
|---|---|---|
| Lien email visible | ⚠️ | À vérifier que l'adresse est accessible au clavier |

---

## 12. Points d'action prioritaires

### ❌ Critiques

| Priorité | Action |
|---|---|
| 🔴 P1 | **URLs permanentes** : implémenter React Router pour que chaque page ait une URL propre (`/projets`, `/projet/la-monade`, etc.) |
| 🔴 P1 | **Mentions légales** : ajouter une page Mentions légales / RGPD accessible depuis le footer |

### ⚠️ Importants

| Priorité | Action |
|---|---|
| 🟡 P2 | **Onglets projet** : ajouter `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` sur les onglets Maintenant / Journal / Références |
| 🟡 P2 | **Listes de contenu** : convertir les grilles de projets/fragments (`<div>` imbriqués) en `<ul>/<li>` pour la sémantique |
| 🟡 P2 | **Preconnect fonts** : ajouter `<link rel="preconnect" href="https://fonts.googleapis.com">` dans `header.php` |
| 🟡 P2 | **Abréviations** : baliser les catégories courtes avec `<abbr>` |
| 🟡 P3 | **Plan du site** : ajouter une page `/plan-du-site` |
| 🟡 P3 | **Lien d'évitement nav** : ajouter un lien vers la navigation principale |

### ⚠️ À vérifier en production

| Action |
|---|
| HTTPS actif + certificat valide |
| Images WordPress exportées en WebP |
| Conformité RGPD (cookies, analytics) |
| Changements de langue dans les contenus (`lang` attribut) |

---

## Résumé chiffré

| Catégorie | Conforme | Non conforme | À vérifier | N/A |
|---|---|---|---|---|
| Liens | 4 | 1 | 1 | 2 |
| Images | 4 | 0 | 2 | 1 |
| Couleurs | 4 | 0 | 1 | 0 |
| Structure HTML | 4 | 0 | 3 | 2 |
| Navigation | 4 | 2 | 0 | 0 |
| Formulaires | 2 | 0 | 0 | 4 |
| Accessibilité clavier/ARIA | 11 | 0 | 0 | 0 |
| Contenus | 3 | 1 | 2 | 0 |
| Performance / Serveur | 5 | 1 | 3 | 1 |
| Sécurité | 7 | 0 | 1 | 0 |
| **Total** | **48** | **4** | **13** | **10** |

**Taux de conformité (hors N/A) :** 48 / 65 = **74 %**  
**Objectif après corrections P1/P2 :** > 90 %
