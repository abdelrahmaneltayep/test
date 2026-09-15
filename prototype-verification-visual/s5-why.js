
  /* ============================================================
     Compare — what each version discloses, when, and who it suits.
     ============================================================ */
  function renderWhy(){
    var V = [
      { k: "A", name: "Steps", how: "An accordion. One section open at a time; the rest collapse to a line and a status pill. <b>Confirm &amp; continue</b> walks down the page.", shows: "The whole task's shape, one section's detail.", best: "Buyers who want the order of things — closest to the live page's structure.", risk: "Three clicks before Place Order even when nothing needs changing." },
      { k: "B", name: "Confirm", how: "Every section is a card whose body is the data itself, read only — labelled facts, a map tile, a thumbnail per document — never a sentence describing it. <b>Change</b> and <b>Manage</b> open the <b>Drawer</b> carrying only that section's fields, with Cancel and Save in its footer. The page itself holds no form at all.", shows: "The actual values, side by side with their status, and one button.", best: "Returning buyers with everything saved: the common case is one read and one click.", risk: "Editing happens in a panel over the page, so a buyer changing several things opens the Drawer several times." },
      { k: "C", name: "Guided", how: "One question per screen in plain words, a step map beside it, one <b>Continue</b>. A review step precedes Place Order; <b>Why do we ask for this?</b> sits behind a disclosure.", shows: "One decision, nothing else.", best: "Senior or infrequent buyers, and phones — the note said these users run businesses and are often senior.", risk: "The longest path; experienced buyers feel walked through." },
      { k: "D", name: "Tabs", how: "The three sections are tabs over a single pane. One pane exists at a time, but all three stay visible, reachable in any order, each carrying its own status pill.", shows: "All three sections and their states, one section's detail.", best: "Buyers who come to change one specific thing — a different delivery address, a renewed licence — without walking a sequence.", risk: "Tabs imply the content is parallel; a buyer may place the order without opening the tab that needed attention." },
      { k: "E", name: "Checklist", how: "The page is a list of what is already done, ticked, with the value on each row. Nothing is a form until a row is expanded. A progress bar states how much is settled, and anything outstanding is the only row styled as work.", shows: "How ready the order is, and the one thing that is not.", best: "Mixed accounts — some documents on file, some not — and anyone who wants reassurance before committing.", risk: "Four rows of green can read as busy when nothing needs doing; B is quieter for that case." }
    ];
    $("#screen-why").innerHTML =
      '<h1 class="hb-headline-md">Five ways to disclose the same page</h1>' +
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
      '<h2 class="hb-title-lg">Five ways for B to preview a section\'s data</h2>' +
      '<p class="hb-body-md">All five are read only and all five hand editing to the same Drawer — what differs is how much of the data is on the page, and how much work it is to read. Version B carries a switcher so the same order can be seen in each.</p>' +
      '<div class="vs">' + PREVIEWS.map(function (p, i) {
        return '<div class="panel"><div class="panel__head"><span class="acc__no hb-label-lg">' + (i + 1) + '</span><h3 class="hb-title-md">' + p.name + '</h3></div>' +
          '<div class="panel__body">' +
            '<div class="hb-label-md muted">How it previews</div><p class="hb-body-md">' + p.how + '</p>' +
            '<div class="hb-label-md muted">Best for</div><p class="hb-body-md">' + p.best + '</p>' +
            '<div class="hb-label-md muted">Trade-off</div><p class="hb-body-md">' + p.risk + '</p>' +
            btn("See B in " + p.name, { style: "outlined", size: "sm", attrs: ' data-act="goto-style" data-preview="' + p.id + '"' }) +
          '</div></div>';
      }).join('') + '</div>' +
      '<p class="hb-body-md"><b>The recommendation for B:</b> <b>Facts</b> on the storefront, because the labels make a wrong value visible without opening anything, with <b>Summary</b> as the compact-width treatment where the whole page should fit above the fold. <b>As used</b> is the one to test with buyers: it is the most human, and the least forgiving of a value in the wrong field. <b>Record</b> belongs in the dashboard, where the buyer already reads this data as a table.</p>' +
      '<h2 class="hb-title-lg">Visual hierarchy, shared by all five</h2>' +
      '<p class="hb-body-md">One headline role per page (headline-md), one title role per section (title-md), labels in on-surface-variant and values in on-surface — colour is reserved for status pills and the single primary Button. Saved values are text, never orange. The only filled button on the screen is the one that moves the buyer forward; Cancel and Change are ghost or outlined. Detail lives one level down: behind a card, an accordion head, or a "Why do we ask for this?" disclosure.</p>' +
      '<h2 class="hb-title-lg">A recommendation</h2>' +
      '<p class="hb-body-md"><b>B</b> for the storefront default — it rewards the returning buyer, who is most orders — with <b>C</b> on compact widths and for an account\'s first order. <b>E</b> is the strongest alternative to B: it answers "am I ready?" without a click, and degrades gracefully when something is missing. <b>D</b> suits a buyer arriving to change one thing, and would pair well inside B\'s <b>Manage</b> Drawer. <b>A</b> is the safe fallback if the page must keep looking like today\'s.</p>';
  }
