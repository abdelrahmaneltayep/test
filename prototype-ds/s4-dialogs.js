
  /* ============================================================
     Snackbar host and the Drawer used for every dialog
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

  /* The Drawer is the system's home for anything with fields, a summary or an
     upload. Its close button is a flex SIBLING of the panel, not a positioned
     child, so it mirrors in RTL with no left/right value anywhere. */
  var dlg = document.createElement("dialog");
  dlg.className = "hb-drawer-layer";
  document.body.appendChild(dlg);

  function modal(title, bodyHTML, footHTML, size){
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
    delete dlg.dataset.catalog;
    if (!dlg.open) { dlg.showModal(); }
    return dlg;
  }
  function closeModal(){ if (dlg.open) { dlg.close(); } }
  dlg.addEventListener("close", function(){ delete dlg.dataset.catalog; });
  dlg.addEventListener("click", function(e){ if (e.target === dlg) { closeModal(); } });

  /* ---------- Catalogue drawer: closes the minimum-order gap ---------- */
  function catalogBody(sup){
    var sub = supplierSubtotal(sup), gap = Math.max(0, sup.moq - sub);
    return (gap > 0
        ? '<div id="cat-gap">' + alert("warning", '<span class="hb-alert__text">Add <b class="num">' + bhd(gap) +
            '</b> more to reach this supplier\'s minimum — currently <span class="num">' + bhd(sub) + '</span>.</span>') + '</div>'
        : '<div id="cat-gap">' + alert("success", '<span class="hb-alert__text">Minimum order met at <span class="num">' + bhd(sub) +
            '</span>. Anything else ships in the same delivery.</span>') + '</div>') +
      '<div style="margin-top:var(--hb-space-16)">' + state.catalog[sup.id].map(function(c){
        var inCart = sup.items.filter(function(it){ return it.sku === c.sku; })[0];
        var maxed = inCart && inCart.qty >= c.stock;
        return '<div class="hb-li">' +
          '<span class="hb-drawer__thumb">' + I.pkg + '</span>' +
          '<span class="hb-drawer__summary-lines"><span class="hb-drawer__summary-name hb-title-sm">' + esc(c.name) + '</span>' +
          '<span class="opt__desc hb-body-sm">SKU ' + c.sku + ' · ' +
            (c.per > 1 ? 'Case of ' + c.per : 'Single · ' + c.unitLabel) + ' · <span class="num">' + bhd(c.price) + '</span>' +
            (inCart ? ' · <b>' + inCart.qty + ' in cart</b>' : '') + '</span></span>' +
          '<span class="spacer"></span>' +
          btn(maxed ? "All stock added" : inCart ? "Add another" : "Add",
            { style:"outlined", size:"sm", icon:I.add, disabled:maxed,
              attrs:' data-act="add-sku" data-sup="' + sup.id + '" data-sku="' + c.sku + '"' }) +
        '</div>';
      }).join("") + '</div>';
  }
  function openCatalog(supId){
    var sup = state.suppliers.filter(function(s){ return s.id === supId; })[0];
    if (!sup) { return; }
    modal("Add items from " + sup.name, catalogBody(sup), btn("Done", { attrs:' data-act="close-modal"' }));
    dlg.dataset.catalog = supId;
  }
  function refreshCatalog(){
    if (!dlg.open || !dlg.dataset.catalog) { return; }
    var sup = state.suppliers.filter(function(s){ return s.id === dlg.dataset.catalog; })[0];
    var body = dlg.querySelector(".hb-drawer__body");
    if (sup && body) { body.innerHTML = catalogBody(sup); }
  }
  function addSku(supId, sku, qty){
    var sup = state.suppliers.filter(function(s){ return s.id === supId; })[0];
    var src = (state.catalog[supId] || []).filter(function(c){ return c.sku === sku; })[0];
    if (!sup || !src) { return false; }
    var existing = sup.items.filter(function(it){ return it.sku === sku; })[0];
    if (existing) { existing.qty = Math.min(existing.stock, existing.qty + (qty || 1)); }
    else {
      sup.items.push({ sku:src.sku, name:src.name, per:src.per, unitLabel:src.unitLabel,
                       price:src.price, qty:qty || 1, stock:src.stock, sel:true });
    }
    render();
    toast("Added " + short(src.name) + " to " + sup.name + ".", { kind:"ok" });
    return true;
  }

  /* ---------- Quick add by SKU ---------- */
  function openSkuEntry(){
    var all = [];
    Object.keys(state.catalog).forEach(function(k){
      state.catalog[k].forEach(function(c){ all.push({ sup:k, sku:c.sku, name:c.name }); });
    });
    modal("Quick add by SKU",
      '<form id="sku-form">' +
        '<div style="display:grid;grid-template-columns:1fr 96px;gap:var(--hb-space-12);align-items:end">' +
          field({ id:"sku-in", label:"SKU", placeholder:"e.g. GF-EGG30", lead:I.search, attrs:' autocomplete="off" list="sku-opts"' }) +
          field({ id:"sku-qty", label:"Qty", value:"1" }) +
        '</div>' +
        '<datalist id="sku-opts">' + all.map(function(a){
          return '<option value="' + a.sku + '">' + esc(a.name) + '</option>'; }).join("") + '</datalist>' +
        '<div style="margin-top:var(--hb-space-16)">' + btn("Add to cart", { icon:I.add, attrs:' type="submit"' }) + '</div>' +
      '</form>' +
      '<p class="hb-body-sm muted" id="sku-msg" style="margin-top:var(--hb-space-12)">Paste a line from your order sheet, or start typing to search.</p>',
      btn("Done", { style:"outlined", attrs:' data-act="close-modal"' }));
    $("#sku-in").focus();
    $("#sku-form").addEventListener("submit", function(e){
      e.preventDefault();
      var code = ($("#sku-in").value || "").trim().toUpperCase();
      var qty = parseInt($("#sku-qty").value, 10) || 1;
      var hit = all.filter(function(a){ return a.sku === code; })[0];
      var msg = $("#sku-msg");
      if (!hit) {
        var inCart = null;
        state.suppliers.forEach(function(sp){
          sp.items.forEach(function(it){ if (it.sku === code) { inCart = { sp:sp, it:it }; } });
        });
        if (inCart) {
          inCart.it.qty = Math.min(inCart.it.stock, inCart.it.qty + qty);
          render();
          msg.textContent = "Increased " + short(inCart.it.name) + " to " + inCart.it.qty + ".";
          msg.style.color = "var(--hb-color-success-dark)";
        } else {
          msg.textContent = code ? 'No product with SKU "' + code + '".' : "Enter a SKU.";
          msg.style.color = "var(--hb-color-error-dark)";
        }
      } else {
        addSku(hit.sup, hit.sku, qty);
        msg.textContent = "Added " + hit.sku + " × " + qty + ".";
        msg.style.color = "var(--hb-color-success-dark)";
      }
      $("#sku-in").value = ""; $("#sku-qty").value = "1"; $("#sku-in").focus();
    });
  }

  /* ---------- New address ---------- */
  function openAddressForm(){
    modal("Deliver to a new address",
      '<form id="addr-form">' +
        field({ id:"a-name", label:"Location name", placeholder:"e.g. Riffa outlet" }) +
        field({ id:"a-line", label:"Address", placeholder:"Building, road, block, city" }) +
        field({ id:"a-contact", label:"Receiving contact", placeholder:"Name · phone" }) +
        '<p class="hb-body-sm muted">We will ask you to drop a map pin once, on the first delivery here.</p>' +
      '</form>',
      btn("Save address", { attrs:' data-act="save-address"' }) +
      btn("Cancel", { style:"outlined", attrs:' data-act="close-modal"' }));
    $("#a-name").focus();
  }

  /* ---------- Map pin ---------- */
  function openPin(addrId){
    var a = state.addresses.filter(function(x){ return x.id === addrId; })[0];
    if (!a) { return; }
    modal("Adjust the delivery pin",
      '<p class="hb-body-md muted" style="margin:0 0 var(--hb-space-12)">Click anywhere on the map to move the pin. Drivers navigate to this point, not the typed address.</p>' +
      '<div class="map" id="pin-map" style="height:240px;cursor:crosshair">' +
        '<span id="pin-mark" style="position:absolute;transform:translate(-50%,-100%)">' + I.location + '</span>' +
        '<span class="map__label hb-body-sm">Pin · <span class="num" id="pin-co">' + a.lat.toFixed(4) + ', ' + a.lng.toFixed(4) + '</span></span>' +
      '</div>',
      btn("Save pin", { attrs:' data-act="save-pin" data-ref="' + a.id + '"' }) +
      btn("Cancel", { style:"outlined", attrs:' data-act="close-modal"' }));
    var map = $("#pin-map"), mark = $("#pin-mark");
    mark.style.insetInlineStart = "50%"; mark.style.top = "50%";
    map.addEventListener("click", function(e){
      var r = map.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      mark.style.insetInlineStart = (x / r.width * 100) + "%";
      mark.style.top = (y / r.height * 100) + "%";
      var lat = 26.2361 + (0.5 - y / r.height) * 0.06;
      var lng = 50.5831 + (x / r.width - 0.5) * 0.06;
      map.dataset.lat = lat.toFixed(4); map.dataset.lng = lng.toFixed(4);
      $("#pin-co").textContent = lat.toFixed(4) + ", " + lng.toFixed(4);
    });
  }

  /* ---------- Proforma ---------- */
  function openProforma(){
    var o = state.order;
    if (!o) { return; }
    var day = state.days[o.day];
    modal("Proforma invoice " + o.ref,
      '<div class="hb-body-sm">' +
        '<h3 class="hb-title-md">HIGHBASE TRADING W.L.L.</h3>' +
        '<p class="muted" style="margin:0">CR 5056050560-1 · VAT 220012345600002</p>' +
        '<div class="row-end" style="gap:var(--hb-space-24);margin-top:var(--hb-space-16);align-items:flex-start">' +
          '<div><p class="hb-field__label">Billed to</p><p style="margin:0">Buyer Bahrain<br>' + esc(o.address.line) + '</p></div>' +
          '<div><p class="hb-field__label">Order</p><p class="num" style="margin:0">' + o.ref + '<br>' + o.placedOn + '</p></div>' +
          (o.po ? '<div><p class="hb-field__label">PO number</p><p style="margin:0">' + esc(o.po) + '<br>' + esc(o.costCentre) + '</p></div>' : '') +
        '</div>' +
        '<table class="sheet"><thead><tr><th>Description</th><th class="end">Qty</th><th class="end">Unit</th><th class="end">Amount</th></tr></thead><tbody>' +
        o.groups.map(function(g){
          return g.items.map(function(it){
            return '<tr><td>' + esc(it.name) + '<br><span class="muted">' + it.sku + '</span></td>' +
              '<td class="end num">' + it.qty + '</td><td class="end num">' + bhd(it.price) + '</td>' +
              '<td class="end num">' + bhd(it.qty * it.price) + '</td></tr>';
          }).join("");
        }).join("") +
        '<tr><td colspan="3">Items</td><td class="end num">' + bhd(o.items) + '</td></tr>' +
        '<tr><td colspan="3">Delivery · ' + day.lab + ' ' + day.date + '</td><td class="end num">' + bhd(o.delivery) + '</td></tr>' +
        (o.discount ? '<tr><td colspan="3">Discounts</td><td class="end num">−' + bhd(o.discount) + '</td></tr>' : '') +
        '<tr><td colspan="3">VAT 10%</td><td class="end num">' + bhd(o.vat) + '</td></tr>' +
        '<tr><td colspan="3"><b>Total due</b></td><td class="end num"><b>' + bhd(o.total) + '</b></td></tr>' +
        '</tbody></table>' +
        '<p class="muted" style="margin-top:var(--hb-space-16)">Proforma only — a tax invoice is issued on dispatch.</p>' +
      '</div>',
      btn("Print", { style:"outlined", icon:I.print, attrs:' data-act="print-invoice"' }) +
      btn("Close", { attrs:' data-act="close-modal"' }), "lg");
  }

  function previewReceipt(){
    var r = state.order && state.order.receipt;
    if (!r) { return; }
    modal(r.name,
      r.isImage
        ? '<img src="' + r.url + '" alt="Uploaded receipt" style="max-height:60vh;margin:0 auto;border-radius:var(--hb-radius-8)">'
        : '<div class="hb-empty"><span class="hb-empty__art">' + I.invoice + '</span>' +
          '<span class="hb-empty__title hb-title-md">' + esc(r.name) + '</span>' +
          '<span class="hb-empty__text hb-body-sm"><span class="num">' + r.size + '</span> · PDF. ' +
          'PDFs open in your own reader — the prototype shows the file card rather than embedding it.</span></div>',
      btn("Close", { attrs:' data-act="close-modal"' }));
  }
