---
title: Failure mining — extracting lessons from aborted runs and flailing
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [meta, workflows, learning]
provenance: "synthesized from postmortem corpus across [langgraph-agents](https://github.com/Senkichi/langgraph-agents), [job-cannon](https://github.com/Senkichi/job-cannon), [[projects/resume-engine]]"
---

# Failure mining — extracting lessons from aborted runs and flailing

A wiki of polished successes is half a wiki. The other half is the failure narratives — aborted runs, misdiagnoses, code that shipped disabled, investigations that ended in dead ends, prompts that needed five rejection rounds before the design changed.

Failures are where the **non-obvious** lessons live. Successes are usually predictable in retrospect ("X worked because we did the obvious thing"). Failures encode the surprises — and the surprises are what's worth remembering.

## What to capture about a failure

Each entry under `wiki/incidents/` follows roughly the same shape:

1. **What happened** — narrative, present tense, no editorializing. The events as they unfolded.
2. **Why it stayed invisible / why the natural diagnostic was wrong** — the load-bearing question. This is where the non-obvious lives.
3. **The fix** — what was actually done.
4. **Lessons** — generalized rules extracted from the specific incident.
5. **What we'd have done differently** — counterfactual. Specific actions, not platitudes.
6. **Generalization** — the class of system this applies to beyond the specific repo.
7. **Related** — wikilinks to patterns / anti-patterns / other incidents.

Step 2 is the most important. The story of "what went wrong" is usually obvious in hindsight. The story of "why we didn't notice for 12 days" is the actually-valuable part.

## Specific failure modes worth case-studying

The library currently has incidents for:

- **Invisible-failure-mode** failures — both billing paths "worked," no alarms (see the postmortem on a 12-day silent API-key billing leak where both billing paths returned success while charges accumulated in the wrong place).
- **False-positive-verdict** failures — eval framework certified a model SUITABLE that was inflating by 25 points. See [[incidents/cerebras-false-positive-adoption]].
- **Misdiagnosis** failures — recent-change bias pointed at the wrong root cause (see the postmortem on a 5-day Flask outage misdiagnosed as a v3.0 regression — recent-change bias pointed at the wrong root cause).
- **Smoke-test-gap** failures — published numbers from code that didn't actually run. See [[incidents/variant-b-silently-broken-at-publish]].
- **Stacked-incompatibility** failures — three orthogonal Windows-incompatibility layers, any of which alone would have killed the pipeline (see the postmortem on a Windows-incompatibility stack — three orthogonal incompatibilities, any one of which would have killed the pipeline alone).
- **Delegation** failures — a sub-agent's plausibility inference was wrong in a load-bearing way (see the postmortem on a sub-agent's plausibility inference that confused HTTP 403 'forbidden' with 'endpoint exists' — the inference was load-bearing and wrong).
- **Prompting** failures — adding more prohibitions kept producing different failures (see the postmortem where 3+2 rounds of adding prompt prohibitions produced different failures before the realization that 'add more prohibitions' was the wrong fix).
- **Race-condition** failures — multiple workers selecting the same predicate (see the postmortem on a race condition where multiple workers selected the same predicate, producing 1.74× churn on the first wholesale rescore).
- **Hardware-assumption** failures — a plan's constant turned out to be a hidden assumption about the planner's environment (see the postmortem where a 1000 MB VRAM threshold — a hardcoded constant in a plan — turned out to be a hidden assumption about the planner's environment, not the target environment).

Each one of these is a *class* of failure, not a one-off. The next instance of the class is what the case study earns the right to recognize quickly.

## When to write the case study

- **Right after recovery, while the why-it-was-invisible question is still load-bearing.** Wait too long and the post-recovery narrative gets sanitized into "obviously we should have done X." The fresh confusion is the part worth recording.
- **When the failure surfaced a rule that lives in a project's rules file or its memory store.** The rule is the polished output; the incident is the evidence behind it. The library should hold both — see the anti-pattern of promoting API keys to `os.environ` (a personal rule that was extracted from the incident above) alongside the originating incident narrative.
- **When the failure cost was non-trivial.** Hours of session time, real dollars, public-facing numbers that were partly wrong. The threshold is roughly: "would the user wish they'd known about this before the next session?"

## When NOT to write a case study

- **Single-line bug fixes that surfaced no rule.** Not every fix is an incident. The bar is: did the failure teach something the codebase didn't already know?
- **Bugs that were anticipated and caught early.** A pre-merge review catching a typo isn't an incident. The incident form is for things that got past initial defenses.
- **Failures that have not been resolved.** Open incidents become stale wishlist. Resolve, then write.

## The relationship between incidents, patterns, and anti-patterns

| Form | What it captures |
|------|------------------|
| **Incident** (`wiki/incidents/`) | A specific narrative with date, cost, and recovery |
| **Anti-pattern** (`wiki/anti-patterns/`) | The general rule extracted from one or more incidents |
| **Pattern** (`wiki/patterns/`) | The positive design that prevents the class of failure |

Often a single incident produces all three:

- A 12-day silent API-key billing leak (narrative) → the anti-pattern of promoting API keys to `os.environ` (a personal rule that was extracted from the incident above) → an unrelated project's keychain-only pattern (positive design).
- [[incidents/cerebras-false-positive-adoption]] (narrative) → [[anti-patterns/pearson-r-only-eval]] (rule) → [[patterns/python-derived-classification]] (positive design that contains the blast radius).

Writing all three forces the rule and the positive design to be specific enough to test against future cases.

## The deeper habit

The library shape — immutable evidence + autonomously-editable synthesis — only pays off if **the evidence captured includes the embarrassing parts.** Aborted investigations, dead-end vendor research, prompts that needed five rejection rounds, plans whose hardware assumptions were silently wrong. The polished wiki page reads cleanly precisely because the raw evidence captures the floundering.

If a project's history looks too clean, the failures aren't being captured. The next future-self reading the wiki gets a sanitized story and re-walks the same dead ends.

## Related

- `wiki/anti-patterns/` — generalized rules extracted from incidents
- `wiki/incidents/` — narrative case studies
- `wiki/patterns/` — positive designs that prevent classes of failure
- an adjacent discipline — adversarial plan review applied to plans *before* they fail, rather than incidents *after* they fail
