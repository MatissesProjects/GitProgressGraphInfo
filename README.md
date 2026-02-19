# GitHeat (GitHub Pulse)

A Chrome extension to reveal hidden metrics behind GitHub contribution graphs.

## Features
- **Threshold Decoder:** Shows exact commit ranges for Level 1-4 squares.
- **Heatmap Injection:** Adds a stats panel above the contribution graph.
- **Legend Extender:** Displays ranges directly in the graph legend.

## How to Load
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `dist` folder in this project directory.

## Development
- Source files are in `src/`.
- Built files are in `dist/`.
- Run `npm run build` to re-compile.
