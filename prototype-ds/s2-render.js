
  /* ============================================================
     Icons — the Highbase accessor's output, one literal per key so the
     build's spriteFor() injects exactly the symbols this page references.
     ============================================================ */
  var I = {
    add:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-add"/></svg>',
    minus:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-minus"/></svg>',
    del:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-delete"/></svg>',
    close:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-close"/></svg>',
    success:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-success"/></svg>',
    warning:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-warning"/></svg>',
    error:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-error"/></svg>',
    info:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-info"/></svg>',
    store:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-store"/></svg>',
    truck:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-truck"/></svg>',
    pkg:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-package"/></svg>',
    location:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-location"/></svg>',
    invoice:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-invoice"/></svg>',
    file:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-file"/></svg>',
    upload:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-upload"/></svg>',
    copy:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-copy"/></svg>',
    clock:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-clock"/></svg>',
    calendar:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-calendar"/></svg>',
    coupon:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-coupon"/></svg>',
    wallet:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-wallet"/></svg>',
    edit:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-edit"/></svg>',
    save:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-save"/></svg>',
    refresh:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-refresh"/></svg>',
    search:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-search"/></svg>',
    cart:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-cart"/></svg>',
    message:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-message"/></svg>',
    chevronRight:'<svg class="hb-i" aria-hidden="true" data-mirror><use href="#hb-i-chevronRight"/></svg>',
    chevronDown:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-chevronDown"/></svg>',
    print:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-print"/></svg>',
    check:'<svg class="hb-i" aria-hidden="true"><use href="#hb-i-check"/></svg>'
  };
  var ALERT_ICON = { success:I.success, warning:I.warning, error:I.error, info:I.info };

  /* ---------- Component helpers — Highbase markup API ---------- */
  function btn(label, o){
    o = o || {};
    return '<button type="button" class="hb-btn' + (o.block ? ' proto-block' : '') + '"' +
      ' data-intent="' + (o.intent || 'primary') + '" data-style="' + (o.style || 'filled') + '"' +
      ' data-size="' + (o.size || 'md') + '"' + (o.attrs || '') + (o.disabled ? ' disabled' : '') + '>' +
      (o.icon ? '<span class="hb-btn__icon">' + o.icon + '</span>' : '') +
      '<span class="hb-btn__label">' + label + '</span></button>';
  }
  function iconBtn(icon, label, o){
    o = o || {};
    return '<button type="' + (o.type || 'button') + '" class="hb-btn hb-icon-btn" data-intent="' + (o.intent || 'primary') +
      '" data-style="' + (o.style || 'ghost') + '" data-size="' + (o.size || 'sm') + '"' +
      ' aria-label="' + esc(label) + '"' + (o.attrs || '') + (o.disabled ? ' disabled' : '') + '>' +
      '<span class="hb-btn__icon">' + icon + '</span></button>';
  }
  function chip(label, o){
    o = o || {};
    return '<span class="hb-chip' + (o.cls ? ' ' + o.cls : '') + '"' +
      ' data-style="' + (o.style || 'neutral') + '" data-size="' + (o.size || 'sm') + '"' +
      (o.status ? ' data-status="' + o.status + '"' : '') + '>' +
      (o.icon ? '<span class="hb-chip__icon">' + o.icon + '</span>' : '') + label + '</span>';
  }
  var STATUS_ICON = { active:I.success, approved:I.check, completed:I.check,
                      pending:I.warning, cancelled:I.error, expired:I.error };
  function statusChip(status, label){
    return '<span class="hb-status" data-status="' + status + '">' +
      STATUS_ICON[status] + '<span>' + label + '</span></span>';
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
      (label ? '' : ' aria-label="' + esc(id) + '"') + '>' +
      '<span class="hb-check__box"></span>' +
      (label ? '<span class="hb-check__label hb-body-md">' + label + '</span>' : '') + '</label>';
  }
  function radio(name, val, on, title, desc, o){
    o = o || {};
    return '<label class="opt"' + (o.disabled ? ' data-disabled' : '') + '>' +
      '<span class="hb-radio"><input type="radio" class="hb-radio__input" name="' + name + '" value="' + val + '"' +
        (on ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span class="hb-radio__circle"></span></span>' +
      '<span class="opt__main"><span class="opt__title hb-title-sm">' + title + '</span>' +
      (desc ? '<span class="opt__desc hb-body-sm">' + desc + '</span>' : '') +
      (o.extra || '') + '</span>' +
      (o.trailing ? '<span class="opt__price hb-title-sm">' + o.trailing + '</span>' : '') + '</label>';
  }
  /* Add to Cart, used as the line quantity control. It is a state machine:
     stepper above 1, stepper-single (minus becomes a delete) at 1. */
  function stepper(ref, qty, max){
    var single = qty <= 1;
    return '<div class="hb-atc" data-state="' + (single ? 'stepper-single' : 'stepper') + '" data-step="' + ref + '">' +
      '<button type="button" class="hb-atc__step" data-dir="-1" aria-label="' + (single ? 'Remove line' : 'Decrease quantity') + '">' +
        (single ? I.del : I.minus) + '</button>' +
      '<input class="hb-atc__value num" type="text" inputmode="numeric" value="' + qty + '" aria-label="Quantity">' +
      '<button type="button" class="hb-atc__step" data-dir="1" aria-label="Increase quantity"' +
        (qty >= max ? ' disabled' : '') + '>' + I.add + '</button></div>';
  }
  function field(o){
    return '<div class="hb-field ' + (o.cls || 'hb-textfield') + '"' + (o.state ? ' data-state="' + o.state + '"' : '') + '>' +
      (o.label ? '<label class="hb-field__label" for="' + o.id + '">' + o.label + '</label>' : '') +
      '<div class="hb-field__control">' +
        (o.lead ? '<span class="hb-field__icon">' + o.lead + '</span>' : '') +
        (o.tag === 'select'
          ? '<select class="hb-field__input" id="' + o.id + '"' + (o.attrs || '') + '>' + o.options + '</select>' +
            '<span class="hb-field__icon">' + I.chevronDown + '</span>'
          : o.tag === 'textarea'
            ? '<textarea class="hb-field__input" id="' + o.id + '" rows="' + (o.rows || 3) + '"' +
              ' placeholder="' + esc(o.placeholder || '') + '"' + (o.attrs || '') + '></textarea>'
            : '<input class="hb-field__input" id="' + o.id + '" type="text" value="' + esc(o.value || '') + '"' +
              ' placeholder="' + esc(o.placeholder || '') + '"' + (o.attrs || '') + '>') +
      '</div>' +
      (o.message ? '<p class="hb-field__msg" id="' + o.id + '-msg">' + o.message + '</p>'
                 : '<p class="hb-field__msg" id="' + o.id + '-msg" hidden></p>') + '</div>';
  }

  /* ---------- Annotation pins (proposal) — review commentary ---------- */
  var PIN = {
    1:'<b>Group by supplier</b>Minimum order, delivery fee, coupons and dispatch are all per supplier on Highbase, so the cart is shaped that way. One flat list forces the buyer to hold that grouping in their head.',
    2:'<b>One minimum-order bar, not twelve</b>Today the same warning repeats on every product card in the group. It is a property of the supplier, so it belongs once on the supplier header — as progress toward a target, with the exact remaining amount.',
    3:'<b>Unit economics</b>A procurement buyer compares cost per piece across pack sizes and suppliers. Showing only "BHD 1.000" next to "18pcs" makes them do that arithmetic themselves, on every line.',
    4:'<b>Resolve the conflict where it happens</b>Today the cart shows "Only 1 item in stock" while the quantity stays at 7 and the total still calculates. State the conflict, block the total, and offer the one-tap fix.',
    5:'<b>No late cost surprises</b>Today subtotal equals total in the cart and a BHD 10.000 delivery fee only appears on the review page. Unexpected shipping cost is the single largest cause of checkout abandonment.',
    6:'<b>Partial checkout</b>One supplier below its minimum should not hold the whole basket hostage. Let the ready supplier ship now and keep the rest in the cart.'
  };
  function pin(n){
    if (!PIN[n]) { return ''; }
    return '<button type="button" class="pin" aria-label="Design note ' + n + '">' + n +
      '<span class="pin__tip">' + PIN[n] + '</span></button>';
  }

  /* ============================================================
     Cart — supplier groups, each a Data Table of lines
     ============================================================ */
  function renderCart(){
    var host = $("#screen-cart");
    var totalItems = state.suppliers.reduce(function(n,s){ return n + s.items.length; }, 0);
    var live = state.suppliers.filter(function(s){ return s.items.length; });
    var anySel = state.suppliers.some(function(s){ return s.items.some(function(i){ return i.sel; }); });
    var allSel = live.length && live.every(function(s){ return s.items.every(function(i){ return i.sel; }); });

    var head =
      '<div class="hb-pagehead">' +
        '<div class="hb-pagehead__row">' +
          '<h1 class="hb-pagehead__title hb-headline-md" data-ar="سلة المشتريات">Your cart</h1>' +
        '</div>' +
        '<p class="hb-pagehead__desc hb-body-md">' + (totalItems
          ? '<span class="num">' + totalItems + '</span> item' + (totalItems===1?'':'s') +
            ' from <span class="num">' + live.length + '</span> supplier' + (live.length===1?'':'s') +
            ' · Prices exclude VAT'
          : 'Nothing here yet.') + '</p>' +
      '</div>';

    if (!totalItems) {
      host.innerHTML = head +
        '<div class="panel"><div class="hb-empty">' +
          '<h2 class="hb-empty__title hb-headline-sm">Your cart is empty</h2>' +
          '<p class="hb-empty__text hb-body-md">Add items from a supplier to start an order.</p>' +
          '<div class="hb-empty__actions">' + btn("Reload the example basket", { attrs:' data-act="restock-demo"' }) + '</div>' +
        '</div></div>';
      $("#hdr-cart").textContent = "0";
      return;
    }

    var toolbar =
      '<div class="panel" style="margin-bottom:var(--hb-space-16)"><div class="panel__head">' +
        check("Select all", allSel, "Select all", ' id="sel-all"' + (anySel && !allSel ? ' data-indeterminate' : '')) +
        btn("Remove selected", { intent:"danger", style:"ghost", size:"sm", icon:I.del, attrs:' data-act="remove-selected"' }) +
        btn("Save as list", { style:"ghost", size:"sm", icon:I.save, attrs:' data-act="save-list"' }) +
        '<div class="spacer"></div>' +
        btn("Quick add by SKU", { style:"outlined", size:"sm", icon:I.search, attrs:' data-act="quick-add"' }) +
        pin(7) +
      '</div></div>';

    var groups = live.map(function(sup, si){
      var sub = supplierSubtotal(sup), ready = supplierReady(sup);
      var gap = Math.max(0, sup.moq - sub), pct = Math.min(100, sub / sup.moq * 100);
      var allSup = sup.items.every(function(i){ return i.sel; });
      var freeGap = Math.max(0, sup.freeOver - sub), del = supplierDelivery(sup);

      var moqBlock = ready
        ? alert("success",
            '<span class="hb-alert__title">Minimum order met</span>' +
            '<span class="hb-alert__text"><span class="num">' + bhd(sub) + '</span> of <span class="num">' + bhd(sup.moq) + '</span>' +
            (freeGap > 0 ? ' · add <span class="num">' + bhd(freeGap) + '</span> more for free delivery' : ' · free delivery unlocked') + '</span>',
            { actions: (si===0?pin(2):'') + btn("Browse", { style:"ghost", size:"sm", attrs:' data-act="browse" data-sup="' + sup.id + '"' }) })
        : alert("warning",
            '<span class="hb-alert__title"><span class="num">' + bhd(gap) + '</span> below this supplier\'s minimum order</span>' +
            '<span class="hb-alert__text"><span class="num">' + bhd(sub) + '</span> of <span class="num">' + bhd(sup.moq) + '</span> · you can still order from the others</span>',
            { actions: btn("Add items", { size:"sm", attrs:' data-act="browse" data-sup="' + sup.id + '"' }) +
                       btn("Move to a list", { style:"ghost", size:"sm", attrs:' data-act="move-list" data-sup="' + sup.id + '"' }) });

      var rows = sup.items.map(function(it, ii){
        var bad = conflicted(it), lt = lineTotal(it);
        var ref = sup.id + ':' + it.sku;
        var stock = bad ? statusChip("cancelled", "Only " + it.stock + " left")
                  : (it.stock - it.qty <= 25) ? statusChip("pending", "Low stock · " + it.stock)
                  : statusChip("active", "In stock");
        var main = '<tr>' +
          '<td data-select>' + check(it.name, it.sel, "", ' data-item-sel="' + ref + '"') + '</td>' +
          '<td><div class="hb-cell-media">' +
            '<span class="hb-cell-thumb">' + I.pkg + '</span>' +
            '<span style="min-width:0"><span class="hb-title-sm">' + esc(it.name) + '</span>' +
            '<span class="hb-cell-sub hb-body-sm">SKU ' + it.sku + ' · ' + stock +
            (state.notify[it.sku] ? ' ' + chip("Restock alert on", { style:"tonal" }) : '') + '</span></span>' +
          '</div></td>' +
          '<td><span class="hb-body-md">' +
            (it.per>1 ? 'Case of <span class="num">' + it.per + '</span>' : 'Single · <span class="num">' + it.unitLabel + '</span>') + '</span>' +
            '<span class="hb-cell-sub hb-body-sm"><span class="num">' + bhd(it.price) + '</span> / ' + (it.per>1?'case':'unit') +
            (it.per>1 ? '<br><span class="num">' + bhd(it.price/it.per) + '</span> / piece' : '') +
            (si===0 && ii===0 ? pin(3) : '') + '</span></td>' +
          '<td>' + stepper(ref, it.qty, it.stock) +
            (it.per>1 ? '<span class="hb-cell-sub hb-body-sm"><span class="num">' + pieces(it) + '</span> pieces</span>' : '') + '</td>' +
          '<td data-numeric class="end"><span class="hb-title-sm">' + (lt===null ? '—' : bhd(lt)) + '</span></td>' +
          '<td data-actions>' + iconBtn(I.del, "Remove " + it.name, { intent:"danger", attrs:' data-act="remove" data-ref="' + ref + '"' }) + '</td>' +
        '</tr>';
        // A stock conflict is a row of its own spanning the table, so the alert
        // gets full width instead of being squeezed into the product cell.
        var conflictRow = bad
          ? '<tr data-alert><td colspan="6">' + alert("error",
              '<span class="hb-alert__text">You asked for <span class="num">' + it.qty + '</span> ' +
              (it.per>1?'cases':'units') + ' — the supplier has <span class="num">' + it.stock + '</span>.</span>',
              { actions: btn("Reduce to " + it.stock, { intent:"danger", style:"tonal", size:"sm",
                            attrs:' data-act="clamp" data-ref="' + ref + '"' }) +
                  btn(state.notify[it.sku] ? "Alert on" : "Notify me",
                      { intent:"danger", style:"ghost", size:"sm", attrs:' data-act="notify" data-ref="' + ref + '"' }) +
                  pin(4) }) + '</td></tr>'
          : '';
        return main + conflictRow;
      }).join("");

      return '<section class="panel supplier" style="margin-bottom:var(--hb-space-16)">' +
        '<div class="supplier__head">' +
          check("Select all from " + sup.name, allSup, "", ' data-sup-sel="' + sup.id + '"') +
          '<span class="supplier__logo"' + (si ? ' data-tone="alt"' : '') + '>' + I.store + '</span>' +
          '<span class="supplier__id">' +
            '<span class="supplier__name"><span class="hb-title-md">' + esc(sup.name) + '</span>' +
            statusChip("approved", "Verified supplier") + (si===0 ? pin(1) : '') + '</span>' +
            '<span class="opt__desc hb-body-sm">' + esc(sup.meta) + '</span></span>' +
          (ready ? statusChip("active", "Ready to order") : statusChip("pending", "Not ready")) +
        '</div>' +
        '<div class="moq">' + moqBlock +
          '<div class="moq__track"><div class="moq__fill" data-met="' + ready + '" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="hb-table-wrap"><div class="hb-table-scroll">' +
          '<table class="hb-table cart-table">' +
          '<colgroup><col class="c-sel"><col><col class="c-pack"><col class="c-qty"><col class="c-total"><col class="c-act"></colgroup>' +
          '<thead><tr><th data-select><span class="sr">Select</span></th><th>Product</th><th>Pack &amp; unit price</th>' +
          '<th>Quantity</th><th class="end">Line total</th><th data-actions><span class="sr">Actions</span></th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>' +
        '</div></div>' +
        '<div class="panel__foot row-end">' +
          '<span class="hb-body-md muted">Supplier subtotal</span>' +
          '<span class="hb-title-md num">' + bhd(sub) + '</span>' +
          (ready ? chip('Delivery ' + (del ? bhd(del) : 'free'), { style:"neutral" }) +
                   (sup.coupon ? chip(sup.coupon.code + ' · −' + bhd(sup.coupon.off), { style:"tonal", icon:I.coupon }) : '') : '') +
          '<div class="spacer"></div>' +
          (ready ? statusChip("active", "Ready to order") : statusChip("cancelled", "Excluded from this order")) +
        '</div>' +
      '</section>';
    }).join("");

    host.innerHTML = head +
      '<div class="cols"><div>' + toolbar + groups + '</div>' +
      '<aside class="rail" aria-label="Order summary"><div class="panel">' +
        '<div class="panel__head"><h2 class="hb-title-md" data-ar="ملخص الطلب">Order summary</h2>' + pin(5) + '</div>' +
        '<div class="panel__body" id="cart-summary"></div>' +
      '</div></aside></div>' +
      '<div class="commit-bar"><div><span class="hb-body-sm muted">Total incl. VAT</span>' +
        '<span class="hb-title-md num" id="mb-cart-total">' + bhd(totals().total) + '</span></div>' +
        btn("Checkout", { size:"lg", attrs:' data-act="to-checkout"' }) + '</div>';
    $("#hdr-cart").textContent = String(totalItems);
  }

  function sumRows(t){
    var out = '';
    t.ready.forEach(function(sup){
      var d = supplierDelivery(sup);
      out += '<div class="sum__row hb-body-md"><dt>Delivery — ' + esc(sup.name) + '</dt><dd class="num">' + (d ? bhd(d) : 'Free') + '</dd></div>';
    });
    return out;
  }

  function renderCartSummary(){
    var host = $("#cart-summary");
    if (!host) { return; }
    var t = totals();
    var notReady = state.suppliers.filter(function(s){ return s.items.length && !supplierReady(s); });
    var applied = '';
    state.applied.forEach(function(c){
      applied += alert("success", '<span class="hb-alert__text">' + c.code + ' — ' + esc(c.label) + ' · −<span class="num">' + bhd(c.off) + '</span></span>',
        { actions: iconBtn(I.close, "Remove coupon " + c.code, { attrs:' data-act="uncoupon" data-code="' + c.code + '"' }) });
    });
    t.ready.forEach(function(sup){
      if (sup.coupon) {
        applied += alert("success", '<span class="hb-alert__text">' + sup.coupon.code + ' — ' + sup.coupon.label + ' · −<span class="num">' + bhd(sup.coupon.off) + '</span></span>');
      }
    });

    var couponField =
      '<div class="row-end" style="gap:var(--hb-space-8);align-items:flex-end;margin-top:var(--hb-space-12)">' +
        '<div style="flex:1;min-width:0">' + field({ id:"cpn", label:"Coupon code", placeholder:"Add coupon code", lead:I.coupon, attrs:' autocomplete="off"' }) + '</div>' +
        btn("Apply", { style:"outlined", attrs:' data-act="coupon"' }) +
      '</div>';

    if (!t.ready.length) {
      host.innerHTML = applied + couponField +
        '<hr class="hb-divider" style="margin:var(--hb-space-16) 0">' +
        alert("warning", '<span class="hb-alert__text">No supplier is ready to order yet. Reach a minimum order, or resolve a stock conflict, to check out.</span>');
      var mb0 = $("#mb-cart-total"); if (mb0) { mb0.textContent = bhd(0); }
      return;
    }

    host.innerHTML = applied + couponField +
      '<hr class="hb-divider" style="margin:var(--hb-space-16) 0">' +
      '<dl class="sum">' +
        '<div class="sum__row hb-body-md"><dt>Items (<span class="num">' + t.lines + '</span> lines)</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
        sumRows(t) +
        (t.slotFee ? '<div class="sum__row hb-body-md"><dt>Evening delivery window</dt><dd class="num">' + bhd(t.slotFee) + '</dd></div>' : '') +
        (t.discount ? '<div class="sum__row hb-body-md" data-save><dt>Discounts</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
        '<div class="sum__row hb-body-md"><dt>VAT <span class="num">10%</span></dt><dd class="num">' + bhd(t.vat) + '</dd></div>' +
        '<hr class="hb-divider">' +
        '<div class="sum__total"><dt class="hb-title-md" data-ar="الإجمالي">Total</dt>' +
          '<dd><span class="hb-headline-sm num">' + bhd(t.total) + '</span>' +
          '<span class="opt__desc hb-body-sm">VAT reclaimable · CR 5056050560-1</span></dd></div>' +
      '</dl>' +
      '<div style="margin-top:var(--hb-space-16)">' +
        btn('Checkout · <span class="num">' + bhd(t.total) + '</span>', { size:"lg", block:true, icon:I.cart, attrs:' data-act="to-checkout"' }) +
        '<p class="opt__desc hb-body-sm" style="text-align:center;margin-top:var(--hb-space-8)">' +
          t.ready.map(function(s){ return esc(s.name); }).join(" and ") + ' only.' +
          (notReady.length ? ' ' + esc(notReady[0].name) + ' stays in your cart.' + pin(6) : '') + '</p>' +
      '</div>' +
      '<div class="trust hb-body-sm">' +
        ['Bank transfer, card or Net 30 terms','Tax invoice issued on dispatch','Damaged goods returnable for 48h']
          .map(function(x){ return '<div>' + I.success + '<span>' + x + '</span></div>'; }).join("") +
      '</div>';
    var mb = $("#mb-cart-total"); if (mb) { mb.textContent = bhd(t.total); }
  }

  /* ============================================================
     Checkout
     ============================================================ */
  function renderCheckout(){
    var host = $("#screen-checkout");
    var t = totals(), c = state.checkout;
    var day = state.days[c.day], win = state.times[c.time];

    var steps =
      '<div class="panel" style="margin-bottom:var(--hb-space-20)"><div class="panel__head steps">' +
        '<span class="step hb-label-lg" data-state="done"><span class="step__no">' + I.check + '</span> Cart</span>' +
        '<span class="step__bar"></span>' +
        '<span class="step hb-label-lg" data-state="now"><span class="step__no num">2</span> Delivery &amp; purchase details</span>' +
        '<span class="step__bar"></span>' +
        '<span class="step hb-label-lg"><span class="step__no num">3</span> Payment</span>' +
        '<div class="spacer"></div>' + pin(8) +
      '</div></div>';

    var verify =
      '<div style="margin-bottom:var(--hb-space-20)">' +
      alert("success",
        '<span class="hb-alert__title">Business verified — nothing to upload</span>' +
        '<span class="hb-alert__text">CR <span class="num">5056050560-1</span> · VAT <span class="num">220012345600002</span> · verified <span class="num">14 Mar 2026</span>, valid to <span class="num">31 Dec 2026</span></span>',
        { kind:"hb-banner", actions: btn("Manage documents", { style:"ghost", size:"sm", attrs:' data-act="manage-docs"' }) + pin(9) }) +
      '</div>';

    var addresses = state.addresses.map(function(a){
      var on = a.id === c.addr;
      return radio("addr", a.id, on,
        esc(a.name) + (a.def ? ' ' + chip("Default", { style:"tonal" }) : ''),
        esc(a.line) + '<br>' + esc(a.contact),
        { extra: on
          ? '<span class="row-end" style="margin-top:var(--hb-space-12)">' +
              '<span class="map" style="flex:1;min-width:220px">' + I.location +
              '<span class="map__label hb-body-sm">Pin saved · <span class="num">' + a.lat.toFixed(4) + ', ' + a.lng.toFixed(4) + '</span></span></span>' +
              btn("Adjust pin", { style:"outlined", size:"sm", icon:I.edit, attrs:' data-act="pin" data-ref="' + a.id + '"' }) +
            '</span>' +
            '<span class="opt__desc hb-body-sm">Drivers use the pin, not the typed address.</span>'
          : '' });
    }).join("");

    var shipments = t.ready.length
      ? t.ready.map(function(sup,i){
          var n = sup.items.filter(function(it){ return it.sel; }).length;
          return '<div class="shipment hb-body-md">' + chip('Shipment ' + (i+1) + ' of ' + t.ready.length, { style:"tonal", icon:I.pkg }) +
            '<span>' + esc(sup.name) + ' · <span class="num">' + n + '</span> lines</span>' +
            '<span class="spacer muted">Dispatched from ' + esc(sup.from) + '</span></div>';
        }).join("")
      : alert("warning", '<span class="hb-alert__text">No shipments — nothing is ready to order.</span>');

    var dayChips = state.days.map(function(d,i){
      if (d.full) {
        return '<span class="slot-full hb-label-lg">' + d.lab + ' ' + statusChip("pending", "No capacity") + '</span>';
      }
      return btn(d.lab + ' <span class="num">' + d.date + '</span>',
        { style: i===c.day ? "tonal" : "outlined", size:"md", attrs:' data-day="' + i + '" aria-pressed="' + (i===c.day) + '"' });
    }).join("");
    var timeChips = state.times.map(function(w,i){
      return btn('<span class="num">' + w.lab + '</span> · ' + w.note,
        { style: i===c.time ? "tonal" : "outlined", size:"md", attrs:' data-time="' + i + '" aria-pressed="' + (i===c.time) + '"' });
    }).join("");

    var summary = !t.ready.length
      ? alert("warning", '<span class="hb-alert__text">Nothing is ready to order.</span>',
          { actions: btn("Back to cart", { style:"ghost", size:"sm", attrs:' data-goto="cart"' }) })
      : '<dl class="sum">' +
          t.ready.map(function(sup){
            return '<div class="sum__row hb-title-sm"><dt class="strong">' + esc(sup.name) + '</dt></div>' +
              sup.items.filter(function(it){ return it.sel; }).map(function(it){
                return '<div class="sum__row hb-body-sm" data-sub><dt>' + esc(short(it.name)) + ' × <span class="num">' + it.qty + '</span>' +
                  (it.per>1?' cases':'') + '</dt><dd class="num">' + bhd(it.qty*it.price) + '</dd></div>';
              }).join("");
          }).join("") +
          '<hr class="hb-divider">' +
          '<div class="sum__row hb-body-md"><dt>Items subtotal</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
          '<div class="sum__row hb-body-md"><dt>Delivery · ' + day.lab + ' <span class="num">' + day.date + '</span>, <span class="num">' + win.lab + '</span></dt>' +
            '<dd class="num">' + bhd(t.delivery + t.slotFee) + '</dd></div>' +
          (t.discount ? '<div class="sum__row hb-body-md" data-save><dt>Discounts</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
          '<div class="sum__row hb-body-md"><dt>VAT <span class="num">10%</span></dt><dd class="num">' + bhd(t.vat) + '</dd></div>' +
          '<hr class="hb-divider">' +
          '<div class="sum__total"><dt class="hb-title-md" data-ar="الإجمالي">Total due' + pin(14) + '</dt>' +
            '<dd><span class="hb-headline-sm num">' + bhd(t.total) + '</span>' +
            '<span class="opt__desc hb-body-sm">Includes <span class="num">' + bhd(t.vat) + '</span> reclaimable VAT</span></dd></div>' +
        '</dl>' +
        '<div style="margin-top:var(--hb-space-16)">' +
          btn('Place order · <span class="num">' + bhd(t.total) + '</span>', { size:"lg", block:true, icon:I.wallet, attrs:' data-act="place-order"' }) +
          '<p class="opt__desc hb-body-sm" style="text-align:center;margin-top:var(--hb-space-8)">Cancellable free until dispatch.</p>' +
        '</div>';

    host.innerHTML =
      '<div class="hb-pagehead"><div class="hb-pagehead__row"><h1 class="hb-pagehead__title hb-headline-md" data-ar="إتمام الطلب">Checkout</h1></div>' +
        '<p class="hb-pagehead__desc hb-body-md">' + (t.ready.length
          ? t.ready.map(function(s){ return esc(s.name); }).join(" · ") + ' · <span class="num">' + t.lines + '</span> lines · <span class="num">' + t.pieces + '</span> pieces'
          : 'Nothing is ready to order.') + '</p></div>' +
      steps + verify +
      '<div class="cols"><div>' +
        '<section class="panel"><div class="panel__head"><h2 class="hb-title-md" data-ar="عنوان التوصيل">Deliver to</h2>' +
          '<div class="spacer"></div>' + btn("Change branch", { style:"ghost", size:"sm", attrs:' data-act="change-branch"' }) + '</div>' +
          '<div class="panel__body">' + addresses +
          btn("Deliver to a new address", { style:"ghost", size:"sm", icon:I.add, attrs:' data-act="add-address"' }) + '</div></section>' +
        '<section class="panel"><div class="panel__head"><h2 class="hb-title-md" data-ar="موعد التوصيل">Delivery window</h2>' + pin(11) + '</div>' +
          '<div class="panel__body">' + shipments +
            '<p class="hb-field__label" style="margin-top:var(--hb-space-16)">Choose a delivery day</p>' +
            '<div class="slots">' + dayChips + '</div>' +
            '<p class="hb-field__label" style="margin-top:var(--hb-space-16)">Time window</p>' +
            '<div class="slots">' + timeChips + '</div></div></section>' +
        '<section class="panel"><div class="panel__head"><h2 class="hb-title-md" data-ar="بيانات الشراء">Purchase details</h2>' +
          chip("Optional", { style:"neutral" }) + pin(12) + '</div>' +
          '<div class="panel__body">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--hb-space-16)">' +
              field({ id:"po", label:"Purchase order number", value:c.po, placeholder:"e.g. PO-2026-0914", attrs:' data-bind="po"', message:"Printed on the tax invoice" }) +
              field({ id:"cc", label:"Cost centre", tag:"select", cls:"hb-select", attrs:' data-bind="costCentre"',
                options: ["Manama branch — F&amp;B","Muharraq warehouse — Stock","Head office — Admin"]
                  .map(function(o){ return '<option' + (o.replace(/&amp;/g,'&')===c.costCentre ? ' selected' : '') + '>' + o + '</option>'; }).join("") }) +
            '</div>' +
            field({ id:"notes", label:"Delivery instructions", tag:"textarea", cls:"hb-textarea", rows:2,
                    placeholder:"Gate code, receiving contact, pallet requirements…", attrs:' data-bind="notes"' }) +
            check("invoice", c.invoiceEmail, "Email the tax invoice to accounts@buyerbahrain.com", ' id="inv-email" data-bind="invoiceEmail"') +
          '</div></section>' +
        '<section class="panel"><div class="panel__head"><h2 class="hb-title-md" data-ar="طريقة الدفع">Payment method</h2></div>' +
          '<div class="panel__body">' +
            radio("pay","transfer",c.payment==="transfer","Bank transfer " + chip("No fee", { style:"tonal" }),
              "Transfer to Highbase and upload the receipt. Stock is reserved for <span class=\"num\">48</span> hours.") +
            radio("pay","card",c.payment==="card","Debit or credit card","Benefit Pay, Visa, Mastercard · charged on dispatch",{ trailing:'<span class="num">+2.5%</span>' }) +
            radio("pay","net30",false,'Net <span class="num">30</span> credit terms ' + chip("Not enabled", { style:"neutral" }),
              'Pay <span class="num">30</span> days after delivery. Requires a credit check.',
              { disabled:true, extra: pin(13) }) +
          '</div></section>' +
      '</div>' +
      '<aside class="rail" aria-label="Order summary"><div class="panel">' +
        '<div class="panel__head"><h2 class="hb-title-md" data-ar="ملخص الطلب">Order summary</h2>' +
        '<div class="spacer"></div>' + btn("Edit cart", { style:"ghost", size:"sm", attrs:' data-goto="cart"' }) + pin(10) + '</div>' +
        '<div class="panel__body">' + summary + '</div>' +
      '</div></aside></div>' +
      '<div class="commit-bar"><div><span class="hb-body-sm muted">Total due</span>' +
        '<span class="hb-title-md num">' + bhd(t.total) + '</span></div>' +
        btn("Place order", { size:"lg", attrs:' data-act="place-order"' }) + '</div>';
  }

  /* ============================================================
     Confirmation
     ============================================================ */
  function copyRow(label, shown, copy){
    return '<div class="copyrow hb-body-md"><dt>' + label + '</dt><dd class="num">' + esc(shown) + '</dd>' +
      btn("Copy", { style:"ghost", size:"sm", icon:I.copy, attrs:' data-copy="' + esc(copy) + '"' }) + '</div>';
  }
  function docRow(f, removable){
    return '<div class="doc">' +
      '<span class="doc__prev">' + (f.isImage ? I.file : I.invoice) + '</span>' +
      '<span style="min-width:0"><span class="hb-title-sm" style="word-break:break-all">' + esc(f.name) + '</span>' +
      '<span class="opt__desc hb-body-sm"><span class="num">' + f.size + '</span> · uploaded <span class="num">' + f.at + '</span></span></span>' +
      '<div class="spacer"></div>' +
      btn("Preview", { style:"ghost", size:"sm", attrs:' data-act="preview"' }) +
      (removable ? iconBtn(I.close, "Remove receipt", { intent:"danger", attrs:' data-act="drop-receipt"' }) : '') +
      pin(18) + '</div>';
  }

  function renderConfirm(){
    var o = state.order;
    if (!o) { return; }
    var host = $("#screen-confirm");
    var day = state.days[o.day], win = state.times[o.time];
    var rest = state.suppliers.filter(function(s){ return s.items.length && !supplierReady(s); });

    var payBody, payFoot, payTitle, countdown = '';
    if (o.payment === "card") {
      payTitle = "Payment authorised";
      payBody = alert("success", '<span class="hb-alert__text">Card charged on dispatch — nothing further to do. ' +
        'Card ending <span class="num">4242</span> · <span class="num">' + bhd(o.total) + '</span> authorised.</span>');
      payFoot = btn("View proforma invoice", { style:"outlined", icon:I.invoice, attrs:' data-act="proforma"' });
    } else if (o.paid) {
      payTitle = "Payment received";
      payBody = alert("success", '<span class="hb-alert__text">Receipt submitted at <span class="num">' + o.paidAt +
        '</span>. We are matching it against ' + o.ref + ' — usually within one working hour.</span>') +
        (o.receipt ? '<p class="hb-field__label" style="margin-top:var(--hb-space-16)">Submitted</p>' + docRow(o.receipt, false) : '');
      payFoot = '<span class="hb-body-sm muted">The supplier confirms and picks as soon as the payment clears.</span>';
    } else {
      payTitle = "Complete your payment";
      countdown = '<span class="hb-chip" data-style="neutral" data-size="md" id="countdown">' + I.clock +
        '<span class="num">48:00:00</span> left</span>' + pin(17);
      payBody =
        '<p class="hb-body-md" style="margin:0 0 var(--hb-space-16)">Transfer <b class="num">' + bhd(o.total) +
          '</b> to the Highbase account below, then upload the receipt here. Your stock stays reserved until <b>' + o.expiry + '</b>.</p>' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:var(--hb-space-20)"><div>' +
          '<div class="amount-due"><span class="hb-label-md">Amount to transfer</span>' +
          '<span class="hb-headline-md num" style="display:block">' + bhd(o.total) + '</span></div>' +
          '<dl style="margin:0">' +
            copyRow("Account name","HIGHBASE TRADING W.L.L.","HIGHBASE TRADING WLL") +
            copyRow("IBAN","BH29 ALSA 0016 5212 1001 01","BH29ALSA00165212100101") +
            copyRow("SWIFT","ALSABHBM","ALSABHBM") +
            copyRow("Reference",o.ref,o.ref) +
          '</dl>' +
          '<p class="opt__desc hb-body-sm">Put the order number in the transfer reference — it is how we match your payment automatically.</p>' +
        '</div>' +
        '<div class="qr"><div class="qr__code" id="qr" role="img" aria-label="Payment QR code for order ' + o.ref + '"></div>' +
          '<p class="opt__desc hb-body-sm" style="text-align:center">Scan in your bank app</p></div></div>' +
        '<hr class="hb-divider" style="margin:var(--hb-space-20) 0">' +
        '<h3 class="hb-title-md">Upload your transfer receipt' + pin(16) + '</h3>' +
        (o.receipt
          ? '<p class="hb-field__label" style="margin-top:var(--hb-space-12)">Attached</p>' + docRow(o.receipt, true)
          : '<div class="hb-upload" data-state="ready" id="drop" style="margin-top:var(--hb-space-12)">' +
              '<span class="hb-upload__icon">' + I.upload + '</span>' +
              '<span class="hb-upload__title hb-title-lg">Drop your receipt here</span>' +
              '<span class="hb-upload__hint hb-body-md">or choose a file from your device</span>' +
              btn("Choose file", { attrs:' data-act="pick"' }) +
              '<span class="hb-upload__max hb-body-sm">PDF, JPG or PNG · up to 10 MB</span></div>');
      payFoot =
        btn("Submit receipt", { icon:I.check, disabled:!o.receipt, attrs:' data-act="submit-receipt"' }) +
        btn("I'll pay later", { style:"outlined", attrs:' data-act="pay-later"' }) +
        '<div class="spacer"></div>' +
        btn("Pay by card instead", { style:"ghost", size:"sm", attrs:' data-act="switch-card"' });
    }

    var stages = [
      { t:"Order placed", d:"Today, " + o.placedAt, s:"done" },
      { t:o.paid ? "Payment submitted" : "Awaiting your payment",
        d:o.paid ? "Receipt uploaded at " + o.paidAt : "Reserved until " + o.expiry, s:o.paid ? "done" : "now" },
      { t:"Supplier confirms &amp; picks", d:'Within <span class="num">4</span> working hours of payment', s:o.paid ? "now" : "" },
      { t:"Out for delivery", d:day.lab + ' <span class="num">' + day.date + '</span>, <span class="num">' + win.lab + '</span> · driver details by SMS', s:"" },
      { t:"Delivered &amp; invoiced", d:"Tax invoice emailed to accounts@buyerbahrain.com", s:"" }
    ];

    host.innerHTML =
      '<div class="hero-ok"><div class="hero-ok__mark">' + I.check + '</div>' +
        '<h1 class="hb-headline-md" data-ar="تم استلام طلبك">Order received</h1>' +
        '<p class="hb-body-lg muted">' + o.groups.map(function(g){ return esc(g.name); }).join(" and ") +
          ' ' + (o.groups.length > 1 ? "are" : "is") + ' preparing <span class="num">' + o.lines +
          '</span> lines for ' + day.lab + ' <span class="num">' + day.date + '</span>, <span class="num">' + win.lab + '</span>.</p>' +
        '<span class="order-ref hb-title-sm">Order <span class="num">' + o.ref + '</span>' +
          btn("Copy", { style:"ghost", size:"sm", icon:I.copy, attrs:' data-copy="' + o.ref + '"' }) + '</span></div>' +
      '<div class="cols" style="margin-top:var(--hb-space-24)"><div>' +
        '<section class="panel"><div class="pay-head"><h2 class="hb-title-md" data-ar="أكمل الدفع">' + payTitle + '</h2>' +
          '<div class="spacer"></div>' + countdown + '</div>' +
          '<div class="panel__body">' + payBody + '</div>' +
          '<div class="panel__foot row-end">' + payFoot + '</div></section>' +
        '<section class="panel"><div class="panel__head"><h2 class="hb-title-md" data-ar="حالة الطلب">Order status</h2>' + pin(19) + '</div>' +
          '<div class="panel__body"><ol class="timeline">' +
            stages.map(function(st,i){
              return '<li' + (st.s ? ' data-state="' + st.s + '"' : '') + '>' +
                '<span class="timeline__dot">' + (st.s==="done" ? I.check : '<span class="hb-body-sm num">' + (i+1) + '</span>') + '</span>' +
                '<div><h4 class="hb-title-sm">' + st.t + '</h4><p class="hb-body-sm">' + st.d + '</p></div></li>';
            }).join("") +
          '</ol></div>' +
          '<div class="panel__foot row-end">' +
            btn("Track order", { style:"outlined", icon:I.truck, attrs:' data-act="track"' }) +
            btn("View proforma invoice", { style:"outlined", icon:I.invoice, attrs:' data-act="proforma"' }) +
            btn("Message supplier", { style:"outlined", icon:I.message, attrs:' data-act="message-supplier"' }) +
          '</div></section>' +
      '</div>' +
      '<aside class="rail" aria-label="Order details"><div class="panel">' +
        '<div class="panel__head"><h2 class="hb-title-md">What you ordered</h2></div>' +
        '<div class="panel__body"><dl class="sum">' +
          o.groups.map(function(g){
            return g.items.map(function(it){
              return '<div class="sum__row hb-body-sm" data-sub><dt>' + esc(short(it.name)) + ' × <span class="num">' + it.qty + '</span>' +
                (it.per>1?' cases':'') + '</dt><dd class="num">' + bhd(it.qty*it.price) + '</dd></div>';
            }).join("");
          }).join("") +
          '<hr class="hb-divider">' +
          '<div class="sum__row hb-body-md"><dt>Delivery</dt><dd class="num">' + bhd(o.delivery) + '</dd></div>' +
          (o.discount ? '<div class="sum__row hb-body-md" data-save><dt>Discounts</dt><dd class="num">−' + bhd(o.discount) + '</dd></div>' : '') +
          '<div class="sum__row hb-body-md"><dt>VAT <span class="num">10%</span></dt><dd class="num">' + bhd(o.vat) + '</dd></div>' +
          (o.po ? '<div class="sum__row hb-body-md"><dt>PO number</dt><dd>' + esc(o.po) + '</dd></div>' : '') +
          '<hr class="hb-divider">' +
          '<div class="sum__total"><dt class="hb-title-md">Total</dt><dd><span class="hb-headline-sm num">' + bhd(o.total) + '</span></dd></div>' +
        '</dl></div>' +
        '<div class="panel__foot">' + (rest.length
          ? '<p class="hb-body-sm muted" style="margin:0 0 var(--hb-space-8)">Still in your cart</p>' +
            rest.map(function(s){
              var gap = Math.max(0, s.moq - supplierSubtotal(s));
              return '<div class="row-end"><span class="supplier__logo" data-tone="alt" style="width:var(--hb-space-28);height:var(--hb-space-28);flex:0 0 var(--hb-space-28)">' + I.store + '</span>' +
                '<span><span class="hb-title-sm">' + esc(s.name) + '</span>' +
                '<span class="opt__desc hb-body-sm"><span class="num">' + bhd(gap) + '</span> below minimum</span></span>' +
                '<div class="spacer"></div>' + btn("Open", { style:"ghost", size:"sm", attrs:' data-goto="cart"' }) + '</div>';
            }).join("")
          : '<p class="hb-body-sm muted" style="margin:0">Your cart is now empty.</p>') + '</div>' +
      '</div>' +
      '<div class="panel"><div class="panel__body row-end" style="align-items:flex-start">' +
        '<span class="supplier__logo">' + I.refresh + '</span>' +
        '<div style="flex:1;min-width:0"><p class="hb-title-sm" style="margin:0">Order this again next week?</p>' +
        '<p class="opt__desc hb-body-sm">Save these <span class="num">' + o.lines + '</span> lines as a recurring basket.</p>' +
        btn("Save as a recurring basket", { style:"outlined", size:"sm", icon:I.save, attrs:' data-act="save-recurring"' }) + '</div>' +
      '</div></div></aside></div>';

    if (o.payment !== "card" && !o.paid) { drawQR(o.ref); wireDrop(); }
  }
