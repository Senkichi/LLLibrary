---
title: Federated review engines with unified findings schema
created: 2026-05-11
last-reviewed: 2026-05-11
last-modified: 2026-05-12
tags: [agent-architecture, code-review, schema]
provenance: "[[projects/nit-pick-supreme]]"
---

# Federated review engines with unified findings schema

When you need multi-perspective analysis of a codebase (or any artifact), dispatch independent **engines** that emit findings in a common schema, then synthesize in the orchestrator. Don't chain engines.

## The shape (from [[projects/nit-pick-supreme]])

```
Orchestrator (SKILL.md)
  ├── Code engines       (Haiku)  : code-frontend, code-backend, code-safety
  ├── Architecture engines (Opus) : arch-flow, arch-design, arch-api, arch-complexity, arch-robustness, arch-language
  ├── Explorer engine    (Sonnet) : ai-explorer (browser, Playwright MCP)
  └── Shell engines      (no LLM) : static_sweep.py, browser_e2e.py
```

12+ engines, all dispatched **in parallel**, each emitting JSON in a unified envelope:

```json
{
  "status": "success | error | timeout",
  "findings": [
    {
      "id": "...",
      "engine": "...",
      "category": "...",
      "severity": "...",
      "confidence": "...",
      "title": "...",
      "description": "...",
      "files": ["..."],
      "suggestion": "...",
      "fix_hint": "...",
      "related_to": [...],
      "requires_decision": false
    }
  ],
  "error_message": null
}
```

## Why this shape wins

- **Synthesize in the orchestrator, not by chaining agents.** Each engine sees only its scope. The orchestrator dedups, ranks, and decides. Engines stay small and testable.
- **Different scopes, not different names.** Code engines look for code smells; arch engines look for system-level concerns. Splitting "code-backend" and "code-safety" by responsibility (mechanics vs security) means findings land in different categories, naturally.
- **Cost is a design constraint, not an afterthought.** Haiku is fine for mechanical code review; Opus is overkill there but right for architectural analysis. The model assignment per engine bakes cost discipline into the topology.
- **Errors don't abort the pipeline.** Status envelope means any engine can fail and the orchestrator still produces output. Failures land in the report's Engine Breakdown section.

## Category registry is canonical

The orchestrator validates every finding's `category` against a canonical list before synthesis. Engines that emit unknown categories have their findings dropped. This is the load-bearing constraint that makes dedup possible — two engines reporting the same defect under different category names would fail to dedup otherwise.

## Parallel fix execution via worktrees

After synthesis, the fix-planner clusters findings by **file transitive closure**: findings touching the same files belong to the same group. Groups in the same wave have zero file overlap; groups across waves have strict ordering (Group A depends on B → B executes first).

Each group runs in **its own git worktree, its own agent process**. No serial waiting on tests. If a group's fixes cause a regression, the orchestrator reverts in reverse merge order until failures disappear — last-reverted group is the cause.

This replaces the predecessor's `--allow-failing-tests` flag with automatic behavior: Stage 1 records test state *before* fixes, Stage 5 compares against baseline. Pre-existing failures are ignored; new failures trigger isolation.

## Tech-stack-keyed pattern memory

A per-fix-engine memory store keys fix success patterns by `category + tech stack signature` (e.g., `thread-safety/flask-sqlite`). The fix engine validates tech-stack match before applying a recalled pattern. Raw logs append per session; consolidated every 10th session.

Memory is keyed structurally, not narratively. A "flask-sqlite/thread-safety" fix pattern doesn't apply when running against an asyncpg/asyncio service.

## Artifact discipline

All artifacts under `.nit-supreme/` in the target project (gitignored, cleanup-friendly):

| Artifact | Role |
|----------|------|
| `context.json` | single source of truth — immutable after Stage 1 |
| `findings.json` | dedup + synthesis output |
| `fix-plan.json` | grouping + waves |
| `fix-results.json` | per-group outcomes (PASS/FAIL/PARTIAL) |
| `engine-output/{name}.json` | raw per-engine output, untouched |
| `checkpoint.json` | pipeline resume state, persisted after each stage |
| `explorer-history.json` | AI explorer budget telemetry across runs |

Resume-by-artifact-presence — built on an atomic-write pattern (write to `.tmp`, rename on success) so engine outputs are crash-safe and partial-write artifacts are never mis-classified as complete — makes the pipeline crash-safe.

## When NOT to use this pattern

- Single-perspective analysis (just code, no architecture). Federation overhead isn't worth it.
- Real-time analysis (must complete in <2s). Engine dispatch + synthesis takes 30-300s.
- Strict-confidentiality scopes that can't share findings across engines (rare in code review).

## Related

- an isolation pattern where each engine runs with `setting_sources=[]` so credentials, config, and prior context can't leak between engines
- the atomic-write pattern referenced above keeps engine outputs crash-safe
- the anti-pattern of promoting API keys to `os.environ` — subprocesses inherit env vars by default, so engines must not share credentials this way
