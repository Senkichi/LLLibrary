---
title: Let the LLM emit ordinal scores; derive the verdict in code
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [scoring, validation, determinism]
provenance: [job-cannon](https://github.com/Senkichi/job-cannon), [[projects/resume-engine]]
---

# Let the LLM emit ordinal scores; derive the verdict in code

When an LLM produces a categorical decision (apply / consider / reject; pass / fail / needs-review; high / medium / low), do **not** let it emit the verdict directly. Have it emit the underlying *evidence axes* and derive the verdict deterministically in code.

## Concrete example ([job-cannon](https://github.com/Senkichi/job-cannon) v3.0 single-tier scoring)

The LLM emits six ordinal sub-scores: `title_fit, location_fit, comp_fit, domain_match, seniority_match, skills_match` — each 1–5.

A pure Python function (`job_finder.db._classification.derive_classification`) maps the six sub-scores to one of `{apply, consider, reject}`. The LLM never sees or emits the verdict.

## Why this shape wins

- **The verdict is testable.** Pure functions of pure inputs have unit tests. LLM-emitted verdicts do not.
- **The verdict is changeable without re-running the LLM.** Want to make `apply` thresholds stricter? Edit the Python. The 6 sub-scores in the DB are immutable history — they don't need re-scoring.
- **Provider swaps don't change the verdict distribution.** When you cascade Ollama → Groq → Cerebras → Anthropic, each provider may inflate by +20-35 points (see [[anti-patterns/pearson-r-only-eval]]). If the verdict comes from the LLM, your `apply` rate spikes when the cascade hits a different provider. If the verdict comes from Python over normalized sub-scores, you can subtract a per-provider bias before deriving the verdict.
- **Sub-scores are a richer signal than a single label.** Even when the verdict matches, "rejected because seniority mismatch" is a different action than "rejected because comp mismatch". Verdict-only output discards that information.
- **You can ensemble.** Run two models, average the sub-scores, then derive the verdict. Verdict-only ensembling requires majority-vote schemes that are noisier and less informative.

## Related pattern: mechanistic checks over LLM judgment

From [[projects/resume-engine]]:

> Convert LLM-judgment validation to mechanistic regex/pattern checks wherever possible (deterministic > probabilistic for validation).

Use LLMs to *generate* signals. Use code to *judge* signals. The boundary is where determinism, testability, and audit cost get cheap.

## When NOT to apply this

- When the LLM is doing genuine open-ended categorization that doesn't decompose into ordinal axes (e.g., "tag this support ticket with the right product"). Forcing axes there is over-engineering.
- When the categorical decision has only one obvious axis (e.g., "is this email spam?"). Two-stage adds latency without information gain.

## Related

- a multi-provider cascade routing pattern where queries fall back through providers by cost — the cascade only works if verdicts are derived deterministically downstream, not produced by the LLMs themselves
- [[anti-patterns/pearson-r-only-eval]] — bias-checking sub-scores is the right granularity
- [[no-signal-vs-midpoint]] — ordinal scales need an explicit "no information" code, not midpoint
