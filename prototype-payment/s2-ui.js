
  /* ============================================================
     Builders — every one emits a Highbase component's own markup.
     ============================================================ */
  var I = {
    add:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-add"/></svg>',
    close:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-close"/></svg>',
    success:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-success"/></svg>',
    warning:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-warning"/></svg>',
    error:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-error"/></svg>',
    info:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-info"/></svg>',
    check:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-check"/></svg>',
    store:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-store"/></svg>',
    truck:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-truck"/></svg>',
    pkg:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-package"/></svg>',
    location:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-location"/></svg>',
    building:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-building"/></svg>',
    invoice:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-invoice"/></svg>',
    file:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-file"/></svg>',
    upload:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-upload"/></svg>',
    download:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-download"/></svg>',
    copy:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-copy"/></svg>',
    clock:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-clock"/></svg>',
    calendar:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-calendar"/></svg>',
    wallet:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-wallet"/></svg>',
    edit:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-edit"/></svg>',
    view:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-view"/></svg>',
    refresh:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-refresh"/></svg>',
    cart:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-cart"/></svg>',
    message:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-message"/></svg>',
    external:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-external"/></svg>',
    chevronRight:'<svg class="hb-i" aria-hidden="true" data-mirror><use href="#hb-i-chevronRight"/></svg>',
    chevronDown:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-chevronDown"/></svg>',
    print:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-print"/></svg>',
    phone:null   // icon/phone is not in the library — flagged, never substituted
  };
  var ALERT_ICON = { success: I.success, warning: I.warning, error: I.error, info: I.info };
  var STATUS_ICON = { active: I.success, approved: I.info, pending: I.warning, cancelled: I.error, completed: I.check };

  function btn(label, o){
    o = o || {};
    return '<button type="button" class="hb-btn' + (o.block ? ' proto-block' : '') + (o.cls ? ' ' + o.cls : '') + '"' +
      ' data-intent="' + (o.intent || 'primary') + '" data-style="' + (o.style || 'filled') + '"' +
      ' data-size="' + (o.size || 'md') + '"' + (o.attrs || '') + (o.disabled ? ' disabled' : '') + '>' +
      (o.icon ? '<span class="hb-btn__icon">' + o.icon + '</span>' : '') +
      '<span class="hb-btn__label">' + label + '</span></button>';
  }
  function iconBtn(icon, label, o){
    o = o || {};
    return '<button type="' + (o.type || 'button') + '" class="hb-btn hb-icon-btn" data-intent="' + (o.intent || 'primary') +
      '" data-style="' + (o.style || 'ghost') + '" data-size="' + (o.size || 'sm') + '"' +
      ' aria-label="' + esc(label) + '" title="' + esc(label) + '"' + (o.attrs || '') + '>' +
      '<span class="hb-btn__icon">' + icon + '</span></button>';
  }
  function chip(label, o){
    o = o || {};
    return '<span class="hb-chip" data-style="' + (o.style || 'neutral') + '" data-size="' + (o.size || 'sm') + '">' +
      (o.icon ? '<span class="hb-chip__icon">' + o.icon + '</span>' : '') + label + '</span>';
  }
  /* The Data Table's status pill carries every state on the page. Its vocabulary is fixed
     (active · approved · pending · cancelled · completed) — the label is content, the tone
     comes from the vocabulary, so no new data-status value is invented. */
  function statusChip(status, label){
    return '<span class="hb-status" data-status="' + status + '">' + STATUS_ICON[status] + '<span>' + label + '</span></span>';
  }
  function alert(status, html, o){
    o = o || {};
    return '<div class="hb-alert ' + (o.kind || 'hb-inline-alert') + '" data-status="' + status + '" role="status">' +
      '<span class="hb-alert__icon">' + ALERT_ICON[status] + '</span>' +
      '<span class="hb-alert__body">' + html + '</span>' +
      (o.actions ? '<span class="hb-alert__actions">' + o.actions + '</span>' : '') + '</div>';
  }
  function check(id, on, label, attrs){
    return '<label class="hb-check">' +
      '<input type="checkbox" class="hb-check__input"' + (on ? ' checked' : '') + (attrs || '') +
      (id ? ' id="' + id + '"' : '') + '>' +
      '<span class="hb-check__box"></span>' +
      (label ? '<span class="hb-check__label hb-body-md">' + label + '</span>' : '') + '</label>';
  }
  function radio(name, val, on, title, desc, o){
    o = o || {};
    return '<label class="opt"' + (o.disabled ? ' data-disabled' : '') + '>' +
      '<span class="hb-radio"><input type="radio" class="hb-radio__input" name="' + name + '" value="' + val + '"' +
      (on ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span class="hb-radio__circle"></span></span>' +
      '<span class="opt__main"><span class="opt__title hb-title-sm">' + title + (o.tag || '') + '</span>' +
      (desc ? '<span class="opt__desc hb-body-sm">' + desc + '</span>' : '') + '</span>' +
      (o.price ? '<span class="opt__price hb-title-sm">' + o.price + '</span>' : '') + '</label>';
  }
  function field(o){
    var id = o.id, isSelect = !!o.options;
    var control = isSelect
      ? '<select class="hb-field__input" id="' + id + '"' + (o.attrs || '') + '>' +
          o.options.map(function (v) { return '<option' + (v === o.value ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select>' +
        '<span class="hb-select__chevron">' + I.chevronDown + '</span>'
      : '<input class="hb-field__input" id="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(o.value || '') + '"' +
          (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.attrs || '') + '>';
    return '<div class="hb-field' + (isSelect ? ' hb-select' : ' hb-textfield') + '"' + (o.state ? ' data-state="' + o.state + '"' : '') + '>' +
      '<label class="hb-field__label" for="' + id + '">' + o.label + (o.req ? ' <span class="hb-field__req">*</span>' : '') + '</label>' +
      '<div class="hb-field__control">' + (o.prefix || '') + control + '</div>' +
      (o.msg ? '<div class="hb-field__msg">' + o.msg + '</div>' : '') + '</div>';
  }
  function phoneField(o){
    /* The Phone Field molecule: country selector inside the control. icon/phone is absent
       from the icon library, so the country flag stands in for it — nothing substituted. */
    return '<div class="hb-field hb-textfield hb-phonefield"' + (o.error ? ' data-state="error"' : '') + '>' +
      '<label class="hb-field__label" for="' + o.id + '">' + o.label + ' <span class="hb-field__req">*</span></label>' +
      '<div class="hb-field__control">' +
        '<button type="button" class="hb-phone__country" aria-label="Country code"><span class="hb-phone__flag" aria-hidden="true"></span><span class="hb-phone__key">+973</span></button>' +
        '<span class="hb-phone__sep"></span>' +
        '<input class="hb-field__input num" id="' + o.id + '" type="tel" value="' + esc(o.value) + '" inputmode="tel" autocomplete="tel-national">' +
      '</div>' + (o.error ? '<div class="hb-field__msg">' + I.error + '<span>' + esc(o.error) + '</span></div>' : '') + '</div>';
  }
  function pin(n){
    if (!PIN[n]) { return ''; }
    return '<button type="button" class="pin" aria-label="Design note ' + n + '">' + n +
      '<span class="pin__tip">' + PIN[n] + '</span></button>';
  }
  var PIN = {
    1:'<b>Validate before, not after</b>On the live site the stock and minimum checks run when "Place order" is pressed — after the buyer has edited an address and uploaded documents — and fail with a toast that sends them back to the cart. Here the checks run on entry and again on submit, and a change is resolved in place.',
    2:'<b>Edit in place, safely</b>Same section, same fields. Edit Address swaps the saved values for Select, Text Field and Phone Field molecules with required marks and inline errors; Cancel restores, Update Address validates. The map pin is visible in the saved state too — the banner finally points at something.',
    3:'<b>Values are text, not orange</b>The live page renders every saved value in secondary/600 — decoration that reads as links and measures 2.25:1 on white. Values here are on-surface, labels on-surface-variant.',
    4:'<b>Same three documents, with memory</b>A document already on file shows as a card — name, size, date, Preview / Replace / Remove — instead of an empty box. Empty zones say Required or Optional and what they accept. Ticking "Have VAT certificate" reveals the tax number and its zone, as on the live page.',
    5:'<b>A preview is a thumbnail</b>The live Personal ID document renders whatever was chosen at full width — including a personal photo. Here it is a 64 px thumbnail with the file name and size; Preview opens it in a Drawer. A wrong type or a file over 10 MB is refused in the zone itself, not by a toast.',
    6:'<b>The chosen payment method is visible</b>The buyer picked Highbase Payment on the review page and the verification page never mentions it. The choice is shown here, with what it means — transfer within 48 h, receipt upload — so nothing is a surprise on the next screen.',
    7:'<b>Commit with the summary in view</b>The live Place Order is a small button under a full-width image, with no total next to it. The summary rail is sticky, carries the three readiness checks, and Place Order refuses while an edit is still open or a required document is missing.',
    8:'<b>A purchase order number is a B2B field</b>The person who orders is rarely the person who pays. A PO number and an invoice recipient give finance what they need to reconcile the transfer.',
    9:'<b>One status, stated plainly</b>"Thank you, your order has been placed successfully" next to "Complete your payment" says two things. The order is received and awaiting a transfer; the timeline shows exactly where it stands and what unblocks the next step.',
    10:'<b>A payment reference</b>The live page gives an IBAN and an amount but never says what to write on the transfer. The order number is the reference — without it, finance reconciles by amount and date.',
    11:'<b>The receipt uploads here</b>"Click on Track Your Order to upload the transaction receipt" sends the buyer to a dashboard modal with "Skip for now". The upload lives on this page, and submitting it moves the timeline.',
    12:'<b>Built for the person who pays</b>Copy all details, download the instructions as a PDF, send them to finance — the buyer is usually not the accountant. A deadline keeps the reservation honest: stock is held for 48 hours.',
    13:'<b>Primary means primary</b>Two filled buttons ("Track Your Order", "Go To Marketplace") in two greens compete. One primary action per state: upload the receipt, then track.'
  };

  /* ============================================================
     Snackbar host and the Drawer / Confirmation Dialog layers
     ============================================================ */
  var toastHost = document.createElement("div");
  toastHost.id = "toasts";
  document.body.appendChild(toastHost);

  function toast(msg, opts){
    opts = opts || {};
    var status = opts.kind === "ok" ? "success" : opts.kind === "bad" ? "error" : "info";
    var el = document.createElement("div");
    el.className = "hb-alert hb-snackbar";
    el.setAttribute("data-status", status);
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span class="hb-alert__icon">' + ALERT_ICON[status] + '</span>' +
      '<span class="hb-snackbar__group"><span class="hb-alert__text">' + esc(msg) + '</span></span>' +
      (opts.action ? '<span class="hb-alert__actions">' +
        btn(esc(opts.action), { intent: status === "error" ? "danger" : "primary", style:"tonal", size:"sm", attrs:' data-toast-action' }) +
        '</span>' : '');
    if (opts.action) {
      el.querySelector("[data-toast-action]").addEventListener("click", function(){ el.remove(); opts.onAction(); });
    }
    toastHost.appendChild(el);
    while (toastHost.children.length > 3) { toastHost.firstChild.remove(); }
    setTimeout(function(){ el.remove(); }, opts.ms || 5200);
  }

  /* The Drawer is the system's home for anything with fields, a summary or an upload. */
  var dlg = document.createElement("dialog");
  dlg.className = "hb-drawer-layer";
  document.body.appendChild(dlg);

  function drawer(title, bodyHTML, footHTML, size){
    dlg.innerHTML =
      '<div class="hb-drawer" data-side="end" data-size="' + (size || "md") + '">' +
        '<form method="dialog" class="hb-drawer__close">' +
          iconBtn(I.close, "Close", { style:"filled", size:"md", type:"submit", attrs:' value="close"' }) +
        '</form>' +
        '<div class="hb-drawer__panel">' +
          '<div class="hb-dlg-header"><h2 class="hb-dlg-header__title hb-title-lg">' + esc(title) + '</h2></div>' +
          '<div class="hb-drawer__body">' + bodyHTML + '</div>' +
          (footHTML ? '<div class="hb-dlg-actions">' + footHTML + '</div>' : '') +
        '</div>' +
      '</div>';
    if (!dlg.open) { dlg.showModal(); }
    return dlg;
  }
  function closeDrawer(){ if (dlg.open) { dlg.close(); } }
  dlg.addEventListener("click", function(e){ if (e.target === dlg) { closeDrawer(); } });

  /* The Confirmation Dialog: one question, two answers. Intent drives icon tone and button colour. */
  var cdlg = document.createElement("dialog");
  cdlg.className = "proto-confirm";
  document.body.appendChild(cdlg);
  function confirmDialog(o){
    cdlg.innerHTML =
      '<div class="hb-confirm" data-intent="' + (o.intent || 'neutral') + '" role="alertdialog" aria-labelledby="cd-title">' +
        '<div class="hb-confirm__head">' +
          '<span class="hb-confirm__icon">' + (o.icon || I.warning) + '</span>' +
          '<div class="hb-confirm__lines"><div class="hb-confirm__title" id="cd-title">' + o.title + '</div>' +
          '<div class="hb-confirm__body">' + o.body + '</div></div>' +
        '</div>' +
        (o.extra || '') +
        '<div class="hb-dlg-actions">' + o.actions + '</div>' +
      '</div>';
    if (!cdlg.open) { cdlg.showModal(); }
    return cdlg;
  }
  function closeConfirm(){ if (cdlg.open) { cdlg.close(); } }

  function copyText(el, text){
    var done = function(){ toast("Copied " + text, { kind: "ok", ms: 2200 }); if (el) { el.setAttribute("data-copied", "true"); setTimeout(function(){ el.removeAttribute("data-copied"); }, 1600); } };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { done(); }
  }
