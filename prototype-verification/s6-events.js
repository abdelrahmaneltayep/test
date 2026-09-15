
  /* ============================================================
     Screens, language, files, and one delegated listener
     ============================================================ */
  var screens = ["verify", "paid", "why"];
  function show(name){
    if (screens.indexOf(name) === -1) { name = "verify"; }
    if (name === "paid" && !state.order) { name = "verify"; }
    screens.forEach(function (sc) { $("#screen-" + sc).hidden = (sc !== name); });
    $$(".proto-nav .hb-btn").forEach(function (b) { b.setAttribute("aria-current", String(b.dataset.screen === name)); });
    var foot = $(".hb-footer");
    if (foot) { foot.dataset.view = name === "verify" ? "dashboard" : "marketplace"; }
    window.scrollTo(0, 0);
    if (location.hash.slice(1) !== name) { try { history.replaceState(null, "", "#" + name); } catch (err) { /* sandboxed */ } }
  }
  function render(){ renderVerify(); renderPaid(); renderWhy(); }

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
    if (isReceipt) {
      if (reject) { toast(reject + ".", { kind: "bad" }); return; }
      if (state.receipt && state.receipt.url) { URL.revokeObjectURL(state.receipt.url); }
      state.receipt = describe(file);
      renderPaid();
      toast("Receipt attached. Submit it to move the order on.", { kind: "ok" });
      return;
    }
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
      if (d.file && d.file.url) { URL.revokeObjectURL(d.file.url); }
      d.file = describe(file); d.file.at = null;
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
  function wireDrop(){
    var drop = $("#drop");
    if (!drop) { return; }
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
    drop.addEventListener("drop", function (e) { fileTarget = "receipt"; if (e.dataTransfer && e.dataTransfer.files[0]) { takeFile(e.dataTransfer.files[0]); } });
    drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickFile("receipt"); } });
  }
  function previewFile(f, title){
    if (!f.url) { f = { name: f.name, size: f.size, isImage: false }; }
    drawer(title, f.isImage
      ? '<img src="' + f.url + '" alt="' + esc(f.name) + '" style="max-height:60vh;margin:0 auto;border-radius:var(--hb-radius-8)">'
      : '<div class="hb-empty"><span class="hb-empty__art">' + I.file + '</span><div class="hb-empty__title hb-title-md">' + esc(f.name) + '</div><div class="hb-empty__text hb-body-sm">' + esc(f.size) + ' · PDF. PDFs open in your own reader; the prototype shows the file card.</div></div>',
      btn("Close", { style: "ghost", attrs: ' data-act="close-drawer"' }));
  }

  /* ---------- Inline editing: validate, then save; Cancel restores ---------- */
  function val(id){ var el = $("#" + id); return el ? el.value.trim() : ""; }
  function saveBranch(){
    var e = {};
    if (!val("b-name")) { e["b-name"] = "Branch name is required"; }
    if (!/^\d{8}$/.test(val("b-phone").replace(/\s/g, ""))) { e["b-phone"] = "Enter the 8-digit number after +973"; }
    if (val("b-email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("b-email"))) { e["b-email"] = "That does not look like an email address"; }
    state.errors = e;
    if (Object.keys(e).length) { renderVerify(); toast("Check the highlighted fields.", { kind: "bad" }); return; }
    state.branchDetails = { name: val("b-name"), phone: val("b-phone").replace(/\s/g, ""), email: val("b-email") };
    state.editing.branch = false; renderVerify();
    toast("Branch details saved.", { kind: "ok" });
  }
  function saveAddress(){
    var e = {};
    [["a-city", "City"], ["a-street", "Street address"], ["a-building", "Building name or number"]].forEach(function (f) { if (!val(f[0])) { e[f[0]] = f[1] + " is required"; } });
    if (val("a-zip") && !/^\d{3,6}$/.test(val("a-zip"))) { e["a-zip"] = "Postal codes are 3 to 6 digits"; }
    state.errors = e;
    if (Object.keys(e).length) { renderVerify(); toast("Check the highlighted fields.", { kind: "bad" }); return; }
    state.address = { country: val("a-country"), state: val("a-state"), city: val("a-city"), street: val("a-street"), building: val("a-building"), zip: val("a-zip"), pinned: true };
    state.editing.address = false; renderVerify();
    toast("Delivery address updated.", { kind: "ok" });
  }
  function scrollTo(id){ var el = $("#" + id); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); } }

  /* ---------- Placing the order ---------- */
  function placeOrder(){
    if (state.editing.branch || state.editing.address) {
      toast("Save or cancel your " + (state.editing.branch ? "branch details" : "address") + " first.", { kind: "bad" });
      scrollTo(state.editing.branch ? "sec-branch" : "sec-address"); return;
    }
    var missing = ["cr", "id"].filter(function (k) { return !state.docs[k].file; }).map(function (k) { return state.docs[k].label; });
    if (state.hasVat && !state.taxNumber) { state.errors["tax-no"] = "Enter the tax number on your VAT certificate"; }
    if (state.hasVat && !state.docs.vat.file) { missing.push(state.docs.vat.label); }
    if (missing.length || state.errors["tax-no"]) {
      state.errors.docs = missing.length ? "Still needed before you can place the order: " + missing.join(", ") : "Enter the tax number";
      missing.forEach(function (l) { var k = Object.keys(state.docs).filter(function (x) { return state.docs[x].label === l; })[0]; state.errors["doc-" + k] = "This document is required"; });
      renderVerify(); scrollTo("sec-docs"); return;
    }
    state.placing = true; renderVerify();
    setTimeout(function () {
      state.placing = false;
      state.checkedAt = "just now";
      if (state.scenarioStockChange) {
        var l = state.lines[0];
        confirmDialog({
          intent: "warning", icon: I.warning,
          title: "One line changed while you were here",
          body: esc(l.name) + ": you asked for " + l.qty + " cases and Al Manar Trading now has 3. Nothing else changed. What would you like to do?",
          extra: '<div class="hb-body-sm muted">Your address, documents and payment choice are kept either way.</div>',
          actions: btn("Remove the line", { style: "ghost", intent: "danger", size: "lg", attrs: ' data-act="conflict-remove"' }) +
                   btn("Reduce to 3 and continue", { size: "lg", attrs: ' data-act="conflict-reduce"' })
        });
        renderVerify();
        return;
      }
      finishOrder();
    }, 900);
  }
  function finishOrder(){
    var now = new Date();
    state.order = { ref: "ORD-" + String(now.getTime()).slice(-10), placedAt: now, deadline: new Date(now.getTime() + 48 * 3600 * 1000) };
    state.receipt = null;
    render(); show("paid");
    toast("Order " + state.order.ref + " placed. Bank details are below.", { kind: "ok" });
  }

  /* ---------- Actions ---------- */
  var ACTS = {
    "place-order": placeOrder,
    "edit-branch": function () { state.errors = {}; state.editing.branch = true; renderVerify(); $("#b-name") && $("#b-name").focus(); },
    "cancel-branch": function () { state.errors = {}; state.editing.branch = false; renderVerify(); },
    "save-branch": saveBranch,
    "edit-address": function () { state.errors = {}; state.editing.address = true; renderVerify(); scrollTo("sec-address"); },
    "cancel-address": function () { state.errors = {}; state.editing.address = false; renderVerify(); },
    "save-address": saveAddress,
    "move-pin": function () { toast("The map would let you drag the pin here; the fields fill from it."); },
    "pick-doc": function (el) { pickFile(el.dataset.doc); },
    "view-doc": function (el) { var d = doc(el.dataset.doc); previewFile(d.file, d.label); },
    "remove-doc": function (el) {
      var d = doc(el.dataset.doc), id = el.dataset.doc;
      confirmDialog({ intent: "danger", icon: I.warning, title: "Remove " + d.label + "?",
        body: d.required ? "It is required to place an order — you will need to upload it again." : "You can add it again at any time.",
        actions: btn("Keep it", { style: "ghost", size: "lg", attrs: ' data-act="close-confirm"' }) + btn("Remove", { intent: "danger", size: "lg", attrs: ' data-act="remove-doc-go" data-doc="' + id + '"' }) });
    },
    "remove-doc-go": function (el) { var d = doc(el.dataset.doc); if (d.file && d.file.url) { URL.revokeObjectURL(d.file.url); } d.file = null; closeConfirm(); renderVerify(); toast(d.label + " removed.", { kind: "ok" }); },
    "save-docs": function () { toast("Documents are saved as you add them — nothing else to do.", { kind: "ok" }); },
    "close-confirm": closeConfirm,
    "close-drawer": closeDrawer,
    "conflict-reduce": function () { state.lines[0].qty = 3; closeConfirm(); finishOrder(); },
    "conflict-remove": function () { state.lines.shift(); closeConfirm(); finishOrder(); },
    "copy-all": function () {
      var t = totals();
      copyText(null, BANK.map(function (b) { return b[0] + ": " + b[1]; }).join("\n") + "\nAmount: " + bhd(t.total) + "\nReference: " + state.order.ref + (state.po ? " / " + state.po : ""));
    },
    "pdf": function () { toast("Payment instructions PDF would download here — one page, the same details and reference.", { ms: 4000 }); },
    "send-finance": function () {
      drawer("Send payment instructions",
        '<div class="stack">' + field({ id: "f-email", label: "Email", value: "accounts@buyerbahrain.com", type: "email", req: true }) +
        '<div class="hb-body-sm muted">They receive the bank details, the amount, the reference and a link to upload the receipt — no login needed.</div></div>',
        btn("Cancel", { style: "ghost", attrs: ' data-act="close-drawer"' }) + btn("Send", { attrs: ' data-act="send-finance-go"' }));
    },
    "send-finance-go": function () { closeDrawer(); toast("Sent to " + $("#f-email").value + ".", { kind: "ok" }); },
    "pick-receipt": function () { pickFile("receipt"); },
    "view-receipt": function () { previewFile(state.receipt, "Transfer receipt"); },
    "drop-receipt": function () { if (state.receipt) { URL.revokeObjectURL(state.receipt.url); } state.receipt = null; renderPaid(); },
    "submit-receipt": function () { state.receipt.submitted = true; renderPaid(); toast("Receipt submitted. We check transfers within two working hours.", { kind: "ok" }); },
    "proforma": function () { toast("The pro-forma invoice PDF would download here.", { ms: 3500 }); },
    "print": function () { window.print(); },
    "track": function () { toast("Purchase orders sits outside the two screens this prototype covers."); },
    "shop": function () { toast("The marketplace sits outside the two screens this prototype covers."); }
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
    if (t.dataset.bind === "hasVat") { state.hasVat = t.checked; delete state.errors["tax-no"]; delete state.errors.docs; renderVerify(); if (t.checked) { $("#tax-no") && $("#tax-no").focus(); } return; }
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
  var scen = $("#t-scenario");
  scen.addEventListener("click", function () { state.scenarioStockChange = scen.getAttribute("aria-pressed") !== "true"; scen.setAttribute("aria-pressed", String(state.scenarioStockChange));
    toast(state.scenarioStockChange ? "Scenario on: one line will change stock when you place the order." : "Scenario off."); });
  var dirBtn = $("#t-dir"), dirBtn2 = $("#t-dir-2");
  function toggleDir(){
    var rtl = dirBtn.getAttribute("aria-pressed") !== "true";
    dirBtn.setAttribute("aria-pressed", String(rtl));
    document.documentElement.dir = rtl ? "rtl" : "ltr"; document.documentElement.lang = rtl ? "ar" : "en";
    LANG = rtl ? "ar" : "en"; applyLang();
  }
  dirBtn.addEventListener("click", toggleDir); if (dirBtn2) { dirBtn2.addEventListener("click", toggleDir); }
  window.addEventListener("hashchange", function () { show(location.hash.slice(1) || "verify"); });

  render();
  show(location.hash.slice(1) || "verify");
