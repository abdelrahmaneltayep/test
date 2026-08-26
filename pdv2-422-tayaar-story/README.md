# PDV2-422 · رحلة التاجر مع طيّار — the merchant journey as a story

The Tayaar cross-sell told as the merchant's story, applied across all four design
options. Built for walking Idris and Belal through the feature in one sitting.

```bash
npm install && npm run dev
npm run build && npm run preview
npm run test:smoke              # needs preview on :4176
```

## The arc

The protagonist is a merchant who **already delivers fast** with their own riders — the
problem is that nobody can see it. The spine of the story is one thing: **whether the
two-hour promise reaches the customer at checkout.** A persistent thread under the
narration shows that state in every scene. Watch it change and you have watched the
whole feature.

| Act | Premise | Scenes |
|---|---|---|
| **1 · الفجوة** | The merchant delivers fast; Salla can't see it | today · consequence · the missing piece appears |
| **2 · التحوّل** | Tooling makes it visible, so the promise becomes showable | one-click activation · first courier on the map · barcode stops the wrong order · first tracked delivery |
| **3 · ما على المحك** | The promise is part of their store now — what if it stops? | the first week · trial ending · converting |

Promise state through the arc: **off → activating → on → at risk → on.**
The suite asserts it actually turns.

## Alternate paths

Four branches hang off the main arc, reachable from the scene they belong to and each
with a way back:

| From | Branch | Why it's in the story |
|---|---|---|
| the offer | باقة غير مؤهلة | The Pro/Special gate is an upgrade path, not a dead end |
| activation | تعثّر التفعيل | Nothing changes — no half-activated state |
| trial ending | لم تستمر | The promise is withheld, the branch is kept |
| consequence | شركة شحن خارجية | No strip at all — that provider flow is unchanged |

## Applied to the four options

Every scene renders its strip in whichever option is selected, and **▦ الأربعة معاً**
shows one scene in all four at once. 40 option × scene combinations, all verified.

| | Fill | Icon | Headline |
|---|---|---|---|
| **A** | Mint | ✓ | إدارة المناديب باحترافية… |
| **B** | Mint | ✗ | طيّار جاهز لإدارة مناديبك |
| **C** | White + border | ✓ | إدارة المناديب باحترافية… |
| **D** | Flush + hairline | ✓ | إدارة المناديب باحترافية… |

## Playback

**▶ تشغيل** auto-advances every 5.2 s for presenting. Arrow keys work
(RTL: **←** forward, **→** back). The chapter rail is clickable and shows each scene's
promise state as a coloured dot, so the arc is legible before you play it.

## Storytelling rules this follows

- **The merchant is the protagonist, not the app.** Every scene title is their moment;
  every narration is their side of the screen.
- **No statistics.** The brief's closing Note makes every Tayaar figure a launch
  blocker. Scene 6 says *the wrong order didn't leave the branch* — a beat, not a number.
  The suite asserts no percentage appears anywhere.
- **Each scene states what changed.** A `→` delta line, so the story has motion rather
  than being a gallery of states.
- **Every scene names its source** in the header — the brief line it dramatises. The
  story is a reading of the document, not a decoration on top of it.
- **The unresolved stays unresolved.** The lapsed branch flags open question 3 as a PM
  decision instead of quietly answering it.

## Known deviations

- Tayaar icon is a placeholder mark, pending Partnerships.
- Five contrast corrections carried from the earlier builds (see `src/styles/tokens.css`
  and the danger-button note in the strip prototype's README).
- Numerals are Arabic-Indic per the PRD; production uses Western. `src/lib/num.ts`.
- No real activation — buttons show a toast saying so.
- Scene 8's "ساعة وسبع دقائق" is illustrative narrative detail, not a measured claim.

## Verification

27 assertions: the promise thread actually turns across the arc, every scene has a
moment/narration/source, every scene from 2 on states a delta, no statistics anywhere,
all four branches behave and return, all 40 option × scene combinations render,
navigation works by button and keyboard, autoplay toggles, and **zero axe WCAG 2.1
A/AA violations**.
