---
title: Incident — Cerebras adopted SUITABLE on n=10, +25pt inflation in production
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [incident, evals, providers]
provenance: [job-cannon](https://github.com/Senkichi/job-cannon)
---

# Incident — Cerebras adopted SUITABLE on n=10, +25pt inflation in production

## What happened

Cerebras was being screened as a candidate provider for [job-cannon](https://github.com/Senkichi/job-cannon)'s scoring cascade. Initial eval pass at n=10 returned `r=0.935, schema 100%`. The eval framework verdicted SUITABLE. Cerebras was promoted into the production cascade.

In production, downstream metrics drifted. Scores routed through Cerebras came in systematically higher than scores routed through the Anthropic fallback. Verdicts ("apply / consider / reject") shifted. The user noticed.

Larger re-eval at **n=30** returned `r=0.808, +30.5 average delta`. Cerebras was scoring 30 points high on every job. The n=10 had been **biased toward high-scoring jobs**, where ceiling-clipping at 100 hid the inflation and produced what looked like agreement.

## Why the failure was invisible

- The headline metric (Pearson r) is **invariant to bias by construction.** A model scoring `[40, 50, 60]` when truth is `[10, 20, 30]` gets r=1.0.
- Schema adherence (100%) was perfect — outputs parsed cleanly, no errors thrown.
- The verdict gate (SUITABLE/MARGINAL/UNSUITABLE) used r as the load-bearing input.
- The sample (n=10) was small enough that "biased toward high-scoring jobs" was within normal sample variance, not a flag.

Every individual signal was green. The composite was broken.

## Cascade-wide consequence

This was not a single-model problem. Re-eval with the new methodology revealed that **every free provider tested — Cerebras, Groq, Ollama, SambaNova, Gemini — had +20-35 point inflation against the Opus baseline.** The entire screening-to-production pipeline had been certifying providers using a metric that hides the failure mode.

## The fix (eval methodology)

| Old metric | New metric set |
|------------|---------------|
| r (Pearson) only | r + mean_delta (bias) + MAE + bucket_deltas + baseline_distribution |
| SUITABLE threshold: r ≥ 0.85 | SUITABLE: MAE ≤ 15 AND \|bias\| ≤ 10 |
| MARGINAL threshold: r ≥ 0.7 | MARGINAL: MAE ≤ 25 AND \|bias\| ≤ 20 |
| Sample: n=10 | Sample: n ≥ 50 with `--baseline opus --sample-size 50+` |

See [[anti-patterns/pearson-r-only-eval]] for the pattern. This incident is the case the pattern was extracted from.

## The deeper architecture fix

Two failure modes were entangled:

1. The eval framework couldn't detect bias (fixed above).
2. The verdict was being emitted by the LLM, so bias directly shifted apply/reject rates.

Decoupling the verdict from the LLM ([[python-derived-classification]]) lets a per-provider bias correction be subtracted before the verdict is derived. Even with biased model outputs, the verdict distribution can be stabilized. The eval-methodology fix prevented future false positives; the architecture fix contained the blast radius of any false positive that slipped through.

## Lessons

- **Pick eval metrics that fail closed**, not open. r is the wrong primary because its failure mode is invisible.
- **Verify the screening sample matches the production distribution.** A biased sample (toward high-scoring rows) hid the failure. Stratify by bucket and check `baseline_distribution` before trusting the verdict.
- **The verdict gate has an SLO.** "SUITABLE" became a guarantee that production behavior wouldn't shift. When the guarantee held was unclear; when it didn't hold, $X of bad production decisions happened before discovery. Spec the gate as carefully as a contract.
- **A false-positive verdict on one model often implicates the framework, not the model.** When Cerebras was reset, all the other free providers got re-evaluated. They all failed by the same standard. The framework had been giving false positives at scale.

## What we'd have done differently

- Started screening at n=30 minimum, not n=10. The 3x cost is trivial relative to the cost of shipping a bad verdict.
- Built MAE + bias reporting into the eval framework from day 1, not as a follow-up.
- Sampled stratified-by-bucket from the start.
- Used cross-bucket inspection (low-score rows inflate the most) as a tripwire — even one bucket with a +25pt mean delta should have failed the verdict gate, regardless of overall r.

## Related

- [[anti-patterns/pearson-r-only-eval]] — the pattern extracted from this incident
- [[python-derived-classification]] — the containment architecture
- the provider correlation leaderboard (current measurements with the new methodology applied)
- [[workflows/failure-mining]] — the meta-discipline that made this writeup possible
