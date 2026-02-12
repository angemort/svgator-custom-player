# svgator-custom-player

[![npm version](https://img.shields.io/npm/v/svgator-custom-player.svg)](https://www.npmjs.com/package/svgator-custom-player)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**svgator-custom-player** est un outil en ligne de commande (CLI) qui extrait et **remplace le lecteur intégré de Svgator** dans un fichier SVG exporté par un **lecteur personnalisé, léger et optimisé**.

L'objectif est simple : se débarrasser du lecteur générique de Svgator pour ne conserver que le code strictement nécessaire à votre animation. Cela se traduit par des fichiers SVG plus petits, un chargement plus rapide et un contrôle total sur le comportement de l'animation.

## 🌟 Pourquoi utiliser `svgator-custom-player` ?

Le lecteur par défaut de Svgator est conçu pour être universel, ce qui signifie qu'il inclut de nombreux modules que votre animation n'utilise peut-être pas. Cette approche a plusieurs inconvénients :

- **Poids non optimisé** : Votre SVG embarque du code inutile, alourdissant vos pages web.
- **Manque de contrôle** : Vous êtes dépendant de la logique et des fonctionnalités du lecteur de Svgator.
- **Opacité** : Les options d'animation sont souvent obfusquées, rendant l'analyse et les ajustements manuels difficiles.

`svgator-custom-player` résout ces problèmes en analysant intelligemment votre animation pour générer un lecteur sur mesure.

## ✨ Fonctionnalités

L'outil supporte une large gamme des fonctionnalités d'animation de Svgator. Voici ce qui est actuellement pris en charge, en fonction de ce qui est détecté dans le payload de votre SVG :

### ⏱️ Timeline & Contrôle

- `iterations` (utilisez `0` pour une boucle infinie)
- `alternate` pour les animations aller-retour
- `direction` (`normal` ou `reverse`)
- `fill` (`forwards`, `backwards`, `both`, `none`)
- `speed` pour ajuster la vitesse de lecture
- `fps` pour contrôler les images par seconde

### 🎛️ API de Contrôle Programmatique

Une fois le lecteur personnalisé intégré, vous pouvez contrôler l'animation via JavaScript :

- `play()`, `pause()`, `stop()`, `toggle()`
- `restart()`, `reverse()`
- `seek(ms)` pour aller à un moment précis (en millisecondes)
- `seekRatio(r)` pour aller à un point précis de la timeline (entre 0 et 1)

### 🔄 Transformations (Matrice)

- `origin` (`o`): Point d'origine pour la rotation et l'échelle
- `rotate` (`r`): Rotation
- `scale` (`s`): Mise à l'échelle
- `translate` (`t`): Translation

### 🎨 Attributs Numériques

- `opacity`, `fill-opacity`, `stroke-opacity`
- `stroke-width`, `stroke-dashoffset`, `stroke-dasharray`
- `#size` (pour animer `width` et `height`)

### 🌈 Couleurs & Dégradés (Paints)

- **Couleurs pleines** : `{t:"c", v:{r,g,b,a}}` et chaînes brutes (`"none"`, `"#fff"`, `"rgb(...)"`)
- **Dégradés** (`{t:"g", ...}`) : supports des stops, offsets, `gradientTransform`, et des attributs des dégradés linéaires et radiaux.

### 🎭 Effets & Masques

- **Filtres** (style "data-driven" de Svgator) : `blur`, `hue-rotate`, `drop-shadow`, `inner-shadow`
- **Masquage** : Animation des attributs `mask` et `clip-path` (permet de basculer entre différents éléments).

### 📈 Morphing de Chemins (`d`)

- L'outil peut animer la transformation d'un chemin (`d`) vers un autre.
  > ⚠️ **Note importante sur le morphing `d`** :
  > Cette implémentation est une **approximation** basée sur un rééchantillonnage des chemins, et non un morphing de structure de segment comme celui de Svgator. Le résultat est visuellement excellent pour de nombreux cas d'usage, mais n'est pas garanti d'être mathématiquement identique à l'original. Vous pouvez contrôler la qualité via l'option `--morph-samples`.

## 📦 Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) et npm installés.

```bash
# Installation des dépendances du projet
npm install

# Optionnel, pour la minification du lecteur généré
npm install --save-dev terser
```

## 🚀 Utilisation

La syntaxe de base est simple. Vous fournissez un fichier SVG d'entrée et un nom pour le fichier de sortie.

### Commande de base

```bash
npx svgator-custom-player input.svg output.svg
```

Cette commande va :

1. Analyser `input.svg`.
2. Détecter les fonctionnalités utilisées.
3. Générer un lecteur JS personnalisé et léger.
4. Remplacer le script `<script>` de Svgator dans `output.svg`.
5. Afficher dans la console les fonctionnalités détectées.

### Options avancées

#### Minifier le lecteur généré

Pour réduire au maximum la taille du fichier final (recommandé pour la production).

```bash
npx svgator-custom-player input.svg output.svg --minify
```

#### Conserver les artefacts de l'UI de Svgator

Par défaut, l'outil nettoie le SVG en retirant les éléments du filigrane ajoutés par l'UI de Svgator. Utilisez cette option pour les conserver.

```bash
npx svgator-custom-player input.svg output.svg --keep-ui
```

#### Contrôler la qualité du morphing de chemin (`d`)

Ajustez le nombre de points d'échantillonnage pour l'approximation du morphing. Une valeur plus élevée offre une meilleure précision au prix d'un lecteur légèrement plus grand.

```bash
npx svgator-custom-player input.svg output.svg --morph-samples 150
```

#### Définir le seuil du déclencheur de défilement (scroll)

Si votre SVG n'a pas d'options de scroll définies, cette option définit le seuil (en pourcentage de visibilité) à partir duquel l'animation se déclenche.

```bash
npx svgator-custom-player input.svg output.svg --scroll-threshold 50
```

## 📂 Structure du Projet

Pour ceux qui souhaitent comprendre le fonctionnement interne ou contribuer :

- `src/svg/` : Logique pour le parsing du SVG, l'extraction du payload et le décodage des données de Svgator.
- `src/features/` : Modules de détection des fonctionnalités d'animation à partir du payload décodé.
- `src/player/` : Le générateur de code qui assemble le lecteur JS personnalisé en fonction des features détectées.
- `src/minify/` : Logique d'interface avec `terser` pour la minification optionnelle.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Que ce soit pour corriger un bug, améliorer la documentation ou ajouter le support d'une nouvelle fonctionnalité, n'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
