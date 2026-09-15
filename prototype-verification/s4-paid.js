
  /* ============================================================
     Screen 2 — Order placed, awaiting the transfer (Highbase Payment).
     ============================================================ */
  var BANK = [
    ["Bank", "Al Salam Bank, Bahrain"],
    ["Account name", "HIGHBASE TRADING W.L.L"],
    ["IBAN", "BH29ALSA00165212100101"],
    ["SWIFT / BIC", "ALSABHBM"]
  ];

  function qrSvg(){
    /* A deterministic mock QR — enough cells to read as one; the real code is the bank's. */
    var n = 21, cells = [], seed = 7;
    for (var y = 0; y < n; y++) { for (var x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
      var on = finder ? ((x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) && !((x === 6 || y === 6) && (x > 6 || y > 6)) ) : ((seed >> 7) & 1);
      if (finder) { var fx = x % (n - 7) < 7 ? x % (n - 7) : x, fy = y % (n - 7) < 7 ? y % (n - 7) : y; on = (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5)); }
      if (on) { cells.push('<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'); }
    } }
    return '<svg class="qr__code" viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="Benefit Pay QR code for this transfer" shape-rendering="crispEdges" fill="currentColor">' + cells.join('') + '</svg>';
  }

  function progress(){
    var o = state.order, r = state.receipt;
    var steps = [
      ["Order placed", fmtDate(o.placedAt), "done"],
      [r && r.submitted ? "Receipt received" : "Awaiting your transfer", r && r.submitted ? "Under review · usually within 2 working hours" : "Reserved until " + fmtDate(o.deadline), r && r.submitted ? "done" : "now"],
      ["Payment confirmed", r && r.submitted ? "Next" : "After the receipt is checked", r && r.submitted ? "now" : ""],
      ["Dispatched", "Al Manar Trading · " + state.slot.day, ""],
      ["Delivered", state.address.city + " · " + state.branchDetails.name, ""]
    ];
    return '<ol class="progress" aria-label="Order progress">' + steps.map(function (s) {
      return '<li' + (s[2] ? ' data-state="' + s[2] + '"' : '') + '><span class="progress__bar" aria-hidden="true"></span><h4 class="hb-label-lg">' + s[0] + '</h4><p class="hb-body-sm">' + esc(s[1]) + '</p></li>';
    }).join('') + '</ol>';
  }

  function payCard(){
    var o = state.order, t = totals();
    var ref = o.ref + (state.po ? " / " + state.po : "");
    return '<section class="panel">' +
      '<div class="pay-head">' + I.wallet + '<div style="flex:1;min-width:0"><div class="hb-title-md">Pay ' + bhd(t.total) + ' by bank transfer' + pin(12) + '</div>' +
        '<div class="hb-body-sm">Transfer within 48 hours — stock is reserved until ' + esc(fmtDate(o.deadline)) + '.</div></div>' +
        statusChip("pending", "Awaiting transfer") + '</div>' +
      '<div class="panel__body stack">' +
        '<div class="facts">' +
          '<div class="hb-stat" data-variant="metric"><div class="hb-stat__body"><span class="hb-stat__label">AMOUNT TO PAY</span><span class="hb-stat__value num">' + bhd(t.total) + '</span><span class="hb-stat__hint">Exactly this amount, in BHD</span></div>' + iconBtn(I.copy, "Copy amount", { attrs: ' data-copy="' + t.total.toFixed(3) + '"' }) + '</div>' +
          '<div class="hb-stat" data-variant="metric"><div class="hb-stat__body"><span class="hb-stat__label">PAYMENT REFERENCE' + pin(10) + '</span><span class="hb-stat__value num">' + esc(o.ref) + '</span><span class="hb-stat__hint">Write this on the transfer</span></div>' + iconBtn(I.copy, "Copy reference", { attrs: ' data-copy="' + esc(ref) + '"' }) + '</div>' +
          '<div class="hb-stat" data-variant="metric"><div class="hb-stat__body"><span class="hb-stat__label">TRANSFER BY</span><span class="hb-stat__value">' + esc(o.deadline.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })) + '</span><span class="hb-stat__hint">by ' + esc(o.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })) + ' · then the reservation lapses</span></div><span class="hb-stat__trail">' + I.clock + '</span></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="stack">' +
            '<h3 class="hb-title-sm">Bank details</h3>' +
            '<dl class="copyrows">' + BANK.map(function (b) {
              return '<div class="copyrow"><dt class="hb-body-sm">' + b[0] + '</dt><dd class="hb-body-md num"><bdi dir="ltr">' + esc(b[1]) + '</bdi></dd>' + iconBtn(I.copy, "Copy " + b[0], { attrs: ' data-copy="' + esc(b[1]) + '"' }) + '</div>';
            }).join('') + '</dl>' +
            '<div class="share">' +
              btn("Copy all details", { style: "outlined", size: "sm", icon: I.copy, attrs: ' data-act="copy-all"' }) +
              btn("Download instructions (PDF)", { style: "outlined", size: "sm", icon: I.download, attrs: ' data-act="pdf"' }) +
              btn("Send to finance", { style: "outlined", size: "sm", icon: I.message, attrs: ' data-act="send-finance"' }) +
            '</div>' +
          '</div>' +
          '<div class="stack">' +
            '<h3 class="hb-title-sm">Or scan with your bank app</h3>' +
            '<div class="qr">' + qrSvg() + '<span class="hb-body-sm muted">Benefit Pay and Fawri+ open a pre-filled transfer of ' + bhd(t.total) + ' with the reference set.</span></div>' +
          '</div>' +
        '</div>' +
      '</div></section>';
  }

  function receiptCard(){
    var r = state.receipt;
    var body;
    if (r && r.submitted) {
      body = alert("success", '<span class="hb-alert__title">Receipt received</span><span class="hb-alert__text">' + esc(r.name) + ' · submitted ' + esc(r.at) + '. We check transfers within two working hours and email you when the order is confirmed.</span>') +
        '<div class="row" style="margin-top:var(--hb-space-12)">' + btn("View receipt", { style: "ghost", size: "sm", icon: I.view, attrs: ' data-act="view-receipt"' }) + btn("Replace", { style: "ghost", size: "sm", icon: I.refresh, attrs: ' data-act="pick-receipt"' }) + '</div>';
    } else if (r) {
      body = '<div class="hb-upload" data-state="uploaded"><div class="hb-upload__files"><div class="hb-upload__file">' +
          '<span class="receipt-prev">' + (r.isImage ? '<img src="' + r.url + '" alt="">' : I.file) + '</span>' +
          '<div class="hb-upload__file-meta"><span class="hb-upload__name">' + esc(r.name) + '</span><span class="hb-upload__size num">' + esc(r.size) + ' · added ' + esc(r.at) + '</span><span class="hb-upload__bar"><i style="width:100%"></i></span></div>' +
          iconBtn(I.view, "Preview", { attrs: ' data-act="view-receipt"' }) + iconBtn(I.close, "Remove", { intent: "danger", attrs: ' data-act="drop-receipt"' }) +
        '</div></div></div>' +
        '<div class="row" style="margin-top:var(--hb-space-12)">' + btn("Submit receipt", { size: "lg", icon: I.check, attrs: ' data-act="submit-receipt"' }) + btn("Choose another", { style: "ghost", size: "lg", attrs: ' data-act="pick-receipt"' }) + '</div>';
    } else {
      body = '<div class="hb-upload" data-state="ready" id="drop" tabindex="0" role="button" aria-label="Upload the transfer receipt" data-act="pick-receipt">' +
          '<span class="hb-upload__icon">' + I.upload + '</span>' +
          '<span class="hb-upload__title">Drop the transfer receipt here</span>' +
          '<span class="hb-upload__hint">or click to choose a file</span>' +
          '<span class="hb-upload__max">PDF, JPG or PNG · up to 10 MB</span>' +
        '</div>' +
        '<p class="hb-body-sm muted" style="margin-top:var(--hb-space-12)">Not the person paying? Send the details to finance — the receipt can be added later from <a href="#" data-act="track">Purchase orders</a>.</p>';
    }
    return '<section class="panel">' +
      '<div class="panel__head"><h2 class="hb-title-md">Upload the transfer receipt' + pin(11) + '</h2>' +
        (r && r.submitted ? statusChip("approved", "Under review") : statusChip("pending", "Needed to confirm")) + '</div>' +
      '<div class="panel__body">' + body + '</div></section>';
  }

  function orderDetails(){
    var t = totals(), b = branch();
    return '<section class="panel">' +
      '<div class="panel__head"><h2 class="hb-title-md">Order details</h2>' +
        btn("Pro-forma invoice", { style: "ghost", size: "sm", icon: I.invoice, attrs: ' data-act="proforma"' }) +
        btn("Print", { style: "ghost", size: "sm", icon: I.print, attrs: ' data-act="print"' }) + '</div>' +
      '<div class="panel__body grid2">' +
        '<div class="stack">' +
          '<div><div class="hb-label-md muted">Deliver to</div><div class="hb-body-md">' + esc(b.name) + ' · <bdi dir="ltr" class="num">+973 ' + esc(state.branchDetails.phone) + '</bdi><br>' + b.lines.map(esc).join('<br>') + '</div></div>' +
          '<div><div class="hb-label-md muted">Delivery</div><div class="hb-body-md">' + esc(state.slot.day) + ', ' + esc(state.slot.window) + ' · Al Manar Trading</div></div>' +
          (state.po ? '<div><div class="hb-label-md muted">Purchase order</div><div class="hb-body-md num">' + esc(state.po) + '</div></div>' : '') +
        '</div>' +
        '<div class="stack">' +
          '<div class="lines">' + state.lines.map(function (l) {
            return '<div class="line"><span class="line__thumb">' + I.pkg + '</span><span class="line__name hb-body-sm">' + esc(l.name) + '<br><span class="muted">' + esc(l.pack) + ' × ' + l.qty + '</span></span><span class="hb-body-sm num">' + bhd(l.qty * l.price) + '</span></div>';
          }).join('') + '</div>' +
          '<dl class="sum hb-body-sm"><div class="sum__row"><dt>Items</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
            '<div class="sum__row"><dt>Delivery</dt><dd class="num">' + bhd(t.delivery) + '</dd></div>' +
            (t.discount ? '<div class="sum__row" data-save><dt>' + esc(state.coupon.code) + '</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
            '<div class="sum__row"><dt>VAT 10%</dt><dd class="num">' + bhd(t.vat) + '</dd></div>' +
            '<div class="sum__row"><dt class="strong">Total</dt><dd class="num">' + bhd(t.total) + '</dd></div></dl>' +
        '</div>' +
      '</div></section>';
  }

  function renderPaid(){
    var host = $("#screen-paid");
    if (!state.order) { host.innerHTML = ''; return; }
    var o = state.order, r = state.receipt, submitted = r && r.submitted;
    host.innerHTML =
      stepper(3) +
      '<div class="panel">' +
        '<div class="hero-ok">' +
          '<div class="hero-ok__mark">' + I.check + '</div>' +
          '<h1 class="hb-headline-md" data-ar="تم استلام طلبك">' + (submitted ? 'Receipt received — we are confirming your payment' : 'Order received — awaiting your transfer') + pin(9) + '</h1>' +
          '<p class="hb-body-md muted" style="margin-top:var(--hb-space-8)">' + (submitted ? 'Nothing more to do. You will get an email once the transfer is matched.' : 'Your order is reserved. It is confirmed once the transfer arrives.') + '</p>' +
          '<div class="order-ref hb-body-md"><span class="muted">Order</span><b class="num">' + esc(o.ref) + '</b>' + iconBtn(I.copy, "Copy order number", { attrs: ' data-copy="' + esc(o.ref) + '"' }) +
            '<span class="muted">placed ' + esc(fmtDate(o.placedAt)) + '</span>' + statusChip(submitted ? "approved" : "pending", submitted ? "Under review" : "Awaiting payment") + '</div>' +
        '</div>' + progress() +
      '</div>' +
      '<div class="cols" style="margin-top:var(--hb-space-16)">' +
        '<div class="stack">' + payCard() + orderDetails() + '</div>' +
        '<aside class="rail">' + receiptCard() +
          '<div class="panel"><div class="panel__body stack">' +
            btn(submitted ? "Track this order" : "Track this order", { size: "lg", block: true, style: submitted ? "filled" : "outlined", icon: I.external, attrs: ' data-act="track"' }) +
            btn("Continue shopping", { size: "lg", block: true, style: "ghost", icon: I.cart, attrs: ' data-act="shop"' }) + pin(13) +
            '<div class="trust hb-body-sm"><div>' + I.check + 'Questions? Chat with Highbase support</div><div>' + I.check + 'Cancellable free until dispatch</div></div>' +
          '</div></div>' +
        '</aside>' +
      '</div>';
    applyLang();
    wireDrop();
  }
