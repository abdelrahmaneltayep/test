# Quick Delivery Activation — Tayaar Cross-sell (PDV2-422)

Initial design concept for [PDV2-422](https://salla-dev.atlassian.net/browse/PDV2-422),
with interlock notes for [PDV2-466](https://salla-dev.atlassian.net/browse/PDV2-466).

| File | What it is |
|---|---|
| [`PRD.md`](PRD.md) | Full PRD — problem, hypothesis, metrics, ST1–ST5 with acceptance criteria, edge cases, 7-point analysis, dev hand-off, open questions |
| [`prototype.html`](prototype.html) | Interactive RTL prototype, 19 states. Open in any browser — no build step |
| [`prototype-v1-branchlist.html`](prototype-v1-branchlist.html) | Superseded v1 (assumed a per-branch list before the production screen corrected it) |
| `tests/` | 41 Playwright interaction assertions covering all 19 states |

## Running the tests

```bash
node tests/flow.test.mjs
node tests/edge-cases.test.mjs
```

Requires Playwright. Paths inside the tests are absolute — adjust if the repo moves.

## The design position in one line

Do not sell Tayaar — state the requirement. When a merchant picks `مناديب متجري`,
show the three unmet Quick Delivery requirements and offer Tayaar as the free way to
satisfy them. Needs **zero unvalidated statistics**, so it ships regardless of what
Data and Partnerships conclude about Tayaar's numbers.

**Status:** initial design concept. The Jira ticket has deliberately **not** been transitioned.
