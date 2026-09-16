
  /* ============================================================
     Version A · One thing to do
     The confirmation is a line, not a hero. The amount is the page. One primary
     action moves the buyer on, and everything else — QR, what happens next — is
     one level down.
     ============================================================ */
  function renderA(){
    var done = paid();
    $("#screen-a").innerHTML =
      '<div class="pay">' +
        orderLine() +
        (done ?
        /* once the receipt is in, the page still has to show WHICH file was sent — a banner
           alone would leave the buyer with nothing to check or replace */
        paidBanner() +
        '<section class="panel"><div class="panel__body stack">' +
          '<span class="hb-title-sm">Your receipt</span>' + receiptZone() +
          '<hr class="hb-divider" data-orientation="horizontal">' + tracker() +
        '</div></section>' :
        '<section class="panel panel--lead">' +
          '<div class="panel__body stack">' +
            '<h1 class="hb-headline-md">' + (state.transferred ? "Send us the receipt" : "Transfer " + bhd(state.order.total) + " to Highbase") + '</h1>' +
            '<p class="hb-body-md muted">' + (state.transferred
              ? "One file and you are done — a screenshot of the transfer is enough."
              : "Pay from your bank app, then send the receipt so we can match it to this order.") + '</p>' +
            (state.transferred ? "" : amountBlock({ qr: true })) +
            (state.transferred ? "" : bankRows()) +
            '<div class="row">' + (state.transferred ? "" : copyAllBtn()) + '</div>' +
            '<hr class="hb-divider" data-orientation="horizontal">' +
            '<div class="stack" id="a-receipt">' +
              '<span class="hb-title-sm">' + (state.transferred ? "Your receipt" : "Then upload your receipt") + '</span>' +
              receiptZone() +
            '</div>' +
            (state.transferred ? "" :
              btn("I have made the transfer", { size: "lg", block: true, icon: I.check, attrs: ' data-act="mark-transferred"' })) +
          '</div>' +
        '</section>') +
        whatNext() +
        '<div class="row row--end">' + btn("Go to marketplace", { style: "ghost", size: "md", attrs: ' data-act="market"' }) +
          btn("Track your order", { style: "outlined", size: "md", icon: I.pkg, attrs: ' data-act="track"' }) + '</div>' +
      '</div>';
  }

  /* ============================================================
     Version B · Three steps
     A vertical timeline. One step is open at a time and carries everything that
     step needs; the others collapse to a line and a state. Disclosure by step.
     ============================================================ */
  var STEPS = [
    { id: 1, title: "Order placed", short: function () { return state.order.ref + " · " + state.order.placedAt; } },
    { id: 2, title: "Transfer the amount", short: function () { return bhd(state.order.total) + " to Highbase Trading WLL"; } },
    { id: 3, title: "Send us the receipt", short: function () { return paid() ? state.receipt.name : "A screenshot or a PDF"; } },
    { id: 4, title: "Highbase confirms", short: function () { return "Within one working day"; } }
  ];
  function stepState(id){
    if (id === 1) { return "done"; }
    if (id === 2) { return state.transferred || paid() ? "done" : "now"; }
    if (id === 3) { return paid() ? "done" : (state.transferred ? "now" : "next"); }
    return paid() ? "now" : "next";
  }
  function stepBody(id){
    if (id === 1) {
      return '<div class="stack">' +
        '<p class="hb-body-md">' + state.order.lines + ' lines from ' + esc(state.order.supplier) + ', delivery ' + esc(state.order.delivery) + '.</p>' +
        '<div class="row">' + btn("See the order", { style: "outlined", size: "sm", attrs: ' data-act="track"' }) + '</div></div>';
    }
    if (id === 2) {
      return '<div class="stack">' + amountBlock() + bankRows() +
        '<div class="row">' + copyAllBtn() +
          btn(state.qrOpen ? "Hide the QR code" : "Pay by QR instead", { style: "ghost", size: "md", icon: I.chevronDown, attrs: ' data-act="toggle-qr"' }) +
        '</div>' +
        (state.qrOpen ? qrBlock() : "") +
        '<div class="row">' + btn("I have made the transfer", { size: "lg", icon: I.check, attrs: ' data-act="mark-transferred"' }) + '</div></div>';
    }
    if (id === 3) {
      return '<div class="stack">' +
        '<p class="hb-body-md">A screenshot of the transfer is enough. We match it against the reference <span class="num">' + esc(state.order.ref) + '</span>.</p>' +
        receiptZone() + '</div>';
    }
    return '<div class="stack"><p class="hb-body-md">We check the transfer against this order and move it to Approved. You will get a message here — nothing else is needed from you.</p>' + whatNext() + '</div>';
  }
  function renderB(){
    var open = paid() ? 4 : (state.transferred ? 3 : 2);
    if (state.step && stepState(state.step) !== "next") { open = state.step; }
    $("#screen-b").innerHTML =
      '<div class="pay">' +
        orderLine() +
        (paid() ? paidBanner() : '') +
        '<h1 class="hb-headline-md">' + (paid() ? "Payment under review" : "Two steps left") + '</h1>' +
        '<ol class="steps">' + STEPS.map(function (s) {
          var st = stepState(s.id), isOpen = s.id === open;
          return '<li class="step" data-state="' + st + '"' + (isOpen ? ' data-open' : '') + ' id="step-' + s.id + '">' +
            '<button type="button" class="step__head" data-act="open-step" data-step="' + s.id + '" aria-expanded="' + isOpen + '">' +
              '<span class="step__no">' + (st === "done" ? I.check : s.id) + '</span>' +
              '<span class="step__lines"><span class="hb-title-sm">' + s.title + '</span>' +
                '<span class="hb-body-sm muted">' + esc(s.short()) + '</span></span>' +
              (st === "now" ? statusChip("pending", "Now") : st === "done" ? statusChip("active", "Done") : '') +
            '</button>' +
            (isOpen ? '<div class="step__body">' + stepBody(s.id) + '</div>' : '') +
          '</li>';
        }).join('') + '</ol>' +
        '<div class="row row--end">' + btn("Go to marketplace", { style: "ghost", size: "md", attrs: ' data-act="market"' }) +
          btn("Track your order", { style: "outlined", size: "md", icon: I.pkg, attrs: ' data-act="track"' }) + '</div>' +
      '</div>';
  }

  /* ============================================================
     Version C · Pay and prove
     Both halves of the job are on screen at once: pay on the left, prove on the
     right, with the tracker underneath. Disclosure is used only for the secondary
     route (QR) and for what happens next.
     ============================================================ */
  function renderC(){
    $("#screen-c").innerHTML =
      '<div class="pay pay--wide">' +
        orderLine() +
        (paid() ? paidBanner() : '') +
        '<div class="two">' +
          '<section class="panel">' +
            '<div class="panel__head"><span class="hb-title-md">1 · Pay</span>' + statusChip(state.transferred || paid() ? "active" : "pending", state.transferred || paid() ? "Marked as sent" : "Not yet") + '</div>' +
            '<div class="panel__body stack">' +
              amountBlock() +
              '<div class="hb-tabs" role="tablist" aria-label="How to pay">' +
                '<button type="button" class="hb-tab" role="tab" aria-selected="' + (state.payTab === "bank") + '" data-act="pay-tab" data-tab="bank">Bank transfer</button>' +
                '<button type="button" class="hb-tab" role="tab" aria-selected="' + (state.payTab === "qr") + '" data-act="pay-tab" data-tab="qr">QR code</button>' +
              '</div>' +
              (state.payTab === "bank"
                ? bankRows() + '<div class="row">' + copyAllBtn() + '</div>'
                : qrBlock()) +
              (paid() ? "" : btn(state.transferred ? "Transfer marked as sent" : "I have made the transfer",
                { size: "lg", block: true, icon: I.check, disabled: state.transferred, attrs: ' data-act="mark-transferred"' })) +
            '</div>' +
          '</section>' +
          '<section class="panel">' +
            '<div class="panel__head"><span class="hb-title-md">2 · Prove</span>' + statusChip(paid() ? "active" : "pending", paid() ? "Received" : "Waiting") + '</div>' +
            '<div class="panel__body stack">' +
              '<p class="hb-body-md muted">A screenshot of the transfer is enough. We match it against the reference on the left.</p>' +
              receiptZone() +
              whatNext() +
            '</div>' +
          '</section>' +
        '</div>' +
        '<section class="panel"><div class="panel__body">' + tracker() + '</div></section>' +
        '<div class="row row--end">' + btn("Go to marketplace", { style: "ghost", size: "md", attrs: ' data-act="market"' }) +
          btn("Track your order", { style: "outlined", size: "md", icon: I.pkg, attrs: ' data-act="track"' }) + '</div>' +
      '</div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(state.order.total) + '</span>' +
        btn(paid() ? "Receipt sent" : "Upload receipt", { size: "lg", icon: I.upload, disabled: paid(), attrs: ' data-act="pick-receipt"' }) + '</div>';
  }
