---
title: Anti-pattern — evaluating model quality with Pearson r alone
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [evals, anti-pattern, bias]
provenance: "[job-cannon](https://github.com/Senkichi/job-cannon)"
---

# Anti-pattern: evaluating model quality with Pearson r alone

Pearson correlation between a candidate model's scores and a gold baseline tells you whether the model **preserves rank ordering**. It says nothing about whether the absolute scores are calibrated. A model that scores every job `truth + 25` will have r=1.0 with perfect rank correlation and a 25-point systematic inflation.

## The specific failure

[job-cannon](https://github.com/Senkichi/job-cannon) adopted Cerebras as a production provider after an initial eval (n=10, r=0.935, schema 100%) verdicted SUITABLE. In production this inflated scores by ~25 points across the entire cascade. A larger follow-up (n=30) returned r=0.808 with **+30.5 average delta** — meaning Cerebras was systematically scoring 30 points higher than Opus. Rank correlation was fine. Calibration was catastrophically off.

The initial n=10 looked clean because the sample was biased toward high-scoring jobs, where the inflation ceiling-clipped at 100 and looked like agreement.

Every free provider tested at the time — **Cerebras, Groq, Ollama, SambaNova, Gemini** — showed +20–35 point inflation against the Opus baseline.

## Why r looks safe

It's the metric every eval blog post leads with. It's a single number between -1 and 1 with a clear semantic ("0.9 is great"). It's invariant to affine transforms — which is exactly the property that hides the bug.

## The four metrics any eval should report

| Metric | What it catches |
|--------|-----------------|
| **r (Pearson)** | rank correlation only |
| **mean_delta (bias)** | systematic offset — the thing r misses |
| **MAE (mean absolute error)** | per-row accuracy |
| **bucket_deltas** | where the inflation is worst — low-scoring jobs inflate most |

Plus **baseline_distribution** as a sanity check on sample representativeness. The n=10 / n=30 disagreement above was only diagnosable by inspecting bucket distribution.

## [job-cannon](https://github.com/Senkichi/job-cannon)'s verdict gates (after the fix)

| Verdict | Conditions |
|---------|-----------|
| SUITABLE | MAE ≤ 15 AND |bias| ≤ 10 |
| MARGINAL | MAE ≤ 25 AND |bias| ≤ 20 |
| UNSUITABLE | anything else |

And: always run with `--baseline opus --sample-size 50+`. Smaller samples produced the false-positive verdict in the first place.

## What you give up by using r alone

You can no longer **swap models in a cascade and trust the downstream verdicts**. If your downstream consumer's apply/reject threshold is at score 70, a +25 bias shifts the apply rate dramatically. This is why [[python-derived-classification]] becomes load-bearing: you can subtract a per-provider bias before deriving the verdict, but only if you measure bias in the first place.

## Generalization

Whenever you're verdict-gating on absolute LLM output (score, probability, severity), check bias. Whenever you're verdict-gating on relative ordering (best-of-N, ranking, pairwise win rate), r is fine on its own.

For pairwise-preference evaluation specifically, see [[judge-family-bias]] — a different and equally invisible bias.

## Related

- a multi-provider routing architecture where each cascade step uses a different provider, downstream verdicts are derived deterministically in code (see [[python-derived-classification]]), so per-provider bias can be subtracted before classification
- [[python-derived-classification]] — the architecture that contains the blast radius
- [[no-signal-vs-midpoint]] — another invisible failure mode in ordinal scoring
