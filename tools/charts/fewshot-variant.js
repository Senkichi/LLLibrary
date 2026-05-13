import * as Plot from "@observablehq/plot";
import { plotToSvg, writeSvg, assetPath } from "./render.js";

// Source: wiki/prompting/fewshot-variant-by-model.md (job-cannon, 2026-03-29).
// Slope chart: one line per variant, two endpoints (Cerebras, Ollama).
// All variant names labeled at the Cerebras endpoint where r-values are
// widely spread (0.699–0.935); Ollama endpoint shows numeric values only,
// since those four r-values are packed into a narrow 0.836–0.878 band.
const data = [
  { variant: "baseline",             provider: "Cerebras", r: 0.851 },
  { variant: "baseline",             provider: "Ollama",   r: 0.852 },
  { variant: "fewshot-distribution", provider: "Cerebras", r: 0.935 },
  { variant: "fewshot-distribution", provider: "Ollama",   r: 0.836 },
  { variant: "fewshot-comparative",  provider: "Cerebras", r: 0.892 },
  { variant: "fewshot-comparative",  provider: "Ollama",   r: 0.878 },
  { variant: "chain-of-thought",     provider: "Cerebras", r: 0.699 },
  { variant: "chain-of-thought",     provider: "Ollama",   r: 0.868 },
];

const variantOrder = [
  "fewshot-distribution",
  "fewshot-comparative",
  "baseline",
  "chain-of-thought",
];

const variantColor = {
  "fewshot-distribution": "#1d4ed8", // blue
  "fewshot-comparative":  "#15803d", // green
  "baseline":             "#6b7280", // gray
  "chain-of-thought":     "#b91c1c", // red
};

const left  = data.filter((d) => d.provider === "Cerebras");
const right = data.filter((d) => d.provider === "Ollama");

const AXIS_STROKE = "#374151";

// Layout: the chart is wider than strictly needed so the y-axis line can
// sit at the far left (marginLeft=70 — room for tick labels) while the
// variant labels — which extend ~196px leftward from the Cerebras dot —
// still fit entirely to the right of the axis. x-scale padding is bumped
// so the Cerebras dot is pushed inward, giving labels room.
const svg = plotToSvg({
  width: 920,
  height: 460,
  marginLeft: 70,
  marginRight: 100,
  marginTop: 32,
  marginBottom: 56,
  x: {
    type: "point",
    domain: ["Cerebras", "Ollama"],
    padding: 0.8,
    label: null,
    axis: null, // explicit axis mark below
  },
  y: {
    label: null,
    domain: [0.65, 0.96],
    grid: false,
    nice: false,
    axis: null, // explicit axis mark below
  },
  color: {
    domain: variantOrder,
    range: variantOrder.map((v) => variantColor[v]),
  },
  marks: [
    // Explicit L-shaped axis lines (left + bottom) drawn via frame marks,
    // and tick marks on the y-axis. Tick labels are hidden because each
    // data dot is already labeled with its exact value.
    Plot.frame({ anchor: "left",   stroke: AXIS_STROKE, strokeWidth: 1 }),
    Plot.frame({ anchor: "bottom", stroke: AXIS_STROKE, strokeWidth: 1 }),
    Plot.axisY({
      ticks: [0.70, 0.75, 0.80, 0.85, 0.90, 0.95],
      tickFormat: (d) => d.toFixed(2),
      tickSize: 5,
      stroke: AXIS_STROKE,
      color: AXIS_STROKE,
      fontSize: 11,
    }),
    Plot.axisX({
      anchor: "bottom",
      tickFormat: (d) =>
        d === "Cerebras" ? "Cerebras qwen-3-235b" : "Ollama qwen2.5:14b",
      tickSize: 0,
      stroke: AXIS_STROKE,
      color: AXIS_STROKE,
      fontSize: 13,
    }),

    Plot.line(data, {
      x: "provider",
      y: "r",
      stroke: "variant",
      strokeWidth: 2.6,
      curve: "linear",
    }),
    Plot.dot(data, {
      x: "provider",
      y: "r",
      fill: "variant",
      stroke: "white",
      strokeWidth: 1.5,
      r: 6,
    }),

    // LEFT (Cerebras) — variant name + r-value, one per line
    Plot.text(left, {
      x: "provider",
      y: "r",
      text: (d) => `${d.variant}   ${d.r.toFixed(3)}`,
      dx: -12,
      textAnchor: "end",
      fontSize: 12,
      fontWeight: 600,
      fill: (d) => variantColor[d.variant],
    }),

    // RIGHT (Ollama) — numeric r-value only
    Plot.text(right, {
      x: "provider",
      y: "r",
      text: (d) => d.r.toFixed(3),
      dx: 12,
      textAnchor: "start",
      fontSize: 12,
      fontWeight: 600,
      fill: (d) => variantColor[d.variant],
    }),
  ],
});

writeSvg(assetPath("../../assets/charts/fewshot-variant-by-model.svg", import.meta.url), svg);
