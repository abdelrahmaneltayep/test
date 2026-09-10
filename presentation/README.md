# HIGHBASE checkout — heuristic evaluation deck

Same 40 slides in two formats, both generated from `findings.js`:

- `HIGHBASE-checkout-evaluation.pptx` — PowerPoint, for presenting and editing.
- `highbase-checkout-findings.html` — web deck, for sharing as a link.
  Arrow keys or the on-screen controls to navigate, `O` for the slide grid,
  `#12` in the URL to deep-link a slide, and it prints one slide per page.
  Stacks and reflows on a phone.

Content: the 26 findings from the heuristic evaluation, one slide each, with
what happens today, what the prototype changes, and what the problem costs
commercially.

## Rebuilding

```
npm install pptxgenjs
node build.js HIGHBASE-checkout-evaluation.pptx
```

`findings.js` holds the 26 findings as data — edit the copy there rather than
in the generator. Severity and heuristic tags must stay in sync with the
`Evaluation` tab of `../highbase-b2b-checkout-proposal.html`.
