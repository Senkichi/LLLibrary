---
title: Dual-pipeline baseline eval (2026-04-18)
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [evals, langgraph-agents]
provenance: [langgraph-agents](https://github.com/Senkichi/langgraph-agents)
---

# Dual-pipeline baseline eval (2026-04-18)

First full eval run of [langgraph-agents](https://github.com/Senkichi/langgraph-agents): **10 configurations × 5 tasks = 50 runs, parallel=3**, no API fallback (local Claude Code subscription only). Total spend $58.71. Wall time 127 min end-to-end. 50/50 successful, 0 errors.

## Configurations

| ID | Variant | Generator L | Generator R |
|---|---|---|---|
| A-homo-opus | A | opus | opus |
| A-homo-sonnet | A | sonnet | sonnet |
| A-homo-haiku | A | haiku | haiku |
| A-het-opus-sonnet | A | opus | sonnet |
| A-het-sonnet-haiku | A | sonnet | haiku |
| B-homo-opus | B | opus | opus |
| B-homo-sonnet | B | sonnet | sonnet |
| B-homo-haiku | B | haiku | haiku |
| B-het-opus-sonnet | B | opus | sonnet |
| B-het-sonnet-haiku | B | sonnet | haiku |

All runs: `random_seed=42`, `max_debate_rounds=3` (Variant B), `parallel=3`.

The `opus`/`sonnet`/`haiku` aliases at this point resolved to claude-opus-4-6 (almost certainly — see opus alias drift: the `opus` alias flipped from `claude-opus-4-6` to `claude-opus-4-7` between Experiments 001 and 002, only detected after the fact).

## Tasks

- `sanity_prompt_caching` (short, 3-sentence explainer)
- `sanity_semver` (short, 3-sentence explainer)
- `architectural_review_auth` (long, JWT auth design review)
- `design_testing_strategy` (long, Kafka 10k/sec testing plan)
- `migration_postgres_dynamo` (long, 2B-row event-table migration)

## Headline findings

| Finding | Detail |
|---------|--------|
| **B beats A by 15 points on complex tasks** | 57.3% vs 42.7% on the 3 long tasks |
| **B-homo-opus wins 93.5%** | Highest cost ($3.40/run avg) |
| **A-het-opus-sonnet is Pareto winner** | 75% win rate, $1.57/run |
| **Haiku is not viable solo** | Only works as weaker half of heterogeneous pair |
| **Variant B costs ~2× Variant A** | Stable ratio across opus/sonnet/haiku/het |
| **Most B debates hit `max_rounds`** | 17/25 (room to explore higher round caps) |
| **18.7% position-bias rate** | Handled by scoring as ties — see [[position-bias-correction]] |

## Variant B convergence is task-bounded, not model-bounded

The strongest single signal in the data:

| Task type | mutual_agreement | max_rounds |
|-----------|------------------|------------|
| Sanity tasks (n=10) | 70% (7/10) | 30% |
| Long tasks (n=15) | 7% (1/15) | 93% |

The one B-on-long that converged (B-homo-opus on `migration_postgres_dynamo`) showed real substantive engagement — debaters traded technical concessions on bucketing strategy and rollback mechanics across four rounds before arriving at a fully merged architecture. **This is the pattern the research literature hoped debate would produce.**

## Response length is bimodal by task type, not by variant

Sanity tasks produce 700 B – 3 KB final plans; long tasks produce 18–39 KB. Variant B does **not** systematically produce longer responses (±10% on most task/model combinations). The synthesizer uses the debate transcript as context, not as filler.

## What this baseline does NOT establish

- **Quality verdict on convergence.** No pairwise judging compared converged-debate output to non-converged. The 1/15 convergence on long tasks is consistent with "3 rounds isn't enough" *and* with "debaters genuinely disagree on complex architecture problems." A follow-up experiment (002) resolved this — model version dominates rounds; the 3-round configuration is in an uncanny valley on the newer model.
- **Cross-generation behavior.** All configs used the same model generation. Cross-generation was tested in 002B.
- **Cross-family judge stability.** All judges were Claude. [[judge-family-bias]] later established the cross-family deflation factor.

## Caveats

- 3 complex tasks is a small N. The 002 follow-up retains this corpus, so this isn't a number-of-tasks problem — it's a generalization problem.
- Single run per config; no variance estimate.
- Both judges are Claude — see [[judge-family-bias]] for what this missed.

## Superseded by

- a follow-up experiment (002) — model version dominates rounds; 3-round is uncanny-valley on the newer model.
- a Phase 0 cross-family calibration experiment (003) — judge-family bias deflates the newer-over-older effect by ~25%.

## Related

- an atomic-write pattern that made resume work cleanly when matrix runs crashed mid-run
- an environment-provenance frontmatter convention that made later cross-experiment comparison possible
