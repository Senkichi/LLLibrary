---
title: anatomy — flat sitemap of LLLibrary
created: 2026-05-12
last-reviewed: 2026-05-12
last-modified: 2026-05-12
tags: [meta, sitemap]
---

# LLLibrary anatomy

Flat sitemap of all pages. For themed navigation, see `wiki/index.md`.

## Evaluation methodology

- `wiki/evals/judge-family-bias.md` — Same-family LLM judges inflate effect magnitudes; one cross-family judge on a calibration set surfaces the deflation factor.
- `wiki/evals/position-bias-correction.md` — Pairwise LLM judges have measurable order bias; double-call with swapped orderings, tie out same-position votes.
- `wiki/evals/baseline-eval-2026-04-18.md` — First full debate-eval run: 10 configs × 5 tasks, with explicit limits and supersession chain.

## Anti-patterns

- `wiki/anti-patterns/pearson-r-only-eval.md` — Pearson r captures rank order but misses calibration; a 0.935 r passed a model that was inflating production scores by 25 points.
- `wiki/anti-patterns/no-signal-vs-midpoint.md` — Collapsing "no information" into the midpoint of an ordinal scale silently inflates the modal verdict.
- `wiki/anti-patterns/configs-port-across-generations.md` — Pipeline configs and prompt variants are model-specific; re-tune when the model changes, not when it ships.

## Architectural patterns

- `wiki/patterns/python-derived-classification.md` — Let the LLM emit ordinal scores; derive the final verdict deterministically in code so per-provider bias can be subtracted.
- `wiki/patterns/federated-review-engines.md` — Heterogeneous review engines with a unified findings schema, hub-and-spoke orchestration, atomic per-engine outputs.

## Prompting

- `wiki/prompting/fewshot-variant-by-model.md` — Prompt-engineering variants are model-specific; the "best variant" depends on the provider × task pair.

## Operational discipline

- `wiki/workflows/failure-mining.md` — Meta-workflow for extracting lessons from aborted runs, misdiagnoses, and silent failures.
- `wiki/incidents/cerebras-false-positive-adoption.md` — Eval framework certified a provider as SUITABLE on n=10; production inflation was 25 points.
- `wiki/incidents/variant-b-silently-broken-at-publish.md` — Headline-victory eval was published while Variant B was non-executable on the publishing environment.

## Project context (referenced sources)

- `wiki/projects/resume-engine.md` — Private application-pipeline project; source for `python-derived-classification` and parts of `failure-mining`.
- `wiki/projects/nit-pick-supreme.md` — Private code-review tool; source for `federated-review-engines`.
