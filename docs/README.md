# Documentation

Reference material for work done on this account that does not live in this repository's source
tree. Right now that is one thing: the Highbase Design System push into Figma, and the review fixes that followed it.

---

## The Figma push

The Highbase Design System — a B2B marketplace and dashboard system for web, tablet and mobile,
English and Arabic — was built into the Figma file **`DS`**
(`OzGwihdXeu7ALbuwv3kfeC`, 62 pages) from a repository of specs, tokens and CSS.

| File | What it is |
|---|---|
| [`FIGMA_PUSH_REPORT.md`](FIGMA_PUSH_REPORT.md) | The audit. Read this before trusting the result. |
| [`FIGMA_FIXES_REPORT.md`](FIGMA_FIXES_REPORT.md) | The fourteen review fixes: what changed, what was measured, and the seven questions still open. |
| [`FIGMA_PUSH_STATE.md`](FIGMA_PUSH_STATE.md) | Append-only log, one entry per batch. |

### Read the report first, and read it in this order

It is deliberately not a success summary. Its most useful sections are the ones listing what
went wrong or undecided:

1. **What is in the file** — counts, and what carries documentation
2. **Could not be done** — blocked work, with the reason for each
3. **Decisions taken without you** — every judgement call made in the user's absence
4. **Contradictions to resolve** — places where the spec disagrees with itself or with the code
5. **Values with no variable behind them** — literals that had no token to bind to
6. **Defects found and fixed in the work itself** — bugs introduced and then caught
7. **Removed at your request**

Sections 3 and 4 are the ones that need a human decision. Nothing in them is settled.

### What is in the file

- **10 atoms**, **27 molecules** across 24 pages, **16 organism components** across 8 pages
- **35 component pages** carry the same 14-section documentation — anatomy diagram with numbered
  callouts, specs, behaviour, usage, accessibility, RTL, code, related, open questions
- **Zero unbound paints** anywhere — every colour in the file resolves to a variable

### Three caveats that matter

**The sources are not in this repository.** The design system itself — tokens, component CSS,
READMEs — was supplied as an archive and is not committed here. These two documents are the only
surviving record of the push. If you need the sources, they came from `highbase-ds`.

**Almost nothing has been looked at.** `www.figma.com` is blocked by the build environment's
network policy, so screenshots were impossible and every page was verified *structurally* —
layer trees, bound variables, counts — not visually. The single exception is the Logo, which was
checked as rendered pixels via `exportAsync` (which runs inside Figma and needs no network).
That technique would work for any other page if someone wants the rest verified.

**Arabic is not real.** Noto Kufi Arabic is not installed in the build environment, so the 13 AR
text styles do not exist and no Arabic text anywhere in the file is set in the right face. The
system's rule is that a missing font is reported, never substituted — so it was reported. Install
the font and the styles can be generated from the Arabic line-height primitives already present.

### The log

`FIGMA_PUSH_STATE.md` is append-only, one entry per batch of work, written so the push could be
resumed after an interruption. It is also where corrections live: where a later batch found an
earlier claim to be wrong, the entry says so plainly rather than quietly fixing it. Read it
newest-last if you want the narrative, or search it for a component name to find when and how
that component was built.
