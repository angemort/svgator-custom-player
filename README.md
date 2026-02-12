# svgator-custom-player

[![npm version](https://img.shields.io/npm/v/svgator-custom-player.svg)](https://www.npmjs.com/package/svgator-custom-player)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**svgator-custom-player** is a command-line interface (CLI) that extracts and **replaces the embedded Svgator player** in an exported SVG file with a **custom, lightweight, and optimized player**.

The goal is simple: to get rid of Svgator's generic player and keep only the code strictly necessary for your animation. This results in smaller SVG files, faster loading times, and full control over the animation's behavior.

## 🌟 Why use `svgator-custom-player`?

Svgator's default player is designed to be universal, which means it includes many modules that your animation might not use. This approach has several drawbacks:

- **Unoptimized weight**: Your SVG embeds unused code, bloating your web pages.
- **Lack of control**: You are dependent on Svgator's player logic and features.
- **Opacity**: Animation options are often obfuscated, making analysis and manual adjustments difficult.

`svgator-custom-player` solves these problems by intelligently analyzing your animation to generate a tailor-made player.

## ✨ Features

The tool supports a wide range of Svgator animation features. Here is what is currently supported, depending on what is detected in your SVG's payload:

### ⏱️ Timeline & Control

- `iterations` (use `0` for an infinite loop)
- `alternate` for back-and-forth animations
- `direction` (`normal` or `reverse`)
- `fill` (`forwards`, `backwards`, `both`, `none`)
- `speed` to adjust playback speed
- `fps` to control frames per second

### 🎛️ Programmatic Control API

Once the custom player is embedded, you can control the animation via JavaScript:

- `play()`, `pause()`, `stop()`, `toggle()`
- `restart()`, `reverse()`
- `seek(ms)` to jump to a specific time (in milliseconds)
- `seekRatio(r)` to jump to a specific point on the timeline (between 0 and 1)

### 🔄 Transformations (Matrix)

- `origin` (`o`): Origin point for rotation and scale
- `rotate` (`r`): Rotation
- `scale` (`s`): Scaling
- `translate` (`t`): Translation

### 🎨 Numeric Attributes

- `opacity`, `fill-opacity`, `stroke-opacity`
- `stroke-width`, `stroke-dashoffset`, `stroke-dasharray`
- `#size` (to animate `width` and `height`)

### 🌈 Paints: Colors & Gradients

- **Solid colors**: `{t:"c", v:{r,g,b,a}}` and raw strings (`"none"`, `"#fff"`, `"rgb(...)"`)
- **Gradients** (`{t:"g", ...}`): supports stops, offsets, `gradientTransform`, and attributes for linear and radial gradients.

### 🎭 Effects & Masks

- **Filters** (Svgator-like "data-driven"): `blur`, `hue-rotate`, `drop-shadow`, `inner-shadow`
- **Masking**: Animation of `mask` and `clip-path` attributes (allows switching between different elements).

### 📈 Path Morphing (`d`)

- The tool can animate the transformation of a path (`d`) into another.
  > ⚠️ **Important note on `d` morphing**:
  > This implementation is an **approximation** based on path resampling, not a segment-structure morph like Svgator's. The result is visually excellent for many use cases, but is not guaranteed to be mathematically identical to the original. You can control the quality with the `--morph-samples` option.

## 📦 Installation

Make sure you have [Node.js](https://nodejs.org/) and npm installed.

```bash
# Install project dependencies
npm install

# Optional, for minifying the generated player
npm install --save-dev terser
```

## 🚀 Usage

The basic syntax is simple. You provide an input SVG file and a name for the output file.

### Basic command

```bash
npx svgator-custom-player input.svg output.svg
```

This command will:

1.  Analyze `input.svg`.
2.  Detect the features used.
3.  Generate a custom, lightweight JS player.
4.  Replace Svgator's `<script>` in `output.svg`.
5.  Print the detected features to the console.

### Advanced options

#### Minify the generated player

To reduce the final file size as much as possible (recommended for production).

```bash
npx svgator-custom-player input.svg output.svg --minify
```

#### Keep Svgator UI artifacts

By default, the tool cleans the SVG by removing watermark elements added by the Svgator UI. Use this option to keep them.

```bash
npx svgator-custom-player input.svg output.svg --keep-ui
```

#### Control path morphing (`d`) quality

Adjust the number of sampling points for the morphing approximation. A higher value offers better precision at the cost of a slightly larger player.

```bash
npx svgator-custom-player input.svg output.svg --morph-samples 150
```

#### Set the scroll trigger threshold

If your SVG does not have scroll options defined, this option sets the threshold (as a visibility percentage) at which the animation triggers.

```bash
npx svgator-custom-player input.svg output.svg --scroll-threshold 50
```

## 📂 Project Structure

For those who want to understand the inner workings or contribute:

- `src/svg/`: Logic for parsing SVG, extracting the payload, and decoding Svgator data.
- `src/features/`: Modules for detecting animation features from the decoded payload.
- `src/player/`: The code generator that assembles the custom JS player based on detected features.
- `src/minify/`: Logic for interfacing with `terser` for optional minification.

## 🤝 Contributing

Contributions are welcome! Whether it's to fix a bug, improve the documentation, or add support for a new feature, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the [MIT](LICENSE) license.
