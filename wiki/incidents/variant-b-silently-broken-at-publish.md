---
title: Incident — Variant B was not executable on Windows when 001 baseline was published
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [incident, smoke-tests, langgraph-agents]
provenance: [langgraph-agents](https://github.com/Senkichi/langgraph-agents)
---

# Incident — Variant B was not executable on Windows when 001 baseline was published

## What happened

[langgraph-agents](https://github.com/Senkichi/langgraph-agents) published the 001 baseline eval (2026-04-18, 10 configs × 5 tasks = 50 runs) with a victorious finding: **Variant B beats Variant A by 15 points on complex tasks; B-homo-opus 93.5% win rate.**

When Experiment 002 launched (2026-04-23) and tried to actually use Variant B again on Windows, it crashed before the first debate turn finished. Two pre-existing blockers were discovered:

1. **`ClaudeSDKClient.query()` was being iterated as an async iterator.** SDK 0.1.62 requires `await client.query(msg)` followed by `async for msg in client.receive_response()`. The prior pattern crashed with `TypeError: 'async for' requires an object with __aiter__ method, got coroutine`.

2. **Windows `CreateProcess` 32 KB command-line limit.** `init_debate` was embedding both v2 drafts (typically 5-10 KB each) into the debater's *system prompt*, which the Claude Code CLI passes to `CreateProcess` as a `--system-prompt` argument. On long tasks this exceeded the limit and failed with `WinError 206`.

Variant B had been crashing **on the first turn** of every long task in 001 baseline. Half of the matrix's most informative runs had silently failed and produced no usable Variant B output.

## How the 001 baseline still published a winning Variant B number

This is the load-bearing question. The 001 report says Variant B beat Variant A by 15 points. If Variant B was crashing, where did the wins come from?

- The matrix included **2 short sanity tasks** (`sanity_prompt_caching`, `sanity_semver`) where the system-prompt budget was small enough that the 32 KB limit didn't trigger.
- For the 3 long tasks, the 001 run had been executed *before* the SDK upgrade to 0.1.62 — earlier SDK versions had a different iterator surface that the buggy code happened to satisfy.
- The "Variant B wins" numbers were partly real (on sanity tasks where it ran) and partly an artifact of comparing surviving runs to A's complete-run distribution.

The 001 report acknowledged that 17/25 Variant B runs hit `max_rounds` rather than `mutual_agreement` — without distinguishing the runs that hit `max_rounds` for substantive reasons from the runs that had crashed mid-debate and been mis-classified.

## The fix and what surfaced from it

Two commits resolved the immediate bugs (commit `fe036d8`):

1. `AgentSession._send` rewritten to `await client.query(msg)` + `async for msg in client.receive_response()`.
2. Long content split: `DEBATE_SYSTEM_PROMPT` (short: role + rules + format) + `DEBATE_OPENING_USER_MESSAGE` (long: task + proposals + opening directive). The opening user message routes through the uncapped API payload path. Regression test caps the system prompt at 4 KB after formatting.

A Variant B end-to-end smoke test (`run_variant_b_smoke.py`) was added that runs the architecture-review task with Opus 4.7, 1-round debate cap, and asserts a non-empty final plan with a clean termination reason. **This is the smoke test that should have existed before 001 baseline was published.**

## The rule extracted from this incident

> **IT DOESN'T MATTER IF THE ERROR/FAILURE IS PREEXISTING. IT NEEDS TO BE FIXED THE MOMENT ITS FOUND.**

Added as a Staff FAANG principle after the orchestrator proposed deferring the Variant B SDK bug as "not in scope" for the 002 launch. Deferring it had been the exact mistake that produced the 001 silent failure — half the matrix had been blocked by a bug that was visible if anyone ran the long task once.

## Lessons

- **Eval results without an end-to-end smoke test on the same code path are not safe to publish.** The published numbers will be a mix of legitimate signal and artifacts from runs that failed in unexpected ways.
- **`max_rounds` termination is ambiguous.** It can mean "debate ran out of rounds substantively" or "the debate crashed and got reported as terminated normally." The two need to be distinguished by inspecting the actual conversation transcript, not just the termination flag.
- **Cross-platform bugs hide in cross-platform absence.** The Windows `CreateProcess` 32 KB limit doesn't trigger on Linux/macOS. Running the test matrix on a single OS guarantees this class of bug stays invisible until production.
- **SDK upgrades change iterator protocols silently.** Pin the SDK version in `pyproject.toml` (`claude-agent-sdk>=0.1.71,<0.2`) for any code where the iterator protocol is load-bearing.
- **Deferring "preexisting" bugs is the same mistake as not having smoke tests in the first place.** The bug exists; finding it is a gift; fixing it costs ~30 minutes. Deferring it costs hours of mis-attributed analysis next time it bites.

## What we'd have done differently

- Run `run_variant_b_smoke.py` (or its equivalent) before publishing 001.
- Inspect the actual debate transcript for at least one `max_rounds` run on each long task before reporting the termination distribution.
- Separate "run completed cleanly" from "run produced a final plan" as eval-output preconditions.

## Related

- an atomic-write pattern that prevents partial-write artifacts from being mis-classified as complete
- an environment-provenance frontmatter convention that made later forensic analysis possible
- a personal practice rule: fix pre-existing errors on sight
- [[workflows/failure-mining]]
