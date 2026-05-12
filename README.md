# LLLibrary

> Field notes on LLM evaluation and agent systems — one page per lesson,
> grounded in real experiments and real numbers.

A cross-linked wiki distilled from production work on debate-style evals,
multi-provider scoring cascades, and federated code review. Each page is a
technique, an anti-pattern, or a postmortem — with provenance, and with the
numbers that made the lesson stick.

## A few worth opening

- [**Judge-family bias**](wiki/evals/judge-family-bias.md) — when your judge
  shares a family with the model under test, effect sizes inflate. One
  cross-family judge on a calibration set surfaces the deflation factor.
- [**Pearson-r-only eval**](wiki/anti-patterns/pearson-r-only-eval.md) —
  a rank correlation of 0.935 once shipped a model that was inflating
  production scores by 25 points. Calibration is not correlation.
- [**Cerebras false-positive adoption**](wiki/incidents/cerebras-false-positive-adoption.md)
  — an eval framework certified a provider as SUITABLE on n=10. Production
  told a different story.
- [**Federated review engines**](wiki/patterns/federated-review-engines.md) —
  heterogeneous reviewers behind a unified findings schema; hub-and-spoke
  orchestration with atomic per-engine outputs.
- [**Failure mining**](wiki/workflows/failure-mining.md) — the meta-workflow
  for extracting signal from aborted runs, misdiagnoses, and silent failures.

For the full set, see [`wiki/anatomy.md`](wiki/anatomy.md) (flat sitemap) or
[`wiki/index.md`](wiki/index.md) (themed).

## House style

- Pages use `[[wikilink]]` syntax and open cleanly as an
  [Obsidian](https://obsidian.md) vault.
- Every non-trivial claim cites its source in the page's `provenance:`
  frontmatter. No claim without a project behind it.
- No internal jargon. Pages are written for a cold reader.

## Source projects

- [langgraph-agents](https://github.com/Senkichi/langgraph-agents) —
  debate-style LLM evaluation framework
- [job-cannon](https://github.com/Senkichi/job-cannon) — multi-provider
  job-scoring cascade
- [resume-engine](wiki/projects/resume-engine.md) — application tailoring
  pipeline *(private)*
- [nit-pick-supreme](wiki/projects/nit-pick-supreme.md) — federated code
  review tool *(private)*

## License

[CC BY 4.0](LICENSE) — reuse with attribution.
