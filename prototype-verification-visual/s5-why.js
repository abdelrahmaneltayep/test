
  /* ============================================================
     Compare — what each version discloses, when, and who it suits.
     ============================================================ */
  function renderWhy(){
    var V = [
      { k: "A", name: "Steps", how: "An accordion. One section open at a time; the others collapse to a single line with a status pill. Confirm & continue moves the focus down the page.", shows: "The whole page's shape at a glance, but only one section's detail.", best: "Buyers who want to see the whole task and work through it in order — the closest to the live page's structure.", risk: "Three clicks before Place Order even when nothing needs changing." },
      { k: "B", name: "Confirm", how: "Everything already on file is a compact card with one line and a Change / Manage button. Forms and upload zones exist only behind that button. The page opens on a readiness banner and one primary action.", shows: "Only what the buyer needs to decide — is this right? — with detail on demand.", best: "Returning buyers with a saved branch, address and documents: the common case becomes one look and one button.", risk: "A first-time buyer with nothing on file has to open every card; the banner tells them which." },
      { k: "C", name: "Guided", how: "One question per screen, in plain words, with a map of the steps beside it and a single Continue. A final step reviews everything before Place Order. \"Why do we ask for this?\" sits behind a disclosure.", shows: "One decision at a time, nothing else on screen.", best: "Senior or infrequent buyers, and anyone on a phone — the note said these users run businesses and are often senior.", risk: "The longest path; experienced buyers will feel walked through something they know." }
    ];
    $("#screen-why").innerHTML =
      '<h1 class="hb-headline-md">Three ways to disclose the same page</h1>' +
      '<p class="hb-body-md">Same sections, same values, same edit and upload behaviour. What differs is what the buyer sees first, and what has to be asked for. Progressive disclosure: show the decision, hold back the detail until it is needed, and never make the detail hard to reach.</p>' +
      '<div class="vs">' + V.map(function (v) {
        return '<div class="panel"><div class="panel__head"><span class="acc__no hb-label-lg" style="background:var(--hb-color-primary-700);color:var(--hb-color-on-primary)">' + v.k + '</span><h2 class="hb-title-md">' + v.name + '</h2></div>' +
          '<div class="panel__body">' +
            '<div class="hb-label-md muted">How it discloses</div><p class="hb-body-md">' + v.how + '</p>' +
            '<div class="hb-label-md muted">What the buyer sees first</div><p class="hb-body-md">' + v.shows + '</p>' +
            '<div class="hb-label-md muted">Best for</div><p class="hb-body-md">' + v.best + '</p>' +
            '<div class="hb-label-md muted">Trade-off</div><p class="hb-body-md">' + v.risk + '</p>' +
            btn("Open version " + v.k, { style: "outlined", size: "sm", attrs: ' data-act="goto" data-screen="' + v.k.toLowerCase() + '"' }) +
          '</div></div>';
      }).join('') + '</div>' +
      '<h2 class="hb-title-lg">Visual hierarchy, shared by all three</h2>' +
      '<p class="hb-body-md">One headline role per page (headline-md), one title role per section (title-md), labels in on-surface-variant and values in on-surface — colour is reserved for status pills and the single primary Button. Saved values are text, never orange. The only filled button on the screen is the one that moves the buyer forward; Cancel and Change are ghost or outlined. Detail lives one level down: behind a card, an accordion head, or a "Why do we ask for this?" disclosure.</p>' +
      '<h2 class="hb-title-lg">A recommendation</h2>' +
      '<p class="hb-body-md">B for the storefront default — it rewards the returning buyer, who is most orders — with C offered on compact widths and to accounts placing their first order. A is the safe fallback if the team wants the page to keep looking like today\'s.</p>';
  }
