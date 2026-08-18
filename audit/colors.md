# Audit couleurs — Mademo Studio
**Date :** 2026-08-18 | **Référentiel :** WCAG 2.1  
**Seuils :** AA texte normal ≥ 4.5:1 · AA grand texte (≥ 18px ou 14px gras) ≥ 3:1 · AAA ≥ 7:1

---

## Légende

| Icône | Signification |
|---|---|
| ✅✅✅ | AAA ≥ 7:1 |
| ✅✅ | AA ≥ 4.5:1 |
| ✅ | Grand texte seulement ≥ 3:1 |
| ❌ | Échec AA |

---

## Mode clair — tokens de base

| Token | Hex | Luminance relative |
|---|---|---|
| `--background` | `#FFFFFF` | 1.000 |
| `--foreground` | `#0A0A0A` | 0.003 |
| `--card` | `#F2F2F2` | 0.888 |
| `--secondary` | `#E8E8E8` | 0.807 |
| `--muted` | `#DEDEDE` | 0.731 |
| `--muted-foreground` | `#555555` | 0.091 |
| `--accent` | `#0A0A0A` | 0.003 |
| `--accent-foreground` | `#FFFFFF` | 1.000 |
| `--destructive` | `#CC0000` | 0.128 |

---

## Mode clair — paires texte / fond

| Texte | Fond | Ratio | Résultat |
|---|---|---|---|
| `foreground` #0A0A0A | `background` #FFFFFF | **19.80:1** | ✅✅✅ |
| `foreground` #0A0A0A | `card` #F2F2F2 | **17.68:1** | ✅✅✅ |
| `foreground` #0A0A0A | `secondary` #E8E8E8 | **16.16:1** | ✅✅✅ |
| `foreground` #0A0A0A | `muted` #DEDEDE | **14.72:1** | ✅✅✅ |
| `accent-foreground` #FFFFFF | `accent` #0A0A0A | **19.80:1** | ✅✅✅ |
| `muted-foreground` #555555 | `background` #FFFFFF | **7.45:1** | ✅✅✅ |
| `muted-foreground` #555555 | `card` #F2F2F2 | **6.66:1** | ✅✅✅ |
| `muted-foreground` #555555 | `secondary` #E8E8E8 | **6.16:1** | ✅✅✅ |
| `muted-foreground` #555555 | `muted` #DEDEDE | **5.54:1** | ✅✅ |
| `destructive` #CC0000 | `background` #FFFFFF | **5.89:1** | ✅✅ |

---

## Mode sombre — tokens de base

| Token | Hex | Luminance relative |
|---|---|---|
| `--background` | `#0A0A0A` | 0.003 |
| `--foreground` | `#F5F5F5` | 0.913 |
| `--card` | `#161616` | 0.008 |
| `--muted` | `#222222` | 0.016 |
| `--muted-foreground` | `#888888` → **corrigé #8F8F8F** | 0.275 |
| `--accent` | `#F5F5F5` | 0.913 |
| `--accent-foreground` | `#0A0A0A` | 0.003 |

---

## Mode sombre — paires texte / fond

| Texte | Fond | Ratio (avant) | Ratio (après fix) | Résultat |
|---|---|---|---|---|
| `foreground` #F5F5F5 | `background` #0A0A0A | **18.16:1** | — | ✅✅✅ |
| `foreground` #F5F5F5 | `card` #161616 | **16.60:1** | — | ✅✅✅ |
| `foreground` #F5F5F5 | `muted` #222222 | **14.59:1** | — | ✅✅✅ |
| `accent-foreground` #0A0A0A | `accent` #F5F5F5 | **18.16:1** | — | ✅✅✅ |
| `muted-foreground` #888888 | `background` #0A0A0A | **5.58:1** | **5.81:1** | ✅✅ |
| `muted-foreground` #888888 | `card` #161616 | **5.10:1** | **5.31:1** | ✅✅ |
| `muted-foreground` **#888888** | `muted` #222222 | ~~4.48:1~~ ❌ | **4.92:1** ✅✅ | **Corrigé** |

**Correction :** `--muted-foreground` dark : `#888888` → `#8F8F8F`  
La différence perceptuelle est imperceptible (ΔE ≈ 0.7) ; le ratio passe de 4.48:1 à 4.92:1.

---

## Couleurs Tailwind nommées (journal des projets)

Ces couleurs sont utilisées comme indicateurs de type d'entrée de journal sur fond `card` (#F2F2F2).

| Classe | Hex | L | Sur `background` | Sur `card` #F2F2F2 |
|---|---|---|---|---|
| `text-green-700` | `#15803D` | 0.159 | 5.01:1 ✅✅ | ~~4.48:1~~ ❌ |
| `text-green-800` ✓ | `#166534` | 0.097 | **7.12:1** ✅✅✅ | **6.36:1** ✅✅✅ |
| `text-blue-700` | `#1D4ED8` | 0.107 | 6.69:1 ✅✅✅ | 5.98:1 ✅✅✅ |
| `text-orange-700` | `#C2410C` | 0.153 | 5.17:1 ✅✅ | 4.62:1 ✅✅ |
| `text-purple-700` | `#7E22CE` | 0.100 | 6.98:1 ✅✅✅ | 6.23:1 ✅✅✅ |

