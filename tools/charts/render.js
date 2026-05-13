import { JSDOM } from "jsdom";
import * as Plot from "@observablehq/plot";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const { window } = new JSDOM("");
const { document } = window;

// Polyfill SVGElement and HTMLElement on the global so Plot's feature detection works.
globalThis.document ??= document;
globalThis.window ??= window;
globalThis.SVGElement ??= window.SVGElement;
globalThis.HTMLElement ??= window.HTMLElement;
globalThis.Element ??= window.Element;
globalThis.Node ??= window.Node;
globalThis.navigator ??= window.navigator;
globalThis.getComputedStyle ??= window.getComputedStyle;

const FONT_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export function plotToSvg(spec) {
  const node = Plot.plot({
    ...spec,
    document,
    style: {
      background: "#fff",
      fontFamily: FONT_STACK,
      ...(spec.style ?? {}),
    },
  });

  // Plot returns either a bare <svg> or a <figure> wrapper. When wrapped, the
  // wrapper holds swatch-legend <svg> elements first (tiny 15px squares) and
  // the plot <svg> last. Pick the last <svg> so we always get the chart, not
  // a legend swatch.
  let svg;
  if (node.tagName?.toLowerCase() === "svg") {
    svg = node;
  } else {
    const svgs = node.querySelectorAll("svg");
    if (svgs.length === 0) throw new Error("No <svg> element found in Plot output");
    svg = svgs[svgs.length - 1];
  }
  ensureSvgAttrs(svg);
  return svg.outerHTML;
}

function ensureSvgAttrs(svg) {
  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  if (!svg.getAttribute("xmlns:xlink")) {
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
}

export function writeSvg(outUrl, svg) {
  const path = fileURLToPath(outUrl);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, svg, "utf8");
  console.log(`wrote ${path} (${svg.length} bytes)`);
}

export function assetPath(relative, baseImportMetaUrl) {
  return new URL(relative, baseImportMetaUrl);
}
