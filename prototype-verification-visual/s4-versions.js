
  /* ============================================================
     Version A · Steps — an accordion. One section open at a time; the others
     collapse to a one-line summary. Disclosure by sequence.
     ============================================================ */
  var SECTIONS = [
    { id: "branch",  title: "Branch Details",     line: branchLine,  body: branchBlock,  ok: function () { return true; } },
    { id: "address", title: "Delivery Address",   line: addressLine, body: addressBlock, ok: function () { return true; } },
    { id: "docs",    title: "Business Documents", line: docsLine,    body: docsBlock,    ok: docsOk }
  ];
  function renderA(){
    var now = state.step.a;
    var items = SECTIONS.map(function (s, i) {
      var st = i === now ? "now" : (i < now ? "done" : "");
      var pill = s.id === "docs" ? (docsOk() ? statusChip("active", docsOnFile() + " of " + docsNeeded() + " on file") : statusChip("pending", docsOnFile() + " of " + docsNeeded() + " on file")) : statusChip("active", "Saved");
      return '<section class="acc__item" data-state="' + st + '" id="acc-' + s.id + '">' +
        '<button type="button" class="acc__head" data-act="open-step" data-step="' + i + '" aria-expanded="' + (st === "now") + '">' +
          '<span class="acc__no hb-label-lg">' + (st === "done" ? I.check : (i + 1)) + '</span>' +
          '<span class="acc__titles"><span class="hb-title-md">' + s.title + '</span>' +
            (st === "now" ? '' : '<span class="acc__summary hb-body-sm">' + s.line() + '</span>') + '</span>' +
          (st === "now" ? '' : pill) +
          '<span class="acc__chev">' + I.chevronDown + '</span>' +
        '</button>' +
        (st === "now" ? '<div class="acc__body">' + s.body() +
          '<div class="acc__foot">' + (i > 0 ? btn("Back", { style: "ghost", attrs: ' data-act="open-step" data-step="' + (i - 1) + '"' }) : '') +
            (i < SECTIONS.length - 1 ? btn("Confirm & continue", { icon: I.chevronRight, attrs: ' data-act="next-step"' }) : '') + '</div></div>' : '') +
      '</section>';
    }).join('');
    $("#screen-a").innerHTML = pageHead() +
      '<div class="cols"><div class="stack">' +
        alert("success", '<span class="hb-alert__text">Your pin location is saved. You can update it any time before purchase.</span>') +
        '<div class="acc">' + items + '</div>' +
      '</div>' + rail('<ul class="checks hb-body-sm"><li>' + I.success + '<span>Address confirmed</span></li><li' + (docsOk() ? '' : ' data-state="warn"') + '>' + (docsOk() ? I.success : I.warning) + '<span>Required documents on file</span></li></ul>') + '</div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(totals().total) + '</span>' + btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) + '</div>';
  }

  /* ============================================================
     Version B · Confirm — everything already known is one compact card with a
     single line; the form appears only behind "Change". Disclosure by demand.
     The common case (nothing to change) is one look and one button.
     ============================================================ */
  function cardB(o){
    return '<section class="card" id="card-' + o.id + '">' +
      '<div class="card__row">' +
        '<span class="card__icon">' + o.icon + '</span>' +
        '<div class="card__main"><span class="hb-title-sm">' + o.title + '</span>' +
          '<span class="card__line hb-body-sm">' + o.meta + '</span></div>' +
        o.pill +
        btn(o.action, { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="open-drawer" data-drawer="' + o.id + '"' }) +
      '</div>' +
      '<div class="card__prev">' + o.preview() + '</div>' +
    '</section>';
  }
  function renderB(){
    var ok = docsOk(), t = totals();
    $("#screen-b").innerHTML = pageHead() +
      '<div class="cols"><div class="stack">' +
        '<div class="ready"' + (ok ? '' : ' data-state="warn"') + '><span class="ready__mark">' + (ok ? I.check : I.warning) + '</span>' +
          '<div><div class="hb-title-lg">' + (ok ? 'Everything is in place' : 'One thing still needed') + '</div>' +
          '<div class="hb-body-md">' + (ok ? 'Your branch, delivery address and documents are on file. Check them below, or place the order.' : 'Still needed: ' + docsMissing().join(', ') + '. Open Business Documents to add it.') + '</div></div></div>' +
        cardB({ id: "branch", icon: I.building, title: "Branch Details", meta: "Who the driver calls on arrival",
          pill: statusChip("active", "Saved"), action: "Change", preview: prevBranch }) +
        cardB({ id: "address", icon: I.location, title: "Delivery Address", meta: "Where the order goes",
          pill: statusChip("active", "Pin saved"), action: "Change", preview: prevAddress }) +
        cardB({ id: "docs", icon: I.file, title: "Business Documents", meta: "Kept on your account",
          pill: ok ? statusChip("active", docsOnFile() + " of " + docsNeeded()) : statusChip("pending", docsOnFile() + " of " + docsNeeded()),
          action: "Manage", preview: prevDocs }) +
      '</div>' +
      '<aside class="rail"><div class="panel"><div class="panel__body stack">' +
        '<div class="hb-title-md">Total <span class="hb-headline-sm num" style="float:inline-end">' + bhd(t.total) + '</span></div>' +
        '<div class="hb-body-sm muted">' + t.lines + ' lines from ' + esc(state.supplier.name) + ' · delivery ' + esc(state.slot.day) + ' · Highbase Payment</div>' +
        placeBtn({ label: "Place Order · " + bhd(t.total) }) +
        '<details class="why"><summary class="hb-body-sm">' + I.chevronDown + 'See the breakdown</summary><div class="stack" style="margin-top:var(--hb-space-12)">' + railTotals() + '</div></details>' +
      '</div></div></aside></div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(t.total) + '</span>' + btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) + '</div>';
  }

  /* ============================================================
     Version C · Guided — one step on screen, a vertical map of the steps beside
     it, plain words, one action. Disclosure by focus. The last step reviews.
     ============================================================ */
  var GUIDE = [
    { id: "branch",  short: "Who receives it",      title: "Who should we contact for this delivery?",   lead: "The branch and the person the driver calls on arrival. These are your saved details — change them only if something is different for this order.", why: "Suppliers confirm the delivery window with this number, and the tax invoice goes to this email." },
    { id: "address", short: "Where it goes",        title: "Where should the order be delivered?",      lead: "Your saved address and map pin. The pin is what the driver navigates to.", why: "A saved pin means the driver arrives at the gate, not the street. Move it if your receiving bay has changed." },
    { id: "docs",    short: "Your documents",       title: "Are your business documents up to date?",   lead: "We keep these on your account. You only need to act here if something is missing or has changed.", why: "Bahraini regulation requires a valid commercial registration and a signatory ID for business purchases. A VAT certificate is optional — it lets you reclaim VAT." },
    { id: "review",  short: "Review & place order", title: "Everything below is what we will use",       lead: "Read it once. If it is right, place the order and we will show you the bank details.", why: null }
  ];
  function renderC(){
    var now = state.step.c, g = GUIDE[now], t = totals();
    var nav = '<nav class="guide__nav" aria-label="Steps">' + GUIDE.map(function (s, i) {
      var st = i === now ? "now" : (i < now ? "done" : "");
      return '<button type="button" class="guide__step" data-state="' + st + '" data-act="go-step" data-step="' + i + '" aria-current="' + (st === "now" ? 'step' : 'false') + '">' +
        '<span class="acc__no hb-label-md">' + (st === "done" ? I.check : (i + 1)) + '</span><span class="hb-label-lg">' + s.short + '</span></button>';
    }).join('') + '<hr class="hb-divider" data-orientation="horizontal" style="margin:var(--hb-space-8) 0">' +
      '<div style="padding:var(--hb-space-8) var(--hb-space-12)"><div class="hb-body-sm muted">Order total</div><div class="hb-title-lg num">' + bhd(t.total) + '</div><div class="hb-body-sm muted">' + t.lines + ' lines · ' + esc(state.supplier.name) + '</div></div></nav>';
    var body;
    if (g.id === "branch") { body = branchBlock(); }
    else if (g.id === "address") { body = addressBlock(); }
    else if (g.id === "docs") { body = docsBlock({ vatAsLink: true }); }
    else {
      body = '<dl class="review">' +
        '<div class="review__row"><dt class="hb-label-md">Contact</dt><dd class="hb-body-md">' + branchLine() + '</dd>' + btn("Change", { style: "ghost", size: "sm", attrs: ' data-act="go-step" data-step="0"' }) + '</div>' +
        '<div class="review__row"><dt class="hb-label-md">Deliver to</dt><dd class="hb-body-md">' + addressLine() + '</dd>' + btn("Change", { style: "ghost", size: "sm", attrs: ' data-act="go-step" data-step="1"' }) + '</div>' +
        '<div class="review__row"><dt class="hb-label-md">Documents</dt><dd class="hb-body-md">' + docsLine() + '</dd>' + btn("Change", { style: "ghost", size: "sm", attrs: ' data-act="go-step" data-step="2"' }) + '</div>' +
        '<div class="review__row"><dt class="hb-label-md">Payment</dt><dd class="hb-body-md">Highbase Payment · bank transfer of <b class="num">' + bhd(t.total) + '</b> within 48 hours</dd></div>' +
      '</dl>' + (docsOk() ? '' : alert("warning", '<span class="hb-alert__text">Still needed: ' + docsMissing().join(', ') + '.</span>', { actions: btn("Add it", { style: "ghost", size: "sm", attrs: ' data-act="go-step" data-step="2"' }) }));
    }
    var foot = '<div class="guide__foot">' +
      (now > 0 ? btn("Back", { style: "ghost", size: "lg", attrs: ' data-act="go-step" data-step="' + (now - 1) + '"' }) : '') + '<span class="spacer"></span>' +
      (now < GUIDE.length - 1
        ? btn(now === 2 ? "Documents are fine — continue" : "This is right — continue", { size: "lg", icon: I.chevronRight, attrs: ' data-act="next-step"' })
        : btn("Place Order · " + bhd(t.total), { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' })) + '</div>';
    $("#screen-c").innerHTML = pageHead() +
      '<div class="guide">' + nav +
        '<section class="guide__main" aria-labelledby="g-title">' +
          '<div class="guide__eyebrow hb-label-lg">Step ' + (now + 1) + ' of ' + GUIDE.length + '</div>' +
          '<h2 class="hb-headline-sm" id="g-title">' + g.title + '</h2>' +
          '<p class="guide__lead hb-body-md">' + g.lead + '</p>' + body +
          (g.why ? '<details class="why"><summary class="hb-body-sm">' + I.info + 'Why do we ask for this?</summary><p class="hb-body-sm">' + g.why + '</p></details>' : '') +
          foot +
        '</section></div>';
  }



  /* ============================================================
     Version D · Tabs — the three sections are tabs over one pane. Only one
     pane exists at a time, but all three stay visible and reachable in any
     order, each carrying its own status. Disclosure by selection.
     ============================================================ */
  var TABS = [
    { id: "branch",  label: "Branch Details",     lead: "Who the driver calls when the order arrives.", body: branchBlock },
    { id: "address", label: "Delivery Address",   lead: "Where the order goes, and the pin the driver navigates to.", body: addressBlock },
    { id: "docs",    label: "Business Documents", lead: "Kept on your account — act only if something is missing.", body: function () { return docsBlock({ vatAsLink: true }); } }
  ];
  function tabPill(i){
    var t = TABS[i];
    if (t.id !== "docs") { return '<span class="tab__badge">' + statusChip("active", "Saved") + '</span>'; }
    return '<span class="tab__badge">' + (docsOk() ? statusChip("active", docsOnFile() + " of " + docsNeeded()) : statusChip("pending", docsOnFile() + " of " + docsNeeded())) + '</span>';
  }
  function renderD(){
    var now = state.step.d, t = TABS[now], tot = totals();
    var bar = '<div class="tabbar"><div class="hb-tabs" role="tablist" aria-label="Verification sections">' +
      TABS.map(function (x, i) {
        return '<button type="button" class="hb-tab" role="tab" aria-selected="' + (i === now) + '" data-act="go-tab" data-step="' + i + '">' +
          '<span class="hb-tab__icon">' + (i === now ? I.chevronRight : (x.id === "docs" && !docsOk() ? I.warning : I.check)) + '</span>' +
          x.label + tabPill(i) + '</button>';
      }).join('') + '</div>' +
      '<span class="hb-body-sm muted">All three are already saved — open any one to change it</span></div>';
    var pane = '<section class="tabpane" role="tabpanel" aria-label="' + t.label + '">' +
      '<div class="tabpane__head"><h2 class="hb-title-lg">' + t.label + '</h2><p class="hb-body-md">' + t.lead + '</p></div>' +
      t.body() +
      '<div class="tabfoot">' +
        (now > 0 ? btn("Previous", { style: "ghost", attrs: ' data-act="go-tab" data-step="' + (now - 1) + '"' }) : '') +
        '<span class="spacer"></span>' +
        (now < TABS.length - 1 ? btn("Next: " + TABS[now + 1].label, { style: "outlined", icon: I.chevronRight, attrs: ' data-act="go-tab" data-step="' + (now + 1) + '"' }) : '') +
        btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) +
      '</div></section>';
    $("#screen-d").innerHTML = pageHead() +
      '<div class="cols"><div class="stack">' + bar + pane + '</div>' +
      rail('<ul class="checks hb-body-sm"><li>' + I.success + '<span>Address confirmed</span></li><li' + (docsOk() ? '' : ' data-state="warn"') + '>' + (docsOk() ? I.success : I.warning) + '<span>Required documents on file</span></li></ul>') + '</div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(tot.total) + '</span>' + btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) + '</div>';
  }

  /* ============================================================
     Version E · Checklist — the whole page is a list of what is already done,
     ticked. Nothing is a form until the buyer expands one row. A progress bar
     states how much is settled. Disclosure by exception: only what is NOT
     done looks like work.
     ============================================================ */
  var CHECKS = [
    { id: "branch",  label: "Branch details",     val: branchLine,  done: function () { return true; },  editor: function () { return state.editing.branch ? branchForm() : branchView() + '<div class="row-end" style="margin-top:var(--hb-space-12)">' + btn("Edit Details", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-branch"' }) + '</div>'; } },
    { id: "address", label: "Delivery address",   val: addressLine, done: function () { return true; },  editor: function () { return state.editing.address ? addressForm() : addressView() + '<div class="row-end" style="margin-top:var(--hb-space-12)">' + btn("Edit Address", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-address"' }) + '</div>'; } },
    { id: "docs",    label: "Business documents", val: docsLine,    done: docsOk,                        editor: function () { return docsBlock({ vatAsLink: true }); } },
    { id: "payment", label: "Payment method",     val: function () { return 'Highbase Payment · bank transfer of <b class="num">' + bhd(totals().total) + '</b> within 48 hours'; }, done: function () { return true; }, editor: null }
  ];
  function renderE(){
    var done = CHECKS.filter(function (c) { return c.done(); }).length, all = CHECKS.length;
    var pct = Math.round(done / all * 100);
    var rows = CHECKS.map(function (c) {
      var ok = c.done(), open = !!state.expand[c.id];
      return '<div class="list__item" data-state="' + (ok ? "done" : "todo") + '" id="row-' + c.id + '">' +
        '<span class="list__tick">' + (ok ? I.check : I.warning) + '</span>' +
        '<div class="list__main">' +
          '<span class="hb-title-sm">' + c.label + '</span>' +
          '<span class="list__val hb-body-md">' + c.val() + '</span>' +
          (open && c.editor ? '<div class="list__edit">' + c.editor() + '</div>' : '') +
        '</div>' +
        (c.editor ? btn(open ? "Close" : (ok ? "Change" : "Add"), { style: open ? "tonal" : (ok ? "ghost" : "filled"), size: "sm", icon: open ? I.close : I.edit, attrs: ' data-act="expand-row" data-row="' + c.id + '"' }) : '') +
      '</div>';
    }).join('');
    var t = totals();
    $("#screen-e").innerHTML = pageHead() +
      '<div class="cols"><div class="stack">' +
        '<div class="progressbar"><span class="hb-title-sm">' + done + ' of ' + all + ' ready</span>' +
          '<span class="progressbar__track"><span class="progressbar__fill" style="width:' + pct + '%"></span></span>' +
          (done === all ? statusChip("active", "Ready to place") : statusChip("pending", "1 thing left")) + '</div>' +
        '<div class="list">' + rows + '</div>' +
        '<p class="hb-body-sm muted">Anything ticked is already on your account — change it only if it is wrong for this order.</p>' +
      '</div>' +
      '<aside class="rail"><div class="panel"><div class="panel__body stack">' +
        '<div class="hb-title-md">Total <span class="hb-headline-sm num" style="float:inline-end">' + bhd(t.total) + '</span></div>' +
        '<div class="hb-body-sm muted">' + t.lines + ' lines from ' + esc(state.supplier.name) + ' · delivery ' + esc(state.slot.day) + '</div>' +
        placeBtn({ label: done === all ? "Place Order · " + bhd(t.total) : "Place Order" }) +
        '<details class="why"><summary class="hb-body-sm">' + I.chevronDown + 'See the breakdown</summary><div class="stack" style="margin-top:var(--hb-space-12)">' + railTotals() + '</div></details>' +
      '</div></div></aside></div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(t.total) + '</span>' + btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) + '</div>';
  }

  function renderVerify(){ renderA(); renderB(); renderC(); renderD(); renderE(); applyLang(); if (state.drawer && dlg.open) { paintDrawer(); } wireDocDrops(); }
