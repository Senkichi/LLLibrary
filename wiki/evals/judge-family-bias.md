---
title: Judge-family bias in LLM-as-judge pairwise eval
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [evals, bias, judges]
provenance: [langgraph-agents](https://github.com/Senkichi/langgraph-agents)
---

# Judge-family bias in LLM-as-judge pairwise eval

When you use only same-family judges (e.g., both Opus and Sonnet from Anthropic) for pairwise preference, you inherit a same-family preference structure that does not generalize. The verdicts will be more consistent than they should be, and the magnitude of any observed effect will be inflated.

## The specific data

In [langgraph-agents](https://github.com/Senkichi/langgraph-agents), Experiment 003 Phase 0 ran the 002 corpus through a cross-family judge (DeepSeek V4 Pro) and compared verdicts against the original Claude judges (Opus + Sonnet).

| Metric | Claude judges (opus + sonnet) | DeepSeek V4 Pro |
|--------|-------------------------------|-----------------|
| Unanimity on the six 4.6-vs-4.7 cross-quadrant cells from 2A | **1.00** | **0.75** |
| Substantive disagreements | 0 of 6 | 2 of 6 (both at low-round configs) |
| Position-bias rate | (lower) | 1 of 6 (~17%) |

The 002 headline "every Opus 4.7 config beats every Opus 4.6 config" is real but its magnitude is **inflated by ~25%**. Verdict per the locked decision rule (0.55–0.85 deflation band): **INFLATED**.

## Where the disagreement concentrates

Of the 6 cross-quadrant cells, the 3 at 7-round all agreed across families. 2 of the 3 disagreements happened at 3-round.

This is consistent with [[anti-patterns/configs-port-across-generations]]: at 3 rounds, the responses are closer in quality (the "uncanny valley"), so the judge has less signal, and different judges weight different things. By 7 rounds, the response gap is wide enough that any reasonable judge agrees on the winner.

**At low-signal regimes, judge identity matters more.**

## DeepSeek's substantive disagreement was not noise

On `design_testing_strategy 3rnd`, DeepSeek picked the 4.6 response in both orderings (no position bias) because the 4.6 response had "more concrete code examples, specific tool configurations, and detailed fault-injection scenarios." The Claude judges weighted "architectural concepts" higher. Both axes are legitimate evaluative dimensions.

Same-family judging implicitly enforces a single axis. Cross-family judging surfaces axis disagreement that single-family judging hides.

## The fix

Add a third judge from a different model family. In [langgraph-agents](https://github.com/Senkichi/langgraph-agents), Phase 2-3 promoted DeepSeek V4 Pro to a permanent judge alongside Opus + Sonnet. Cost reality check: DeepSeek pricing brings worst-case Phase 2-3 cost to ~$8-11 (vs ~$30-50 if the cross-family judge had been GPT-4o).

**You don't need three judges from three families.** Two same-family + one cross-family is enough to detect the deflation factor on a small calibration set, then either:

1. Adjust the magnitude of headline numbers (`*= 0.75` in this case), or
2. Use the cross-family verdict only on cells with disagreement, falling back to same-family on cells where both judges agree.

## Operational gotcha: thinking-mode budget

Cross-family judges often have thinking-mode by default (DeepSeek V4 Pro, OpenAI o-series, Claude with extended thinking). They burn `max_tokens` on **internal** reasoning before emitting any visible content. Phase 0.1's first run set `max_tokens=600` and got empty `content` on every call — reasoning consumed the whole budget.

Floor for full-eval-prompt judging is **`max_tokens ≥ 8000`** (or pass `max_thinking_tokens` separately if the SDK splits them). Falling back to a `reasoning_content` parse if `content` is empty is a safety net, not a solution.

## The locked decision rule (worth borrowing)

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) uses an explicit band for verdicting cross-family deflation:

| Cross-family agreement rate | Verdict |
|-----------------------------|---------|
| < 0.55 | NOISE (judges aren't measuring the same thing) |
| 0.55 – 0.85 | INFLATED (same-family overstates the effect) |
| ≥ 0.85 | CONFIRMED (same-family verdict is robust) |

Locking the verdict rule **before** running the cross-family judge prevents post-hoc rationalization.

## Related

- [[position-bias-correction]] — the other invisible bias in LLM-as-judge
- the cross-family judge calibration experiment (Phase 0 of Experiment 003), where this deflation factor was first measured.
- an operational constraint: cross-family judges with built-in thinking modes need `max_tokens ≥ 8000` so the budget isn't consumed by internal reasoning.
