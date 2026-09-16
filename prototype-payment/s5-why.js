
  /* ============================================================
     Compare — what each version discloses, and who it suits.
     ============================================================ */
  function renderWhy(){
    var V = [
      { k: "A", name: "One thing to do",
        how: "The confirmation drops to a single line. The page becomes the amount, the account to send it to, and one primary button. What-happens-next sits behind a disclosure, the QR rides in the amount block as a tile the buyer can read at arm's length and enlarge in one click, and the upload zone is the last thing on the card.",
        first: "How much to send, and where.",
        best: "The common case: a buyer who pays from their bank app and comes back with a screenshot.",
        risk: "The order confirmation is quiet. A buyer who wanted reassurance that the order exists has to read the line." },
      { k: "B", name: "Three steps",
        how: "A timeline of four steps, one open at a time. Step 2 carries the amount and the account, step 3 the upload; a step collapses to its title and state once it is done.",
        first: "Where they are in a four-step job.",
        best: "First-time buyers, and anyone who lost the thread on the live page — the shape of the task is visible before the detail.",
        risk: "Two clicks to see everything, and the timeline is taller than the work it describes." },
      { k: "C", name: "Pay and prove",
        how: "Two panels side by side: pay on the left with a Tabs molecule for bank or QR, prove on the right with the upload zone live from the first second. The tracker sits underneath and a commit bar follows on narrow widths.",
        first: "Both halves of the job at once.",
        best: "Buyers who pay on a second screen and want the upload ready without hunting for it.",
        risk: "The busiest of the three; nothing is held back, so the page has to carry two primary actions." }
    ];
    $("#screen-why").innerHTML =
      '<h1 class="hb-headline-md">Three ways to finish a Highbase payment</h1>' +
      '<p class="hb-body-md">The live page confirms the order, prints the bank details, and hides the receipt upload behind <b>Track Your Order</b> — so the buyer is told what happened but not what to do. All three versions keep the same data and fix that: the amount leads, the receipt upload is reachable from the page itself, and the order status says where the payment stands.</p>' +
      '<div class="vs">' + V.map(function (v) {
        return '<div class="panel"><div class="panel__head"><span class="step__no">' + v.k + '</span><h2 class="hb-title-md">' + v.name + '</h2></div>' +
          '<div class="panel__body">' +
            '<div class="hb-label-md muted">How it discloses</div><p class="hb-body-md">' + v.how + '</p>' +
            '<div class="hb-label-md muted">What the buyer sees first</div><p class="hb-body-md">' + v.first + '</p>' +
            '<div class="hb-label-md muted">Best for</div><p class="hb-body-md">' + v.best + '</p>' +
            '<div class="hb-label-md muted">Trade-off</div><p class="hb-body-md">' + v.risk + '</p>' +
            btn("Open version " + v.k, { style: "outlined", size: "sm", attrs: ' data-act="goto" data-screen="' + v.k.toLowerCase() + '"' }) +
          '</div></div>';
      }).join('') + '</div>' +
      '<h2 class="hb-title-lg">What changed from the live page</h2>' +
      '<ul class="doc-list">' +
        '<li><b>The amount is the largest thing on the page.</b> On the live page the total appears twice in body type, once in a pill and once in a card; the buyer\'s eye has nothing to land on. Here it is the largest type role the page uses, with its own copy button.</li>' +
        '<li><b>The receipt upload is on the page.</b> The live page sends the buyer to Track Your Order to upload it — a second destination for the one thing that finishes the job. Every version accepts the file where the buyer already is.</li>' +
        '<li><b>The order status says where the payment stands.</b> Awaiting your transfer, Waiting for your receipt, Payment under review — the system\'s status vocabulary, so it reads the same here as on the order itself.</li>' +
        '<li><b>The QR is a choice, not a column.</b> It takes half the live page whether or not the buyer uses it. A keeps it visible but small — a tile in the amount block, full size in the Drawer on click; B holds it behind one line; C gives it a tab beside the bank details.</li>' +
        '<li><b>Copy is everywhere it is needed</b> — account name, IBAN, SWIFT, amount, and all of them at once — because every one of those values has to be retyped into a banking app.</li>' +
      '</ul>' +
      '<h2 class="hb-title-lg">Visual hierarchy, shared by all three</h2>' +
      '<p class="hb-body-md">One headline role per page, one title role per panel, labels in on-surface-variant and values in on-surface. Colour is reserved for the status pill, the success banner and the single filled Button; the amount earns its weight from type size, not from colour. Money and reference numbers use the tabular figures the system sets for numerals.</p>' +
      '<h2 class="hb-title-lg">A recommendation</h2>' +
      '<p class="hb-body-md"><b>A</b> for the storefront: it is the shortest path for the buyer who already knows how to make a transfer, and it still answers the order question in its first line. <b>B</b> is the one to show a buyer paying Highbase for the first time, and reads best on a phone. <b>C</b> is the strongest for a buyer with two screens, and its Tabs treatment of bank-or-QR is worth keeping whichever version ships.</p>' +
      '<h2 class="hb-title-lg">Tagged (proposal)</h2>' +
      '<ul class="doc-list">' +
        '<li>The QR frame is a placeholder at the real size, and so is the tile in version A’s amount block — the prototype cannot generate a scannable code and does not fake one.</li>' +
        '<li>The step timeline, the amount block and the tracker are page compositions; the system has no stepper, no amount block and no tracker.</li>' +
        '<li>The two transitions (the disclosure chevron and the upload progress bar) are placeholders — motion is undefined in the system.</li>' +
      '</ul>';
  }
