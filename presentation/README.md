# HIGHBASE checkout — heuristic evaluation deck

`HIGHBASE-checkout-evaluation.pptx` — 40 slides for a PM / CEO audience: the
26 findings from the heuristic evaluation, one slide each, with what happens
today, what the prototype changes, and what the problem costs commercially.

## Rebuilding

```
npm install pptxgenjs
node build.js HIGHBASE-checkout-evaluation.pptx
```

`findings.js` holds the 26 findings as data — edit the copy there rather than
in the generator. Severity and heuristic tags must stay in sync with the
`Evaluation` tab of `../highbase-b2b-checkout-proposal.html`.
