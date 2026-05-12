# LLLibrary — operating rules

This repo is a public, cross-linked knowledge base on LLM evaluation and agent
systems. Pages distill lessons from real projects, with provenance and concrete
numbers.

## Invariants

1. **Provenance is mandatory.** Every non-trivial claim cites a source project
   in the page's `provenance:` frontmatter.
2. **Wikilinks use `[[double-bracket]]` syntax** so the repo opens cleanly as
   an Obsidian vault.
3. **No internal jargon.** Pages must read for a cold reader: no references to
   private rules files, internal memory stores, or session infrastructure
   unless the reference is methodologically load-bearing and rewritten in
   neutral terms.

## Frontmatter schema

```yaml
---
title: <human-readable title>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
last-modified: YYYY-MM-DD
tags: [tag1, tag2]
provenance: <source project(s); inline-link the public ones>
---
```

## Layout

- `wiki/anatomy.md` — flat sitemap (every page listed exactly once)
- `wiki/index.md` — themed navigation hub
- `wiki/<category>/` — content pages, one topic per page

## Non-goals

- Not a textbook or comprehensive survey.
- Not a tutorial — pages assume the reader knows what an LLM eval is.
- No commitment to coverage breadth — pages exist where the underlying work
  produced a lesson worth distilling.
- Not synchronized with the (private) source projects; each page snapshots
  lessons at the time of writing.

## License

CC BY 4.0 — see LICENSE. Attribution required for reuse.
