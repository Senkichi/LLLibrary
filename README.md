# LLLibrary

Field-tested lessons on LLM evaluation and agent systems.
Each page is one technique, one anti-pattern, or one postmortem —
grounded in real experiments and real numbers.

## Where to start

If you care about evaluation methodology:
  → wiki/evals/judge-family-bias.md
  → wiki/evals/position-bias-correction.md
  → wiki/anti-patterns/pearson-r-only-eval.md

If you care about agent architecture:
  → wiki/patterns/python-derived-classification.md
  → wiki/patterns/federated-review-engines.md

If you care about postmortems and process:
  → wiki/incidents/cerebras-false-positive-adoption.md
  → wiki/workflows/failure-mining.md

For everything: wiki/anatomy.md (sitemap) or wiki/index.md (themed index)

## How it's organized

Cross-linked knowledge base. Pages use `[[wikilink]]` syntax so the repo
opens cleanly as an Obsidian vault. Every non-trivial claim cites its
source project in the page's `provenance:` frontmatter.

## Projects referenced

- [langgraph-agents](https://github.com/Senkichi/langgraph-agents) — debate-style LLM eval framework
- [job-cannon](https://github.com/Senkichi/job-cannon) — multi-provider job-scoring cascade
- resume-engine — application tailoring pipeline (private, see `wiki/projects/resume-engine.md`)
- nit-pick-supreme — federated code review tool (private, see `wiki/projects/nit-pick-supreme.md`)

## License

CC BY 4.0 — reuse with attribution.
