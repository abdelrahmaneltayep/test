
  /* ============================================================
     Compare — what each version discloses, and who it suits.
     ============================================================ */
  function renderWhy(){
    var V = [
      { k: "A", name: "One thing to do",
        how: "The confirmation drops to a single line. The page becomes the amount and the account to send it to on one side, the QR at scanning size on the other, and one primary button: Track your order. Checkout does not ask for the receipt at all — the buyer adds it from inside the order if they want to — so what is left on the page is the transfer and the way back.",
        first: "How much to send, where, and the code to scan.",
        best: "The common case: a buyer who pays from their bank app, or scans the code, and has nothing else to do here.",
        risk: "The order confirmation is quiet, and the page never confirms the transfer itself — the buyer leaves without an acknowledgement beyond the order status." },
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
      '<p class="hb-body-md">The live page confirms the order, prints the bank details, and hides the receipt upload behind <b>Track Your Order</b> — so the buyer is told what happened but not what to do. All three fix the first half the same way: the amount leads and the order status says where the payment stands. They differ on the receipt. <b>A follows the product decision of 17 Sep — checkout does not ask for it</b>, because the buyer can upload it from inside the order; <b>B</b> and <b>C</b> still carry it, and are kept that way so the two readings can be compared.</p>' +
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
        '<li><b>The receipt is not asked for at checkout, in A.</b> The live page sends the buyer to Track Your Order to upload it. A drops the request altogether — the order page already takes it, so the confirmation has one job left. B and C instead accept the file where the buyer already is, which is the other way to answer the same complaint.</li>' +
        '<li><b>The order status says where the payment stands.</b> Awaiting your transfer, Waiting for your receipt, Payment under review — the system\'s status vocabulary, so it reads the same here as on the order itself.</li>' +
        '<li><b>The QR earns its space where the page has room.</b> On the live page it takes half the width whether or not the buyer uses it. A now gives it a column of its own at scanning size, because once the receipt is gone the transfer is all that is left; B holds it behind one line inside step 2; C gives it a tab beside the bank details.</li>' +
        '<li><b>Copy is everywhere it is needed</b> — account name, IBAN, SWIFT, amount, and all of them at once — because every one of those values has to be retyped into a banking app.</li>' +
      '</ul>' +
      '<h2 class="hb-title-lg">Visual hierarchy, shared by all three</h2>' +
      '<p class="hb-body-md">One headline role per page, one title role per panel, labels in on-surface-variant and values in on-surface. Colour is reserved for the status pill, the success banner and the single filled Button; the amount earns its weight from type size, not from colour. Money and reference numbers use the tabular figures the system sets for numerals.</p>' +
      '<h2 class="hb-title-lg">A recommendation</h2>' +
      '<p class="hb-body-md"><b>A</b> for the storefront, and it is now the shortest of the three by a wide margin: one panel, one action, and nothing asked of the buyer that the order page does not already take. <b>B</b> is the one to show a buyer paying Highbase for the first time, and reads best on a phone. <b>C</b> is the strongest for a buyer with two screens, and its Tabs treatment of bank-or-QR is worth keeping whichever version ships.</p>' +
      '<h2 class="hb-title-lg">Tagged (proposal)</h2>' +
      '<ul class="doc-list">' +
        '<li>The QR frame is a placeholder at the real size, in all three — the prototype cannot generate a scannable code and does not fake one. A draws it larger than B and C because it has the room.</li>' +
        '<li>The step timeline, the amount block and the tracker are page compositions; the system has no stepper, no amount block and no tracker.</li>' +
        '<li>The two transitions (the disclosure chevron and the upload progress bar) are placeholders — motion is undefined in the system.</li>' +
      '</ul>';
  }
