
  /* ============================================================
     Screens, language, files, and one delegated listener
     ============================================================ */
  var screens = ["a", "b", "c", "d", "e", "why"];
  function show(name){
    if (screens.indexOf(name) === -1) { name = "a"; }
    state.version = name;
    screens.forEach(function (sc) { $("#screen-" + sc).hidden = (sc !== name); });
    $$(".proto-nav .hb-btn").forEach(function (b) { b.setAttribute("aria-current", String(b.dataset.screen === name)); });
    var foot = $(".hb-footer");
    if (foot) { foot.dataset.view = name === "why" ? "marketplace" : "dashboard"; }
    window.scrollTo(0, 0);
    if (location.hash.slice(1) !== name) { try { history.replaceState(null, "", "#" + name); } catch (err) { /* sandboxed */ } }
  }
  function render(){ renderVerify(); renderWhy(); }

  var LANG = null;
  function applyLang(){
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

  /* ---------- Files: documents and the receipt are real files, previewed from the browser ---------- */
  var fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/*"; fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  var fileTarget = null;   // "receipt" | doc id
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) { takeFile(fileInput.files[0]); }
    fileInput.value = "";
  });
  function pickFile(target){ fileTarget = target; fileInput.click(); }
  function describe(file){
    return { name: file.name,
      size: file.size < 1024 * 1024 ? Math.max(1, Math.round(file.size / 1024)) + " KB" : (file.size / 1024 / 1024).toFixed(1) + " MB",
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isImage: /^image\//.test(file.type), url: URL.createObjectURL(file) };
  }
  function takeFile(file){
    var isReceipt = fileTarget === "receipt";
    var reject = null;
    if (file.size > 10 * 1024 * 1024) { reject = "That file is over 10 MB — try a smaller scan or a PDF"; }
    else if (!(/pdf$/i.test(file.type) || /^image\//.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name))) { reject = "Only PDF, JPG or PNG files are accepted"; }
    var id = fileTarget, d = doc(id);
    if (!d) { return; }
    if (reject) {
      /* refused in the zone itself, where the buyer is looking — not only as a toast */
      state.errors["doc-" + id] = reject; if (d.file) { toast(reject + ".", { kind: "bad" }); }
      renderVerify(); return;
    }
    delete state.errors["doc-" + id]; delete state.errors.docs;
    state.uploading = id; state.uploadName = file.name;
    renderVerify();
    setTimeout(function () {
      /* a replacement keeps what it replaced: the Activity preview shows both files, and the
         old object URL stays alive because its thumbnail is still on screen */
      if (d.file) { d.prev = d.file; state.lastReplaced = id; }
      d.file = describe(file); d.file.at = "just now";
      state.uploading = null;
      renderVerify();
      toast(d.label + " saved to your account.", { kind: "ok" });
    }, 950);
  }
  function wireDocDrops(){
    $$("[data-drop]").forEach(function (zone) {
      ["dragenter", "dragover"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("is-over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("is-over"); }); });
      zone.addEventListener("drop", function (e) { fileTarget = zone.dataset.drop; if (e.dataTransfer && e.dataTransfer.files[0]) { takeFile(e.dataTransfer.files[0]); } });
      zone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickFile(zone.dataset.drop); } });
    });
  }
  function previewFile(f, title){
    /* A document already on the account has no local blob to draw, whatever its type — the
       prototype names it and says where it opens rather than claiming a format it cannot read. */
    var stored = !f.url;
    var body = (!stored && f.isImage)
      ? '<img src="' + f.url + '" alt="' + esc(f.name) + '" style="max-height:52vh;margin:0 auto;border-radius:var(--hb-radius-8)">'
      : '<div class="hb-empty"><span class="hb-empty__art">' + I.file + '</span>' +
        '<div class="hb-empty__title hb-title-md">' + esc(f.name) + '</div>' +
        '<div class="hb-empty__text hb-body-sm">' + esc(f.size) + ' · ' +
        (stored ? 'kept on your account — it opens in your own reader.' : 'this file type opens in your own reader.') +
        '</div></div>';
    drawer(title, '<div class="stack">' + body +
      '<p class="hb-body-sm muted" style="text-align:center">' + esc(f.name) + ' · ' + esc(f.size) + '</p></div>',
      btn("Close", { style: "ghost", attrs: ' data-act="close-drawer"' }));
  }

  /* ---------- Section Drawers (version B): the form lives in the Drawer organism ---------- */
  var DRAWERS = {
    branch:  { title: "Branch Details", size: "md",
      body: function () { return '<div class="drawerform stack"><p class="hb-body-sm muted">Who the driver calls when the order arrives. Saved to your account.</p>' + branchFields() + '</div>'; },
      foot: function () { return btn("Cancel", { style: "ghost", size: "lg", attrs: ' data-act="close-drawer"' }) + btn("Save Details", { size: "lg", icon: I.save, attrs: ' data-act="save-branch"' }); } },
    address: { title: "Delivery Address", size: "md",
      body: function () { return '<div class="drawerform stack"><p class="hb-body-sm muted">Where the order goes. The pin is what the driver navigates to.</p>' + addressFields() + '</div>'; },
      foot: function () { return btn("Cancel", { style: "ghost", size: "lg", attrs: ' data-act="close-drawer"' }) + btn("Update Address", { size: "lg", icon: I.save, attrs: ' data-act="save-address"' }); } },
    docs:    { title: "Business Documents", size: "lg",
      body: function () { return '<div class="drawerform stack"><p class="hb-body-sm muted">Kept on your account and reviewed within one working day — you will not be asked again on the next order.</p>' + docsBlock({ vatAsLink: true }) + '</div>'; },
      foot: function () { return btn("Done", { size: "lg", icon: I.check, attrs: ' data-act="close-drawer"' }); } }
  };
  function paintDrawer(reopen){
    var spec = DRAWERS[state.drawer];
    if (!spec) { return; }
    if (reopen || !dlg.open) { drawer(spec.title, spec.body(), spec.foot(), spec.size); }
    else {
      var body = $(".hb-drawer__body", dlg), acts = $(".hb-dlg-actions", dlg);
      if (body) { body.innerHTML = spec.body(); }
      if (acts) { acts.innerHTML = spec.foot(); }
    }
  }
  /* A Drawer can close natively (its close button is a form method="dialog"), so the state
     it was editing is reset here rather than in the action that opened it. */
  dlg.addEventListener("close", function () {
    if (state.returnTo) { state.drawer = state.returnTo; state.returnTo = null; paintDrawer(true); return; }
    if (!state.drawer) { return; }
    state.drawer = null; state.editing.branch = false; state.editing.address = false; state.errors = {};
    renderVerify();
  });

  /* ---------- Inline editing: validate, then save; Cancel restores ---------- */
  function val(id){ var el = (dlg.open ? $("#" + id, dlg) : null) || $("#screen-" + state.version + " #" + id); return el ? el.value.trim() : ""; }
  function saveBranch(){
    var e = {};
    if (!val("b-name")) { e["b-name"] = "Branch name is required"; }
    if (!/^\d{8}$/.test(val("b-phone").replace(/\s/g, ""))) { e["b-phone"] = "Enter the 8-digit number after +973"; }
    if (val("b-email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("b-email"))) { e["b-email"] = "That does not look like an email address"; }
    state.errors = e;
    if (Object.keys(e).length) { renderVerify(); toast("Check the highlighted fields.", { kind: "bad" }); return; }
    state.branchDetails = { name: val("b-name"), phone: val("b-phone").replace(/\s/g, ""), email: val("b-email") };
    state.editing.branch = false;
    if (state.drawer) { closeDrawer(); } else { renderVerify(); }
    toast("Branch details saved.", { kind: "ok" });
  }
  function saveAddress(){
    var e = {};
    [["a-city", "City"], ["a-street", "Street address"], ["a-building", "Building name or number"]].forEach(function (f) { if (!val(f[0])) { e[f[0]] = f[1] + " is required"; } });
    if (val("a-zip") && !/^\d{3,6}$/.test(val("a-zip"))) { e["a-zip"] = "Postal codes are 3 to 6 digits"; }
    state.errors = e;
    if (Object.keys(e).length) { renderVerify(); toast("Check the highlighted fields.", { kind: "bad" }); return; }
    state.address = { country: val("a-country"), state: val("a-state"), city: val("a-city"), street: val("a-street"), building: val("a-building"), zip: val("a-zip"), pinned: true };
    state.editing.address = false;
    if (state.drawer) { closeDrawer(); } else { renderVerify(); }
    toast("Delivery address updated.", { kind: "ok" });
  }
  function scrollTo(id){ var el = $("#screen-" + state.version + " #" + id) || $("#" + id); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); } }

  /* ---------- Placing the order ---------- */
  function placeOrder(){
    if (state.editing.branch || state.editing.address) {
      toast("Save or cancel your " + (state.editing.branch ? "branch details" : "address") + " first.", { kind: "bad" }); return;
    }
    var missing = docsMissing();
    if (state.hasVat && !state.taxNumber) { state.errors["tax-no"] = "Enter the tax number on your VAT certificate"; }
    if (missing.length || state.errors["tax-no"]) {
      state.errors.docs = missing.length ? "Still needed before you can place the order: " + missing.join(", ") : "Enter the tax number";
      missing.forEach(function (l) { var k = Object.keys(state.docs).filter(function (x) { return state.docs[x].label === l; })[0]; state.errors["doc-" + k] = "This document is required"; });
      var v = state.version;
      if (v === "a") { state.step.a = 2; } else if (v === "c") { state.step.c = 2; }
      else if (v === "d") { state.step.d = 2; }
      else if (v === "e") { state.expand.docs = true; }
      renderVerify(); scrollTo({ a: "acc-docs", b: "card-docs", e: "row-docs" }[state.version] || "");
      if (state.version === "b") { state.drawer = "docs"; paintDrawer(true); }
      return;
    }
    state.placing = true; renderVerify();
    setTimeout(function () {
      state.placing = false; renderVerify();
      confirmDialog({ intent: "neutral", icon: I.check, title: "Order placed",
        body: "Bank details for a transfer of " + bhd(totals().total) + " come next — that page is in the Verification & payment prototype. Reset this one to try another version.",
        actions: btn("Reset", { style: "ghost", size: "lg", attrs: ' data-act="reset"' }) + btn("Close", { size: "lg", attrs: ' data-act="close-confirm"' }) });
    }, 900);
  }

  /* ---------- Actions ---------- */
  var ACTS = {
    "place-order": placeOrder,
    "reset": function () { location.reload(); },
    "goto": function (el) { show(el.dataset.screen); },
    /* the Compare screen opens B already set to the style being described */
    "goto-style": function (el) { state.previewStyle = el.dataset.preview; renderB(); show("b"); },
    "open-step": function (el) { if (state.editing.branch || state.editing.address) { toast("Save or cancel your edit first.", { kind: "bad" }); return; } state.step[state.version] = +el.dataset.step; renderVerify(); },
    "go-tab": function (el) { if (state.editing.branch || state.editing.address) { toast("Save or cancel your edit first.", { kind: "bad" }); return; } state.step.d = +el.dataset.step; renderVerify(); },
    "expand-row": function (el) {
      var id = el.dataset.row;
      if (state.expand[id] && (state.editing.branch || state.editing.address)) { toast("Save or cancel your edit first.", { kind: "bad" }); return; }
      state.expand[id] = !state.expand[id]; renderVerify();
    },
    "go-step": function (el) { if (state.editing.branch || state.editing.address) { toast("Save or cancel your edit first.", { kind: "bad" }); return; } state.step.c = +el.dataset.step; renderVerify(); window.scrollTo(0, 0); },
    "next-step": function () {
      if (state.editing.branch || state.editing.address) { toast("Save or cancel your edit first.", { kind: "bad" }); return; }
      var k = state.version; state.step[k] = Math.min(state.step[k] + 1, (k === "c" ? GUIDE : k === "d" ? TABS : SECTIONS).length - 1); renderVerify();
      if (k === "c") { window.scrollTo(0, 0); }
    },
    "open-drawer": function (el) {
      var id = el.dataset.drawer;
      state.drawer = id; state.errors = {};
      if (id === "branch") { state.editing.branch = true; }
      if (id === "address") { state.editing.address = true; }
      paintDrawer(true);
      var first = $(".hb-drawer__body input", dlg); if (first) { first.focus(); }
    },
    "show-vat": function () { state.hasVat = true; renderVerify(); var el = $("#screen-" + state.version + " #tax-no"); if (el) { el.focus(); } },
    "edit-branch": function () { state.errors = {}; state.editing.branch = true; if (state.version === "e") { state.expand.branch = true; } renderVerify(); var el = $("#screen-" + state.version + " #b-name"); if (el) { el.focus(); } },
    "cancel-branch": function () { state.errors = {}; state.editing.branch = false; renderVerify(); },
    "save-branch": saveBranch,
    "edit-address": function () { state.errors = {}; state.editing.address = true; if (state.version === "e") { state.expand.address = true; } renderVerify(); },
    "cancel-address": function () { state.errors = {}; state.editing.address = false; renderVerify(); },
    "save-address": saveAddress,
    "move-pin": function () { toast("The map would let you drag the pin here; the fields fill from it."); },
    "pick-doc": function (el) { pickFile(el.dataset.doc); },
    "view-doc": function (el) {
      var d = doc(el.dataset.doc);
      /* previewing replaces the Drawer's contents, so remember which section to come back to */
      if (state.drawer) { state.returnTo = state.drawer; state.drawer = null; }
      previewFile(d.file, d.label);
    },
    "remove-doc": function (el) {
      var d = doc(el.dataset.doc), id = el.dataset.doc;
      confirmDialog({ intent: "danger", icon: I.warning, title: "Remove " + d.label + "?",
        body: d.required ? "It is required to place an order — you will need to upload it again." : "You can add it again at any time.",
        actions: btn("Keep it", { style: "ghost", size: "lg", attrs: ' data-act="close-confirm"' }) + btn("Remove", { intent: "danger", size: "lg", attrs: ' data-act="remove-doc-go" data-doc="' + id + '"' }) });
    },
    "remove-doc-go": function (el) { var d = doc(el.dataset.doc); if (d.file && d.file.url) { URL.revokeObjectURL(d.file.url); }
      /* with the current file gone there is no "after" to compare a superseded copy against */
      d.file = null; d.prev = null; if (state.lastReplaced === el.dataset.doc) { state.lastReplaced = null; } closeConfirm(); renderVerify(); toast(d.label + " removed.", { kind: "ok" }); },
    "close-confirm": closeConfirm,
    /* the Credential preview offers its identifier for copying; the clipboard is not
       available on every origin, so the failure is reported rather than claimed as a copy. */
    "copy-value": function (el) {
      var v = el.dataset.value, label = el.dataset.label || "value";
      var done = function () { toast("Copied the " + label + "."); };
      var failed = function () { toast("Could not copy — select the " + label + " instead.", { kind: "bad" }); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(v).then(done, failed); }
      else { failed(); }
    },
    /* version B only: swap how the sections preview their data. Review chrome (proposal). */
    "preview-style": function (el) { state.previewStyle = el.dataset.preview; renderB(); applyLang(); },
    "close-drawer": closeDrawer
  };

  document.addEventListener("click", function (e) {
    var act = e.target.closest("[data-act]");
    if (act && ACTS[act.dataset.act]) {
      if (act.tagName === "A") { e.preventDefault(); }
      ACTS[act.dataset.act](act, e);
      return;
    }
    var copy = e.target.closest("[data-copy]");
    if (copy) { copyText(copy, copy.dataset.copy); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.bind === "hasVat") { state.hasVat = t.checked; delete state.errors["tax-no"]; delete state.errors.docs; renderVerify(); if (t.checked) { var f = $("#screen-" + state.version + " #tax-no"); if (f) { f.focus(); } } return; }
    if (t.dataset.bind === "taxNumber") { state.taxNumber = t.value.trim(); return; }   // no re-render: the field keeps focus
  });
  document.addEventListener("input", function (e) { if (e.target.dataset.bind === "taxNumber") { state.taxNumber = e.target.value.trim(); } });

  /* ---------- Footer / header / chrome ---------- */
  $(".hb-footer").addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a || a.getAttribute("href") !== "#") { return; }
    e.preventDefault(); toast((a.getAttribute("aria-label") || a.textContent.trim()) + " sits outside the checkout flow this prototype covers.");
  });
  $("#f-app").addEventListener("click", function () { toast("The Highbase app is not part of this prototype."); });
  var toTop = $("#to-top");
  function syncToTop(){ toTop.hidden = window.scrollY < 320; }
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", syncToTop, { passive: true }); syncToTop();

  var hdr = $(".hb-header"), hdrLogo = $("#h-logo .hb-logo");
  var mqCompact = window.matchMedia("(max-width: 743px)");
  function syncHeader(){
    var compact = mqCompact.matches;
    hdr.dataset.size = compact ? "compact" : "expanded";
    hdrLogo.dataset.type = compact ? "mark" : "wordmark";
    $("#h-avatar").dataset.size = compact ? "32" : "40";
    $(".hb-header .hb-search").dataset.style = compact ? "compressed" : "default";
  }
  if (mqCompact.addEventListener) { mqCompact.addEventListener("change", syncHeader); } else { mqCompact.addListener(syncHeader); }
  syncHeader();
  $("#h-menu").addEventListener("click", function () { toast("Categories, Brands, offers and messages move into this menu on compact."); });
  $(".hb-header__account").addEventListener("click", function () { toast("Account and branch switching sit outside these two screens."); });
  $$(".hb-header__nav .hb-header__pill").forEach(function (b) { b.addEventListener("click", function () { toast(b.textContent.trim() + " sits outside these two screens."); }); });

  $$(".proto-nav .hb-btn").forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.screen); }); });
  document.body.classList.add("notes-on");
  var notes = $("#t-notes");
  notes.addEventListener("click", function () { var on = notes.getAttribute("aria-pressed") !== "true"; notes.setAttribute("aria-pressed", String(on)); document.body.classList.toggle("notes-on", on); });
  var dirBtn = $("#t-dir"), dirBtn2 = $("#t-dir-2");
  function toggleDir(){
    var rtl = dirBtn.getAttribute("aria-pressed") !== "true";
    dirBtn.setAttribute("aria-pressed", String(rtl));
    document.documentElement.dir = rtl ? "rtl" : "ltr"; document.documentElement.lang = rtl ? "ar" : "en";
    LANG = rtl ? "ar" : "en"; applyLang();
  }
  dirBtn.addEventListener("click", toggleDir); if (dirBtn2) { dirBtn2.addEventListener("click", toggleDir); }
  window.addEventListener("hashchange", function () { show(location.hash.slice(1) || "a"); });

  render();
  show(location.hash.slice(1) || "a");
