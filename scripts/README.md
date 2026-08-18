# scripts/

Scripts d'outillage pour Mademo Studio.

## `package-wordpress.sh`

Compile React en cible WordPress et assemble deux ZIPs installables directement dans WordPress.

```bash
# Build complet + packaging
./scripts/package-wordpress.sh

# Packaging sans rebuild (si dist/ est déjà à jour)
./scripts/package-wordpress.sh --no-build
```

Ou via pnpm depuis la racine :

```bash
pnpm package:wp        # équivalent au premier
pnpm package:wp:fast   # équivalent au second
```

### Ce que le script produit

```
releases/
├── mademo-theme-2.2.0.zip    # Thème complet avec bundle React
└── mademo-plugin-2.2.0.zip   # Plugin (CPT, ACF, REST API, CI/CD)
```

La version est lue depuis `wordpress/theme/mademo/style.css`.

### Étapes détaillées

1. Vérifie que `zip` et `pnpm` sont disponibles
2. Lance `BUILD_TARGET=wordpress pnpm build` → `wordpress/theme/mademo/dist/`
3. Vérifie la présence de `dist/.vite/manifest.json`
4. Crée `mademo-theme-x.x.x.zip` depuis `wordpress/theme/mademo/`
5. Crée `mademo-plugin-x.x.x.zip` depuis `wordpress/plugin/mademo-studio/`
6. Affiche les instructions d'installation

### Ordre d'installation dans WordPress

1. **Extensions → Téléverser** → `mademo-plugin-x.x.x.zip` → Activer
2. **Apparence → Thèmes → Téléverser** → `mademo-theme-x.x.x.zip` → Activer
3. Copier `wordpress/theme/mademo/.htaccess` à la racine WordPress
4. Aller dans **Mademo Studio → Déploiements** pour configurer le secret CI/CD

### Prérequis

- `zip` installé (`apt install zip` / `brew install zip`)
- `pnpm` installé
- `jq` installé (pour le manifest CI/CD — utilisé dans GitHub Actions)
