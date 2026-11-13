# Domain Docs

How engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- `GLOSSARY.md` at the repo root
- ADRs in `docs/adr/` that touch the area being changed

If a referenced file is absent, continue without flagging it or suggesting its creation.

## Layout

This is a single-context repository:

```text
/
├── GLOSSARY.md
└── docs/adr/
```

Use the existing files as their authoritative locations. Do not rename or replace them during unrelated work.

## Use the glossary's vocabulary

When naming a domain concept in an issue, test, refactor proposal, or hypothesis, use the term defined in `GLOSSARY.md`. Do not drift to vocabulary the glossary explicitly avoids.

If the needed concept is absent, either reconsider the wording or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly:

> _Contradicts ADR-0026 (TypeScript full-stack and Aliyun deployment), but worth reopening because…_
