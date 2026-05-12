---
title: Position-bias correction in pairwise preference eval
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [evals, judges, bias]
provenance: [langgraph-agents](https://github.com/Senkichi/langgraph-agents)
---

# Position-bias correction in pairwise preference eval

LLM judges have a measurable preference for one position over another in pairwise comparisons (typically first or last, depending on prompt structure). If you ignore this, your win rates are biased by however strong the position effect is for your specific judge × prompt combination.

## The fix [langgraph-agents](https://github.com/Senkichi/langgraph-agents) uses

For every pair `(A, B)`:

1. Ask the judge to rank `A vs B` (natural order).
2. Ask the judge to rank `B vs A` (swapped order).
3. If the judge picks the same *position* twice, it has position bias on this pair — score as 0.5 (tie).
4. If the judge picks the same *response* twice (different positions across the two queries), the preference is real — score as 1.0 win for that response.

## Measured rate

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) 001 baseline observed **18.7% position-bias rate** across the 10-config × 5-task × 2-judge matrix. Roughly one judgment in five had to be tied out.

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) 003 Phase 0 measured DeepSeek V4 Pro's rate as 1/6 (~17%) on a small sample — non-trivial and worth tracking on the larger Phase 2 corpus. Position-bias rate is a per-judge property, not a constant.

## Why this is load-bearing

Without correction, a judge with a 20% first-position bias systematically over-rewards whichever response you happened to put first. If you batch-judge with the same ordering ("model A is always first"), the effect compounds across the whole eval and your headline number is fiction.

With correction, position bias becomes a measured noise floor: 20% of judgments are converted to ties, which is conservative but unbiased.

## Cost

You double the judging calls. For Anthropic-priced eval at ~$0.10/judgment, a 24-pair matrix goes from $2.40 to $4.80. This is the correct trade — the half-cost run produces unreliable conclusions.

## Adjacent technique: rotate the position systematically

If you can't afford the double-call cost, randomize the order of `(A, B)` per query and report bias rate separately. You still get an estimate of the bias magnitude, and your win rates aren't systematically tilted — they're just noisier.

## Anti-pattern: averaging without correction

> "We averaged win rates across 100 pairs; that washes out position bias."

It doesn't. If the judge has a 20% first-position bias, the average is shifted by 0.5 × 0.20 = 10 percentage points toward whichever response your code put first. The mean is biased; only the variance is reduced.

## Related

- [[judge-family-bias]] — the other invisible bias in LLM-as-judge
- [[baseline-eval-2026-04-18]] — the 18.7% rate in context
