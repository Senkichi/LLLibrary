---
title: Anti-pattern — assuming pipeline configs port across model generations
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [evals, models, anti-pattern]
provenance: "[langgraph-agents](https://github.com/Senkichi/langgraph-agents)"
---

# Anti-pattern: assuming pipeline configs port across model generations

A pipeline configuration that's optimal on model version N is not necessarily optimal on N+1. **Re-tune when the model changes.**

## The specific data

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) Experiment 001 (2026-04-18, Opus 4.6) found that `max_debate_rounds=3` produced the strongest B-homo-opus configuration on 3 complex tasks (93.5% win rate).

Experiment 002A (2026-04-23, Opus 4.7) tested rounds ∈ {1, 3, 5, 7} on the same 3 tasks. The within-4.7 win matrix:

| | B-opus47-1rnd | B-opus47-3rnd | B-opus47-5rnd | B-opus47-7rnd |
|---|---|---|---|---|
| **B-opus47-1rnd** | — | 0.58 | 0.58 | 0.25 |
| **B-opus47-3rnd** | 0.42 | — | 0.17 | 0.17 |
| **B-opus47-5rnd** | 0.42 | 0.83 | — | 0.30 |
| **B-opus47-7rnd** | 0.75 | 0.83 | 0.70 | — |

Two findings the 001 baseline did not predict:

1. **`max_rounds=3` is the worst non-trivial choice on Opus 4.7.** It loses to `max_rounds=1`. Enough debate to dilute initial positions, not enough to converge. An "uncanny valley" — the synthesizer input is neither converged nor naive.
2. **`max_rounds=7` dominates within 4.7.** On 4.6, the win-matrix gap between 3-round and 7-round was much smaller.

The pattern that won on 4.6 was harmful on 4.7. Cleanly.

## Why this happens

A debate round is a unit of expensive deliberation. Different model generations have different *latent positions per round* — how much new information each turn adds beyond restating the prior turn. Newer models may need fewer rounds to reach an interesting position, or more rounds before fully converging. Both shift the optimal cap.

Same logic applies to:

- **Temperature** — newer models often need lower temperatures for equivalent diversity
- **System-prompt length** — newer models tolerate (or even prefer) longer/more structured system prompts
- **Few-shot count** — newer models may need fewer examples
- **Reasoning effort** — `reasoning_effort` knobs change meaning across model generations

## What to do

- **Pin explicit model IDs in every experiment.** Aliases drift — `opus` flipped from claude-opus-4-6 → claude-opus-4-7 between 001 and 002 (a specific incident where the `opus` alias silently flipped from `claude-opus-4-6` to `claude-opus-4-7` between Experiments 001 and 002, surfacing this whole class of bug).
- **When citing prior config recommendations, qualify with the model they were tuned on.** "[langgraph-agents](https://github.com/Senkichi/langgraph-agents) 001 recommended max_rounds=3" is misleading without "(on 4.6)".
- **Treat the model upgrade as the experiment, not the assumption.** Run a small re-tuning sweep against the same eval corpus when a new generation lands. Cost is small relative to running the wrong config in production for a quarter.
- **Don't ship a single round count for a multi-tenant pipeline.** Expose it as a per-deployment knob if the deployment can choose its own model.

## Adjacent insight: diversity hypothesis is dimension-specific

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) 002B tested cross-generation pairing (Opus 4.6 × 4.7). Cross-*tier* heterogeneity (opus × sonnet) helps. Cross-*generation* heterogeneity (4.6 × 4.7) does **not**. Strict ordering: `B-homo-opus47 > B-het-opus46-opus47 > B-homo-opus46`. From the synthesizer's perspective, an older-gen peer behaves like a weaker peer, not a "differently strategic peer." The diversity intuition is real but doesn't generalize across the version axis.

## Related

- a specific incident where the `opus` alias silently flipped from `claude-opus-4-6` to `claude-opus-4-7` between Experiments 001 and 002, surfacing this whole class of bug
- an operational hygiene rule: pin explicit model IDs in every experiment so alias drift is auditable
- an environment-provenance frontmatter convention that lets you detect alias drift after the fact
- a follow-up experiment (002) — full eval writeup of the rounds × model-generation matrix