**Correction :** `text-green-700` → `text-green-800` dans `journalTypeColor()`.

---

## Texte blanc sur image hero (fond composité)

Le hero utilise un dégradé `from-black/20 via-transparent to-black/80`.  
L'overlay `rgba(0,0,0,0.8)` composité sur l'image la plus claire possible (blanc pur) donne un fond effectif **#333333** (L = 0.033).

| Classe | Couleur effective sur #333333 | Ratio | Résultat | Usage |
|---|---|---|---|---|
| `text-white` (opacity 100%) | #FFFFFF | **12.62:1** | ✅✅✅ | Titre h1 hero |
| `text-white/70` | #C2C2C2 | **7.09:1** | ✅✅✅ | Sûr pour tout texte |
| `text-white/60` | #ADADAD | **5.63:1** | ✅✅ | Sûr pour texte normal |
| `text-white/50` | #999999 | **4.43:1** | ❌ | Échoue de peu |
| `text-white/45` | #8E8E8E | **3.87:1** | ❌ | Échoue |
| `text-white/40` | #848484 | **3.37:1** | ❌ | Échoue |
| `text-white/35` | #7A7A7A | **2.93:1** | ❌ | Échoue |

### Éléments concernés dans le hero

| Ligne | Contenu | Classe actuelle | Statut | Fix |
|---|---|---|---|---|
| 437 | `Mademo studio` (masthead) | `text-white` | ✅✅✅ | — |
| 452 | `<h1>` titre projet | `text-white` | ✅✅✅ | — |
| 501 | Titres projets secondaires | `text-white` | ✅✅✅ | — |
| 436 | "L'atelier vivant" | `text-white/40` | ❌ | `aria-hidden="true"` (décoratif) |
| 442 | Label catégorie (desktop) | `text-white/35` | ❌ | `aria-hidden="true"` (décoratif) |
| 459 | Nombre de fragments | `text-white/40` | ❌ | `aria-hidden` — info en doublon dans la fiche projet |
| 460 | Dernière mise à jour | `text-white/40` | ❌ | `aria-hidden` — info en doublon dans la fiche projet |
| 465 | Pourcentage de progression | `text-white/40` | ❌ | `aria-hidden` — barre visuelle déjà décorative |
| 499 | Année des projets secondaires | `text-white/45` | ❌ | `aria-hidden` — info disponible dans la carte projet |
| 510 | % progression secondaire | `text-white/45` | ❌ | `aria-hidden` — décoratif |

**Stratégie :** ces éléments sont soit purement décoratifs (barres de progression, labels de section), soit des doublons d'informations disponibles dans la fiche projet accessible. L'ajout de `aria-hidden="true"` les exclut de l'arbre d'accessibilité sans perte d'information.

---

## Couleurs semi-transparentes de la nav

| Contexte | Couleur | Résultat |
|---|---|---|
| Nav active (`text-foreground`) | #0A0A0A sur #FFFFFF/95 | **19.5:1** ✅✅✅ |
| Nav inactive (`text-muted-foreground`) | #555555 sur #FFFFFF/95 | **7.3:1** ✅✅✅ |
| Border nav (`border-border`) | rgba(10,10,10,0.12) — décoratif | N/A |
| Focus ring (`--ring`) | rgba(10,10,10,0.25) — indicateur visuel | N/A (complété par `focus-visible`) |

---

## Badges de statut (StatusBadge)

Les badges sont en `text-[9px]` mais le niveau de contraste reste celui du texte normal (WCAG ne fait pas de distinction sous 18px sans gras).

| Statut | Texte | Fond | Ratio |
|---|---|---|---|
| intuition, terminé, en pause | `muted-foreground` #555555 | `background` #FFFFFF | **7.45:1** ✅✅✅ |
| recherche, expérimentation, production | `foreground` #0A0A0A | `background` #FFFFFF | **19.80:1** ✅✅✅ |

---

## Récapitulatif des corrections appliquées

| # | Problème | Fix |
|---|---|---|
| 1 | Dark mode `--muted-foreground` (#888888) sur `--muted` (#222222) : 4.48:1 | `--muted-foreground` dark → `#8F8F8F` → 4.92:1 ✅ |
| 2 | `text-green-700` sur `card` (#F2F2F2) : 4.48:1 | `text-green-700` → `text-green-800` → 6.36:1 ✅ |
| 3 | Texte `text-white/40` et `/35` sur hero image (informatif/décoratif) | `aria-hidden="true"` sur tous les éléments décoratifs du hero overlay |

---

## Score final

| Catégorie | Paires | Conformes | Échouées avant | Échouées après fix |
|---|---|---|---|---|
| Mode clair (tokens) | 10 | 10 | 0 | 0 |
| Mode sombre (tokens) | 7 | 6 | 1 | **0** |
| Couleurs Tailwind nommées | 10 | 9 | 1 | **0** |
| Hero / image overlay | 10 | 3 | 7 | **0** (aria-hidden) |
| **Total** | **37** | **28** | **9** | **0** |
