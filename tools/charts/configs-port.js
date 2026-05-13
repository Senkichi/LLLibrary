import * as Plot from "@observablehq/plot";
import { plotToSvg, writeSvg, assetPath } from "./render.js";

// Source: wiki/anti-patterns/configs-port-across-generations.md.
// The win matrix in full (row beats column) — preserved here so the
// individual pairwise wins can be plotted alongside the mean.
const matrix = {
  1: { 3: 0.58, 5: 0.58, 7: 0.25 },
  3: { 1: 0.42, 5: 0.17, 7: 0.17 },
  5: { 1: 0.42, 3: 0.83, 7: 0.30 },
  7: { 1: 0.75, 3: 0.83, 5: 0.70 },
};

const rounds = [1, 3, 5, 7];

const opponentOffset = { 1: -0.30, 3: -0.10, 5: 0.10, 7: 0.30 };

// Individual pairwise win rates (12 points total), with horizontal jitter.
const pairs = [];
for (const r of rounds) {
  const offsets = rounds.filter((o) => o !== r).map((o) => opponentOffset[o]);
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  let i = 0;
  for (const opp of rounds) {
    if (opp === r) continue;
    pairs.push({
      rounds: r,
      x: r + (offsets[i] - mean),
      opponent: opp,
      win: matrix[r][opp],
    });
    i++;
  }
}

// Mean win rate per round.
const summary = rounds.map((r) => {
  const wins = Object.values(matrix[r]);
  const mean = wins.reduce((a, b) => a + b, 0) / wins.length;
  return { rounds: r, mean };
});

const AXIS_STROKE = "#374151";

const svg = plotToSvg({
  width: 700,
  height: 440,
  marginLeft: 70,
  marginRight: 170,
  marginTop: 40,
  marginBottom: 60,
  x: {
    type: "linear",
    domain: [0.5, 7.5],
    grid: false,
    axis: null,
  },
  y: {
    domain: [0, 1],
    grid: false,
    axis: null,
  },
  marks: [
    // Explicit L-shaped axis lines (left + bottom)
    Plot.frame({ anchor: "left",   stroke: AXIS_STROKE, strokeWidth: 1 }),
    Plot.frame({ anchor: "bottom", stroke: AXIS_STROKE, strokeWidth: 1 }),
    Plot.axisY({
      ticks: [0, 0.25, 0.5, 0.75, 1.0],
      tickFormat: (d) => d.toFixed(2),
      stroke: AXIS_STROKE,
      color: AXIS_STROKE,
      label: "↑ Mean win rate within 4.7",
    }),
    Plot.axisX({
      ticks: rounds,
      tickFormat: (d) => `${d}rnd`,
      stroke: AXIS_STROKE,
      color: AXIS_STROKE,
      label: "max_debate_rounds (Opus 4.7) →",
    }),

    // No-skill reference — the only horizontal rule on the chart
    Plot.ruleY([0.5], { stroke: "#9ca3af", strokeDasharray: "4,4" }),
    Plot.text([{ x: 7.5 }], {
      x: "x",
      y: 0.5,
      text: () => "no-skill (0.5)",
      dx: 6,
      dy: -4,
      fontSize: 10,
      fill: "#6b7280",
      textAnchor: "start",
    }),

    // Individual pairwise win rates as faded dots, fanned horizontally
    Plot.dot(pairs, {
      x: "x",
      y: "win",
      r: 4,
      fill: "#cbd5e1",
      stroke: "#94a3b8",
      strokeWidth: 1,
    }),

    // Mean line + dots: the headline trend
    Plot.line(summary, {
      x: "rounds",
      y: "mean",
      stroke: "#1f2937",
      strokeWidth: 2.5,
    }),
    Plot.dot(summary, {
      x: "rounds",
      y: "mean",
      r: 7,
      fill: "#1f2937",
      stroke: "white",
      strokeWidth: 2,
    }),

    // Mean values above each point
    Plot.text(summary, {
      x: "rounds",
      y: "mean",
      text: (d) => d.mean.toFixed(2),
      dy: -14,
      fontSize: 12,
      fontWeight: 700,
      fill: "#111",
    }),

    // "uncanny valley" annotation, to the right of the 3rnd dot
    Plot.text([{ x: 3, y: 0.25 }], {
      x: "x",
      y: "y",
      text: () => "uncanny valley",
      dx: 14,
      dy: -2,
      fontSize: 12,
      fontWeight: 700,
      fill: "#b91c1c",
      textAnchor: "start",
    }),
    Plot.text([{ x: 3, y: 0.25 }], {
      x: "x",
      y: "y",
      text: () => "0-of-3 wins vs the others",
      dx: 14,
      dy: 14,
      fontSize: 10,
      fill: "#b91c1c",
      textAnchor: "start",
    }),

    // "dominant" annotation in the right margin
    Plot.text([{ x: 7.5, y: 0.78 }], {
      x: "x",
      y: "y",
      text: () => "dominant on 4.7",
      dx: 10,
      fontSize: 12,
      fontWeight: 700,
      fill: "#15803d",
      textAnchor: "start",
    }),
    Plot.text([{ x: 7.5, y: 0.78 }], {
      x: "x",
      y: "y",
      text: () => "3-of-3 wins",
      dx: 10,
      dy: 16,
      fontSize: 10,
      fill: "#15803d",
      textAnchor: "start",
    }),
  ],
});

writeSvg(assetPath("../../assets/charts/configs-port-across-generations.svg", import.meta.url), svg);
