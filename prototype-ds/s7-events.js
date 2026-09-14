
  /* ============================================================
     Screens, annotations, language
     ============================================================ */
  var screens = ["cart", "checkout", "confirm", "why"];
  function show(name) {
    if (screens.indexOf(name) === -1) { name = "cart"; }
    if (name === "confirm" && !state.order) { name = "cart"; }
    screens.forEach(function (sc) { $("#screen-" + sc).hidden = (sc !== name); });
    $$(".proto-nav .hb-btn").forEach(function (b) {
      b.setAttribute("aria-current", String(b.dataset.screen === name));
    });
    // Checkout drops to the reduced Footer (data-view="dashboard" — the copyright bar
    // alone). Fewer exits on the one screen where a buyer is committing; the full
    // marketplace footer returns on cart, confirmation and the evaluation sheet.
    var foot = $(".hb-footer");
    if (foot) { foot.dataset.view = name === "checkout" ? "dashboard" : "marketplace"; }
    window.scrollTo(0, 0);
    if (location.hash.slice(1) !== name) {
      try { history.replaceState(null, "", "#" + name); } catch (err) { /* sandboxed frame */ }
    }
    if (name === "confirm") { startCountdown(); }
  }

  var LANG = null;
  function applyLang() {
    if (!LANG) { return; }
    $$("[data-ar-ph]").forEach(function (el) {
      if (!el.dataset.enPh) { el.dataset.enPh = el.placeholder; }
      el.placeholder = LANG === "ar" ? el.dataset.arPh : el.dataset.enPh;
    });
    $$("[data-ar]").forEach(function (el) {
      if (!el.dataset.en) { el.dataset.en = el.textContent; }
      el.textContent = LANG === "ar" ? el.dataset.ar : el.dataset.en;
    });
  }

  /* ============================================================
     Events — one delegated listener, so re-rendered markup stays live
     ============================================================ */
  var ACTS = {
    "to-checkout": function () {
      if (!totals().ready.length) { toast("Nothing is ready to order yet.", { kind: "bad" }); return; }
      show("checkout");
    },
    "place-order": placeOrder,
    "remove": function (el) { removeItem(el.dataset.ref); },
    "clamp": function (el) {
      var f = find(el.dataset.ref);
      setQty(el.dataset.ref, f.item.stock);
      toast("Quantity reduced to what the supplier has.", { kind: "ok" });
    },
    "notify": function (el) {
      var f = find(el.dataset.ref);
      state.notify[f.item.sku] = !state.notify[f.item.sku];
      render();
      toast(state.notify[f.item.sku]
        ? "We'll email you when " + short(f.item.name) + " is back in stock."
        : "Restock alert turned off.", { kind: state.notify[f.item.sku] ? "ok" : undefined });
    },
    "remove-selected": function () {
      var picked = [];
      state.suppliers.forEach(function (sp) {
        sp.items.forEach(function (it, i) { if (it.sel) { picked.push({ sup: sp, item: it, idx: i }); } });
      });
      if (!picked.length) { toast("Nothing is selected.", { kind: "bad" }); return; }
      state.undo = { sup: null, entries: picked };
      picked.forEach(function (e) {
        var i = e.sup.items.indexOf(e.item);
        if (i > -1) { e.sup.items.splice(i, 1); }
      });
      render();
      toast("Removed " + picked.length + " line" + (picked.length === 1 ? "" : "s") + ".", {
        action: "Undo",
        onAction: function () {
          picked.forEach(function (e) { e.sup.items.splice(Math.min(e.idx, e.sup.items.length), 0, e.item); });
          render();
          toast("Restored.", { kind: "ok" });
        }
      });
    },
    "save-list": function () {
      var n = state.suppliers.reduce(function (t, sp) {
        return t + sp.items.filter(function (i) { return i.sel; }).length;
      }, 0);
      if (!n) { toast("Select some lines first.", { kind: "bad" }); return; }
      state.savedLists++;
      toast("Saved " + n + " line" + (n === 1 ? "" : "s") + " as a list you can reorder in one tap.", { kind: "ok" });
    },
    "move-list": function (el) {
      var sup = state.suppliers.filter(function (x) { return x.id === el.dataset.sup; })[0];
      var kept = sup.items.slice();
      sup.items = [];
      state.savedLists++;
      render();
      toast("Moved " + kept.length + " line" + (kept.length === 1 ? "" : "s") + " to a saved list.", {
        action: "Undo",
        onAction: function () { sup.items = kept; state.savedLists--; render(); }
      });
    },
    "quick-add": openSkuEntry,
    "browse": function (el) { openCatalog(el.dataset.sup); },
    "add-sku": function (el) { addSku(el.dataset.sup, el.dataset.sku); refreshCatalog(); },
    "restock-demo": function () { location.reload(); },
    "coupon": function () {
      var input = $("#cpn"), msg = $("#cpn-msg"), fieldEl = input.closest(".hb-field");
      var setState = function(s){ if (fieldEl) { if (s) { fieldEl.setAttribute("data-state", s); } else { fieldEl.removeAttribute("data-state"); } } };
      var code = (input.value || "").trim().toUpperCase();
      msg.hidden = false;
      if (!code) { msg.textContent = "Enter a code."; msg.style.color = "var(--hb-color-error-dark)"; setState("error"); return; }
      if (state.applied.some(function (c) { return c.code === code; })) {
        msg.textContent = code + " is already applied."; msg.style.color = "var(--hb-color-warning-dark)"; setState("error"); return;
      }
      var hit = state.coupons.filter(function (c) { return c.code === code; })[0];
      if (!hit) {
        msg.textContent = '"' + code + '" is not a valid code.'; msg.style.color = "var(--hb-color-error-dark)"; setState("error"); return;
      }
      if (totals().items < (hit.min || 0)) {
        msg.textContent = code + " needs a basket of " + bhd(hit.min) + " or more.";
        msg.style.color = "var(--hb-color-warning-dark)"; setState("error"); return;
      }
      state.applied.push(hit);
      render();
      toast(code + " applied — " + bhd(hit.off) + " off.", { kind: "ok" });
    },
    "uncoupon": function (el) {
      state.applied = state.applied.filter(function (c) { return c.code !== el.dataset.code; });
      render();
      toast("Coupon removed.");
    },
    "add-address": openAddressForm,
    "save-address": function () {
      var name = $("#a-name").value.trim(), line = $("#a-line").value.trim();
      if (!name || !line) { toast("Give the address a name and a street line.", { kind: "bad" }); return; }
      var id = "addr" + (state.addresses.length + 1);
      state.addresses.push({ id: id, name: name, line: line,
        contact: $("#a-contact").value.trim() || "No contact given", lat: 26.2361, lng: 50.5831 });
      state.checkout.addr = id;
      closeModal(); render();
      toast("Address saved and selected.", { kind: "ok" });
    },
    "pin": function (el) { openPin(el.dataset.ref); },
    "save-pin": function (el) {
      var map = $("#pin-map");
      var a = state.addresses.filter(function (x) { return x.id === el.dataset.ref; })[0];
      if (a && map && map.dataset.lat) { a.lat = parseFloat(map.dataset.lat); a.lng = parseFloat(map.dataset.lng); }
      closeModal(); render();
      toast("Pin saved for this branch.", { kind: "ok" });
    },
    "change-branch": function () {
      toast("Branch switching lives in account settings — the addresses below belong to the current branch.");
    },
    "manage-docs": function () {
      modal("Business documents",
        '<p class="hint" style="margin:0 0 14px">Collected once, checked on expiry. None of this is asked for again inside an order.</p>' +
        '<div class="catalog">' +
          [["Commercial registration (CR)", "5056050560-1", "Valid to 31 Dec 2026", "ok"],
           ["VAT certificate", "220012345600002", "Valid to 31 Dec 2026", "ok"],
           ["Authorised signatory ID", "Ahmed Khalil", "Verified 14 Mar 2026", "ok"]]
          .map(function (d) {
            return '<div class="catalog__row"><div class="thumb" aria-hidden="true">🧾</div>' +
              '<div><p class="catalog__name">' + d[0] + '</p>' +
              '<p class="catalog__meta">' + d[1] + ' · ' + d[2] + '</p></div>' +
              '<div class="spacer"></div><span class="chip chip--' + d[3] + '">✓ Verified</span></div>';
          }).join("") + '</div>',
        '<button class="btn btn--primary" data-act="close-modal">Close</button>');
    },
    "apply-net30": function (e) { toast("Credit application opens here — three minutes, no effect on this order."); },
    "terms": function () {
      modal("Supplier terms",
        '<p style="margin:0 0 10px">Cancellable free of charge until the supplier dispatches. ' +
        'Damaged or short-delivered goods are reportable for 48 hours after delivery.</p>' +
        '<p style="margin:0;color:var(--ink-500)">Placeholder copy — the real terms come from each supplier\'s agreement.</p>',
        '<button class="btn btn--primary" data-act="close-modal">Close</button>');
    },
    "pick": function () { fileInput.click(); },
    "drop-receipt": function () {
      if (state.order.receipt && state.order.receipt.url) { URL.revokeObjectURL(state.order.receipt.url); }
      state.order.receipt = null;
      renderConfirm();
      toast("Receipt removed.");
    },
    "preview": previewReceipt,
    "submit-receipt": function () {
      if (!state.order.receipt) { toast("Attach the receipt first.", { kind: "bad" }); return; }
      state.order.paid = true;
      state.order.paidAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      renderConfirm();
      toast("Receipt submitted. We'll match it against " + state.order.ref + ".", { kind: "ok" });
    },
    "pay-later": function () {
      toast("Saved. We'll remind you before the reservation expires on " + state.order.expiry + ".");
    },
    "switch-card": function () {
      state.order.payment = "card";
      renderConfirm();
      toast("Switched to card — charged when the supplier dispatches.", { kind: "ok" });
    },
    "track": function () {
      $("#timeline").scrollIntoView({ behavior: "smooth", block: "center" });
    },
    "proforma": openProforma,
    "print-invoice": function () { window.print(); },
    "message-supplier": function () {
      modal("Message " + state.order.groups[0].name,
        '<div class="field"><label for="msg">Your message</label>' +
        '<textarea class="input" id="msg" rows="4" placeholder="e.g. Please deliver to the rear gate — the front bay is closed on Mondays."></textarea></div>' +
        '<p class="hint">Goes to the supplier with order ' + state.order.ref + ' attached.</p>',
        '<button type="button" class="btn btn--primary" data-act="send-message">Send</button>' +
        '<button class="btn btn--ghost" data-act="close-modal">Cancel</button>');
      $("#msg").focus();
    },
    "send-message": function () {
      var v = ($("#msg").value || "").trim();
      closeModal();
      toast(v ? "Message sent to the supplier." : "Nothing to send.", { kind: v ? "ok" : "bad" });
    },
    "save-recurring": function () {
      state.savedLists++;
      toast("Saved as a recurring basket. Reorder it in one tap from My lists.", { kind: "ok" });
    },
    "close-modal": closeModal
  };

  document.addEventListener("click", function (e) {
    var goto = e.target.closest("[data-goto]");
    if (goto) { e.preventDefault(); show(goto.dataset.goto); return; }

    var act = e.target.closest("[data-act]");
    if (act && ACTS[act.dataset.act]) {
      if (act.tagName === "A" || act.type === "submit") { e.preventDefault(); }
      ACTS[act.dataset.act](act, e);
      return;
    }

    var copyRef = e.target.closest("[data-copy-ref]");
    if (copyRef && state.order) { copyText(copyRef, state.order.ref); return; }
    var copy = e.target.closest("[data-copy]");
    if (copy) { copyText(copy, copy.dataset.copy); return; }

    var stepBtn = e.target.closest(".hb-atc__step");
    if (stepBtn) {
      var wrap = stepBtn.closest(".hb-atc");
      var f = find(wrap.dataset.step);
      if (!f.item) { return; }
      var dir = Number(stepBtn.dataset.dir);
      // At quantity 1 the minus becomes a delete, per the Add to Cart states.
      if (dir === -1 && f.item.qty <= 1) { removeItem(wrap.dataset.step); return; }
      setQty(wrap.dataset.step, f.item.qty + dir);
      return;
    }

    var day = e.target.closest("[data-day]");
    if (day && !day.disabled) { state.checkout.day = +day.dataset.day; render(); return; }
    var time = e.target.closest("[data-time]");
    if (time) { state.checkout.time = +time.dataset.time; render(); return; }
  });

  function copyText(btn, text) {
    var done = function () {
      var was = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.textContent = was; }, 1400);
    };
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done, done); } else { done(); }
  }

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "sel-all") {
      state.suppliers.forEach(function (sp) { sp.items.forEach(function (it) { it.sel = t.checked; }); });
      render(); return;
    }
    if (t.dataset.supSel) {
      var sup = state.suppliers.filter(function (x) { return x.id === t.dataset.supSel; })[0];
      sup.items.forEach(function (it) { it.sel = t.checked; });
      render(); return;
    }
    if (t.dataset.itemSel) {
      var f = find(t.dataset.itemSel);
      if (f.item) { f.item.sel = t.checked; }
      render(); return;
    }
    if (t.name === "addr") { state.checkout.addr = t.value; render(); return; }
    if (t.name === "pay") { state.checkout.payment = t.value; return; }
    if (t.dataset.bind) {
      // Record the value only. Re-rendering here would rebuild the summary on
      // the blur that a click on "Place order" causes, destroying that button
      // between mousedown and mouseup so the click never lands. None of these
      // fields feed the summary anyway — they are read when the order is placed.
      state.checkout[t.dataset.bind] = t.type === "checkbox" ? t.checked : t.value;
    }
  });

  document.addEventListener("input", function (e) {
    var wrap = e.target.closest(".hb-atc");
    if (!wrap) { return; }
    var raw = e.target.value.replace(/[^\d]/g, "");
    e.target.value = raw;
    if (!raw) { return; }
    var f = find(wrap.dataset.step);
    if (!f.item) { return; }
    f.item.qty = Math.max(1, Math.min(999, parseInt(raw, 10)));
    var key = wrap.dataset.step, pos = e.target.selectionStart;
    render();
    var again = document.querySelector('.hb-atc[data-step="' + key + '"] input');
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) {} }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "cpn") { e.preventDefault(); ACTS.coupon(); }
  });

  /* ---------- Header (organism) ----------
     data-size is a component axis, so the page sets it at the design system's own
     breakpoint: compact < 744. The Header README puts the wordmark on expanded and
     the mark on compact, so the Logo atom's data-type follows. */
  var hdr = $(".hb-header");
  var hdrLogo = $("#h-logo .hb-logo");
  var mqCompact = window.matchMedia("(max-width: 743px)");
  function syncHeader(){
    var compact = mqCompact.matches;
    hdr.dataset.size = compact ? "compact" : "expanded";
    hdrLogo.dataset.type = compact ? "mark" : "wordmark";
    $("#h-avatar").dataset.size = compact ? "32" : "40";
    // the SearchField has an icon-only variant for exactly this width — declare it
    // rather than letting the full field get squeezed down to the same 44 by flex
    $(".hb-header .hb-search").dataset.style = compact ? "compressed" : "default";
  }
  if (mqCompact.addEventListener) { mqCompact.addEventListener("change", syncHeader); }
  else { mqCompact.addListener(syncHeader); }
  syncHeader();

  $(".hb-header .hb-search").addEventListener("click", function () {
    if (hdr.dataset.size !== "compact") { return; }
    toast("Search opens full width on compact.");
  });
  $("#h-menu").addEventListener("click", function () {
    toast("Categories, Brands, offers and messages move into this menu on compact.");
  });
  $(".hb-header__account").addEventListener("click", function () {
    toast("Account and branch switching sit outside the checkout flow this prototype covers.");
  });
  $$(".hb-header__nav .hb-header__pill").forEach(function (b) {
    b.addEventListener("click", function () {
      toast(b.textContent.trim() + " sits outside the checkout flow this prototype covers.");
    });
  });

  /* ---------- Footer (organism) ---------- */
  var toTop = $("#to-top");
  function syncToTop(){ toTop.hidden = window.scrollY < 320; }
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", syncToTop, { passive: true });
  syncToTop();

  $("#f-app").addEventListener("click", function () {
    toast("The Highbase app is not part of this prototype.");
  });
  $(".hb-footer").addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || a.getAttribute("href") !== "#") { return; }
    e.preventDefault();
    var label = a.getAttribute("aria-label") || a.textContent.trim();
    toast(label + " sits outside the checkout flow this prototype covers.");
  });

  /* ---------- Prototype chrome ---------- */
  $$(".proto-nav .hb-btn").forEach(function (b) {
    b.addEventListener("click", function () { show(b.dataset.screen); });
  });

  document.body.classList.add("notes-on");
  var notes = $("#t-notes");
  notes.addEventListener("click", function () {
    var on = notes.getAttribute("aria-pressed") !== "true";
    notes.setAttribute("aria-pressed", String(on));
    document.body.classList.toggle("notes-on", on);
  });

  var dirBtn = $("#t-dir");
  var dirBtn2 = $("#t-dir-2");
  function toggleDir(){
    var rtl = dirBtn.getAttribute("aria-pressed") !== "true";
    dirBtn.setAttribute("aria-pressed", String(rtl));
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = rtl ? "ar" : "en";
    LANG = rtl ? "ar" : "en";
    applyLang();
  }
  dirBtn.addEventListener("click", toggleDir);
  if (dirBtn2) { dirBtn2.addEventListener("click", toggleDir); }

  window.addEventListener("hashchange", function () { show(location.hash.slice(1) || "cart"); });

  render();
  show(location.hash.slice(1) || "cart");
