# LLLibrary

> Field notes on LLM evaluation and agent systems — one page per lesson,
> grounded in real experiments and real numbers.

```
   langgraph-agents ──┐
         job-cannon ──┤
      resume-engine ──┼──►  LLLibrary  ──►  evals · patterns · anti-patterns · incidents
   nit-pick-supreme ──┘
```

Each headline below links to the page that earns it.

---

### [A rank correlation of 0.935 once shipped a model that inflated production scores by 25 points.](wiki/anti-patterns/pearson-r-only-eval.md)

Pearson r is invariant to affine transforms — which is precisely the
property that hides systematic bias. A model that scores `truth + 25`
returns r=1.0 with perfect rank order and a catastrophic calibration
failure. The fix is a four-metric panel: **r** for rank, **mean_delta**
for bias, **MAE** for per-row error, **bucket_deltas** for where the
inflation concentrates (it is always at the low end of the scale).

### [Same-family LLM judges inflate effect sizes by ~25%.](wiki/evals/judge-family-bias.md)

Two Anthropic judges scoring an Anthropic-vs-Anthropic comparison agreed
on every cell. One cross-family judge (DeepSeek V4 Pro) ran the same
cells and disagreed on a third of them — clustered, predictably, at the
low-signal configurations where any reasonable judge would diverge. The
cheap mitigation is one cross-family judge on a calibration set, with
the deflation band locked **before** the run so the verdict can't be
rationalized after.

### [An eval framework certified a provider as SUITABLE on n=10. Production scores were 30 points high.](wiki/incidents/cerebras-false-positive-adoption.md)

Cerebras returned `r=0.935` and 100% schema adherence on the screening
eval. The n=10 sample skewed toward high-scoring jobs, where a 25-point
inflation ceiling-clipped at 100 and read as agreement. Re-eval at n=30
returned `r=0.808` with **+30.5** mean delta. The deeper finding: every
free provider tested under the new methodology — Cerebras, Groq, Ollama,
SambaNova, Gemini — failed the same way. The framework had been emitting
false positives at scale.

### [Twelve heterogeneous review engines, one findings schema, no chained agents.](wiki/patterns/federated-review-engines.md)

[nit-pick-supreme](wiki/projects/nit-pick-supreme.md) dispatches code
engines (Haiku), architectural engines (Opus), and a browser explorer
(Sonnet) in parallel, each emitting JSON in a unified envelope.
Synthesis happens in the orchestrator, not by chaining. Cost discipline
is baked into the topology. Fixes execute in parallel git worktrees and
revert in reverse merge order when regressions appear — replacing the
predecessor's `--allow-failing-tests` flag with automatic baseline
comparison.

### [Let the LLM emit ordinal scores; derive the verdict in code.](wiki/patterns/python-derived-classification.md)

When verdicts are emitted by the model, per-provider bias shifts the
apply/reject distribution directly. When verdicts are derived
deterministically in Python from numeric outputs, a measured bias term
can be subtracted before classification. This is the containment
architecture that bounded the blast radius of the Cerebras incident
above: even when the next false-positive verdict slips through, the
production decision distribution stays stable.

### [The polished wiki page reads cleanly because the raw evidence captures the floundering.](wiki/workflows/failure-mining.md)

A library of only successes is half a library. The non-obvious lessons
live in the failures — aborted runs, misdiagnoses, code that shipped
disabled, prompts that needed five rejection rounds. The load-bearing
question is rarely *what went wrong*; it is *why didn't we notice for
twelve days*. Write the case study while that question is still fresh —
once the recovery narrative sanitizes, the lesson goes with it.

---

For the full set: [`wiki/anatomy.md`](wiki/anatomy.md) (flat sitemap) ·
[`wiki/index.md`](wiki/index.md) (themed) · the repo opens cleanly as an
[Obsidian](https://obsidian.md) vault.

### Source projects

| Project | Role |
|---|---|
| [langgraph-agents](https://github.com/Senkichi/langgraph-agents) | Debate-style LLM evaluation framework |
| [job-cannon](https://github.com/Senkichi/job-cannon) | Multi-provider job-scoring cascade |
| [resume-engine](wiki/projects/resume-engine.md) | Application tailoring pipeline *(private)* |
| [nit-pick-supreme](wiki/projects/nit-pick-supreme.md) | Federated code review tool *(private)* |

[CC BY 4.0](LICENSE) — reuse with attribution.
