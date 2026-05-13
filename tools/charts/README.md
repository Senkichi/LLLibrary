# tools/charts

Headless SVG chart generation for LLLibrary. Each generator reads its data
inline (sourced from the wiki page it accompanies) and writes an SVG to
`assets/charts/`.

## Run

```
cd tools/charts
npm install
npm run build
```

Outputs:

- `assets/charts/fewshot-variant-by-model.svg`
- `assets/charts/configs-port-across-generations.svg`

## Add a chart

1. Create `tools/charts/<name>.js` with a `plotToSvg(...)` call and a
   `writeSvg(...)` line targeting `assets/charts/<name>.svg`.
2. Add the import to `build.js`.
3. Embed in the relevant wiki page and (optionally) the README.

## Notes

- ES modules (`"type": "module"`). Node 18+.
- Observable Plot SSR via `jsdom`. The `render.js` helper polyfills the
  globals Plot needs (`document`, `SVGElement`, `getComputedStyle`).
- Inline color legends are rendered as part of the SVG; figure-wrapper
  legends are not preserved (single-file SVG is the goal).
