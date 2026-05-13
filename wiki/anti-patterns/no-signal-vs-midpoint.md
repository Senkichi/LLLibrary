---
title: Anti-pattern — collapsing "no signal" into the midpoint
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [rubrics, evals, anti-pattern]
provenance: "[job-cannon](https://github.com/Senkichi/job-cannon)"
---

# Anti-pattern: collapsing "no signal" into the midpoint

A 1-5 ordinal sub-score scale has no native encoding for "I lack the information to score this axis." Both the human labeler and the model collapse missing-info into 3 — the midpoint — producing two different failure modes wearing the same costume:

- A real 3: "the evidence is neutral, midway between weak and strong"
- A fake 3: "I couldn't tell from the JD, so I picked the safe middle"

The MAE between gold and predicted treats both 3s as the same, so:

- If gold and model both abstain on the same axis, MAE reports 0 (false agreement).
- If gold abstains and model has a real opinion, MAE penalizes the model for something the rubric never asked it.
- If gold has a real opinion and model abstains, MAE under-counts the disagreement because the model defaulted to the most-common value.

## How it surfaced in [job-cannon](https://github.com/Senkichi/job-cannon)

During Phase 3 gold labeling (2026-04-28), the user reported:

> Most of my 3s were because the information wasn't available, not because it was more than a 2 but less than a 4.

`comp_fit` is the most common offender: many ingested rows have NULL `salary_min`/`salary_max` and the JD doesn't mention compensation. Both the labeler and the scoring model produce 3s for the same reason: no signal. The eval harness reports false agreement.

## Three fixes (rubric variants explored)

| Variant | Approach |
|---------|----------|
| **B1** | Explicit no-signal code (0 or N/A) outside the 1-5 range. Forces the model to choose between "no information" and "neutral evidence." |
| **B2** | Re-anchor 3 as "neutral evidence in JD"; missing-info maps to 2. Keeps the 1-5 scale but redefines the lower-mid. |
| **B3** | Force per-axis evidence quote. No quote → cap at 2. Implicit no-signal via the absence of evidence. |

All three remove the ambiguity at rubric design time. Once the gold labels carry an explicit no-signal code, the eval harness can DROP those (axis, row) pairs from per-axis MAE/correlation — they were never measurable in the first place.

## The implementation half (Migration 44 in [job-cannon](https://github.com/Senkichi/job-cannon))

A `gold_no_signal_axes` column (JSON list of axis names) carries the labeler's abstention per row. The `revisit_gold_threes.py` CLI captures this for already-labeled rows. The Phase 5 eval harness reads the column and drops those axes from comparison.

## Generalization

Any ordinal-scale rubric — eval rubrics, customer satisfaction surveys, severity scales — has this latent failure mode if it does not distinguish abstention from midpoint. The fix is always either an explicit abstention code or a forced-evidence requirement that makes abstention impossible.

If you're designing an LLM-as-judge rubric for the first time, build B1 or B3 in from the start. Adding it later requires re-labeling everything.

## Related

- [[anti-patterns/pearson-r-only-eval]] — another invisible failure mode in ordinal scoring
- [[python-derived-classification]] — sub-scores are the right granularity to abstain at, not verdicts
