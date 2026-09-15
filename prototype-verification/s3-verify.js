
  /* ============================================================
     Screen 1 — Checkout verification. Header → body → Footer; the body is a
     stepper, three facts to confirm, and a sticky summary that commits.
     ============================================================ */
  function stepper(now){
    var steps = ["Cart", "Review", "Verify & place order", "Pay"];
    return '<nav class="steps hb-label-lg" aria-label="Checkout progress">' + steps.map(function (s, i) {
      var st = i < now ? "done" : i === now ? "now" : "";
      return '<span class="step"' + (st ? ' data-state="' + st + '"' : '') + (st === "now" ? ' aria-current="step"' : '') + '>' +
        '<span class="step__no hb-label-md">' + (st === "done" ? I.check : (i + 1)) + '</span><span>' + s + '</span></span>' +
        (i < steps.length - 1 ? '<span class="step__bar" aria-hidden="true"></span>' : '');
    }).join('') + '</nav>';
  }

  function checksBlock(){
    var when = state.checkedAt || "a moment ago";
    return '<ul class="checks hb-body-sm">' +
      '<li>' + I.success + '<span>All ' + state.lines.length + ' lines in stock at Al Manar Trading · checked ' + when + '</span></li>' +
      '<li>' + I.success + '<span>Above the supplier minimum (BHD 10.000)</span></li>' +
      '<li>' + I.success + '<span>Business verification current — nothing to upload</span></li>' +
    '</ul>';
  }

  function deliverTo(){
    var b = branch();
    return '<section class="panel">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="التوصيل إلى">Deliver to' + pin(2) + '</h2>' +
        btn("Change", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-branch"' }) + '</div>' +
      '<div class="panel__body"><div class="addr">' +
        '<div class="addr__lines">' +
          '<div class="row"><span class="hb-avatar" data-shape="square" data-size="40">' + b.contact.split(" ").map(function (w) { return w[0]; }).join("") + '</span>' +
            '<div><div class="hb-title-sm">' + esc(b.name) + pin(3) + '</div><div class="hb-body-sm muted">' + esc(b.contact) + ' · ' + esc(b.email) + '</div></div></div>' +
          '<div class="hb-body-md" style="margin-top:var(--hb-space-8)">' + b.lines.map(esc).join('<br>') + '</div>' +
          '<div class="addr__meta hb-body-sm">' +
            '<span>' + I.clock + esc(b.hours) + '</span>' +
            '<span><bdi dir="ltr" class="num">' + esc(b.phone) + '</bdi></span>' +
            '<span>' + I.truck + 'Delivery ' + esc(state.slot.day) + ', ' + esc(state.slot.window) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="map" aria-label="Map pin for ' + esc(b.name) + '">' + I.location + '<span class="map__label hb-label-sm">' + (b.pinned ? 'Pin saved' : 'No pin yet') + '</span></div>' +
      '</div></div>' +
    '</section>';
  }

  function docRow(d){
    var tone = { verified: ["active", "Verified"], expiring: ["pending", "Expires " + d.until], missing: [d.required ? "cancelled" : "approved", d.required ? "Required" : "Optional"] }[d.status];
    var prev = d.file
      ? (d.file.url && d.file.isImage ? '<img src="' + d.file.url + '" alt="">' : I.file)
      : I.upload;
    var actions = d.file
      ? btn("View", { style: "ghost", size: "sm", icon: I.view, attrs: ' data-act="view-doc" data-doc="' + d.id + '"' }) +
        btn(d.status === "expiring" ? "Replace" : "Replace", { style: "outlined", size: "sm", icon: I.refresh, attrs: ' data-act="upload-doc" data-doc="' + d.id + '"' })
      : btn("Add document", { style: "outlined", size: "sm", icon: I.upload, attrs: ' data-act="upload-doc" data-doc="' + d.id + '"' });
    return '<div class="hb-li">' +
      '<span class="doc__prev" aria-hidden="true">' + prev + '</span>' +
      '<div class="hb-li__body"><div class="hb-li__title hb-title-sm">' + esc(d.name) + '</div>' +
        '<div class="doc__meta hb-body-sm"><span>' + esc(d.meta) + '</span>' +
          (d.file ? '<span>· ' + esc(d.file.name) + ' · <span class="num">' + esc(d.file.size) + '</span></span>' : '') +
          (d.status === "verified" && d.until ? '<span>· valid until ' + esc(d.until) + '</span>' : '') + '</div></div>' +
      '<div class="hb-li__trail row">' + statusChip(tone[0], tone[1]) + actions + '</div>' +
    '</div>';
  }

  function verification(){
    var expiring = state.docs.filter(function (d) { return d.status === "expiring"; });
    var missingReq = state.docs.filter(function (d) { return d.status === "missing" && d.required; });
    var head = missingReq.length
      ? alert("error", '<span class="hb-alert__title">A required document is missing</span><span class="hb-alert__text">Orders are held until it is verified.</span>')
      : '<div class="verified">' + I.success + '<div><div class="hb-title-sm">Business verified' + pin(4) + '</div>' +
          '<div class="hb-body-sm">Verified 12 Jan 2026 · nothing to upload for this order' +
          (expiring.length ? ' · <b>' + expiring.length + ' document' + (expiring.length > 1 ? 's' : '') + ' expiring soon</b>' : '') + '</div></div></div>';
    return '<section class="panel">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="التحقق من المنشأة">Business verification</h2>' +
        '<span class="hb-body-sm muted">Account-level · applies to every order</span></div>' +
      '<div class="panel__body stack">' + head +
        '<div class="docs">' + state.docs.map(docRow).join('') + '</div>' +
        '<p class="hb-body-sm muted">PDF, JPG or PNG up to 10 MB. Documents are reviewed within one working day and stay on the account.' + pin(5) + '</p>' +
      '</div></section>';
  }

  function paymentMethod(){
    return '<section class="panel">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="طريقة الدفع">Payment method' + pin(6) + '</h2></div>' +
      '<div class="panel__body">' +
        radio("pay", "hb", state.payment === "hb", "Highbase Payment — bank transfer",
          "Transfer BHD " + totals().total.toFixed(3) + " to the Highbase account within 48 hours and upload the receipt. Stock is reserved while you do.",
          { tag: chip("No fee", { style: "tonal", size: "sm" }) }) +
        radio("pay", "cod", state.payment === "cod", "Cash on delivery", "Pay the driver on arrival. Available for orders under BHD 500.") +
        radio("pay", "credit", false, "Net 30 credit terms", "Pay 30 days after delivery. Requires a credit check.",
          { disabled: true, tag: chip("Not enabled", { size: "sm" }) }) +
        '<div class="grid2" style="margin-top:var(--hb-space-16)">' +
          field({ id: "po", label: "Purchase order number", value: state.po, placeholder: "PO-2026-0914", msg: "Printed on the tax invoice and the payment reference", attrs: ' data-bind="po"' }) +
          '<div class="hb-field"><span class="hb-field__label">Tax invoice</span>' +
            '<div style="padding-top:var(--hb-space-8)">' + check("inv", state.invoiceEmail, "Email it to accounts@buyerbahrain.com", ' data-bind="invoiceEmail"') + pin(8) + '</div></div>' +
        '</div>' +
      '</div></section>';
  }

  function summaryRail(){
    var t = totals();
    return '<aside class="rail">' +
      '<div class="panel">' +
        '<div class="panel__head"><h2 class="hb-title-md" data-ar="ملخص الطلب">Order summary' + pin(7) + '</h2></div>' +
        '<div class="panel__body stack">' +
          '<div class="row"><span class="hb-avatar" data-shape="square" data-size="32">' + state.supplier.initials + '</span>' +
            '<div class="line__name"><div class="hb-title-sm">' + esc(state.supplier.name) + '</div><div class="hb-body-sm muted">Ships from ' + esc(state.supplier.from) + ' · ' + t.lines + ' lines</div></div>' +
            btn("Items", { style: "ghost", size: "sm", icon: I.chevronDown, attrs: ' data-act="toggle-lines" aria-expanded="' + (state.showLines ? 'true' : 'false') + '"' }) + '</div>' +
          (state.showLines ? '<div class="lines">' + state.lines.map(function (l) {
            return '<div class="line"><span class="line__thumb">' + I.pkg + '</span><span class="line__name hb-body-sm">' + esc(l.name) + '<br><span class="muted">' + esc(l.pack) + ' × ' + l.qty + '</span></span><span class="hb-body-sm num">' + bhd(l.qty * l.price) + '</span></div>';
          }).join('') + '</div>' : '') +
          '<hr class="hb-divider" data-orientation="horizontal">' +
          '<dl class="sum hb-body-md">' +
            '<div class="sum__row"><dt>Items (' + t.lines + ' lines)</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
            '<div class="sum__row"><dt>Delivery · ' + esc(state.slot.day) + '</dt><dd class="num">' + bhd(t.delivery) + '</dd></div>' +
            (t.discount ? '<div class="sum__row" data-save><dt>' + esc(state.coupon.code) + '</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
            '<div class="sum__row"><dt>VAT 10%</dt><dd class="num">' + bhd(t.vat) + '</dd></div>' +
          '</dl>' +
          '<hr class="hb-divider" data-orientation="horizontal">' +
          '<dl class="sum__total"><dt class="hb-title-md">Total due</dt><dd><span class="hb-headline-sm num">' + bhd(t.total) + '</span>' +
            '<span class="hb-body-sm muted">Includes ' + bhd(t.vat) + ' reclaimable VAT</span></dd></dl>' +
          '<div class="hb-body-sm muted">' + check("agree", state.agree, 'I agree to the <a href="#" data-act="terms">supply terms</a>', ' data-bind="agree"') + '</div>' +
          btn(state.placing ? "Checking stock and minimums…" : "Place order · " + bhd(t.total),
            { size: "lg", block: true, icon: state.placing ? I.refresh : I.wallet, attrs: ' data-act="place-order"' + (state.placing ? ' data-state="loading" aria-busy="true"' : ''), disabled: !state.agree }) +
          '<p class="hb-body-sm muted" style="text-align:center">Next: bank details for a transfer of ' + bhd(t.total) + '. Stock is reserved for 48 hours.</p>' +
          '<div class="trust hb-body-sm">' +
            '<div>' + I.check + 'Tax invoice issued on dispatch</div>' +
            '<div>' + I.check + 'Damaged goods returnable for 48h</div>' +
            '<div>' + I.check + 'Cancellable free until dispatch</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</aside>';
  }

  function renderVerify(){
    var host = $("#screen-verify");
    host.innerHTML =
      stepper(2) +
      '<div class="hb-pagehead" style="margin-bottom:var(--hb-space-16)"><div class="hb-pagehead__row">' +
        '<h1 class="hb-pagehead__title hb-headline-md" data-ar="تأكيد الطلب">Confirm and place your order</h1></div>' +
        '<p class="hb-pagehead__desc hb-body-md">Check where it goes and how you will pay. Your business documents are already on file.</p></div>' +
      '<div class="cols">' +
        '<div class="stack">' +
          alert("success", '<span class="hb-alert__title">Ready to place' + pin(1) + '</span><span class="hb-alert__text">' + checksBlock() + '</span>',
            { kind: "hb-banner", actions: btn("Re-check", { style: "ghost", size: "sm", icon: I.refresh, attrs: ' data-act="recheck"' }) }) +
          deliverTo() + verification() + paymentMethod() +
        '</div>' + summaryRail() +
      '</div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(totals().total) + '</span>' +
        btn("Place order", { size: "lg", icon: I.wallet, attrs: ' data-act="place-order"', disabled: !state.agree }) + '</div>';
    applyLang();
  }
