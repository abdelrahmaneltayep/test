
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
    if (file.size > 10 * 1024 * 1024) { toast("That file is over 10 MB. Try a smaller scan or a PDF.", { kind: "bad" }); return; }
    var ok = /pdf$/i.test(file.type) || /^image\//.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!ok) { toast("Documents must be a PDF, JPG or PNG.", { kind: "bad" }); return; }
    if (fileTarget === "receipt") {
      if (state.receipt && state.receipt.url) { URL.revokeObjectURL(state.receipt.url); }
      state.receipt = describe(file);
      renderPaid();
      toast("Receipt attached. Submit it to move the order on.", { kind: "ok" });
    } else {
      var d = doc(fileTarget);
      if (!d) { return; }
      d.file = describe(file); d.status = "verified"; d.until = null; d.meta = d.meta.replace(/Optional ·.*$/, "Submitted · under review");
      closeDrawer(); renderVerify();
      toast(d.name + " added. It is reviewed within one working day and kept on the account.", { kind: "ok" });
    }
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
    drawer(title, f.isImage
      ? '<img src="' + f.url + '" alt="' + esc(f.name) + '" style="max-height:60vh;margin:0 auto;border-radius:var(--hb-radius-8)">'
      : '<div class="hb-empty"><span class="hb-empty__art">' + I.file + '</span><div class="hb-empty__title hb-title-md">' + esc(f.name) + '</div><div class="hb-empty__text hb-body-sm">' + esc(f.size) + ' · PDF. PDFs open in your own reader; the prototype shows the file card.</div></div>',
      btn("Close", { style: "ghost", attrs: ' data-act="close-drawer"' }));
  }

  /* ---------- Drawers ---------- */
  function editBranchDrawer(){
    var b = branch();
    drawer("Deliver to",
      '<div class="stack">' +
        '<div class="hb-label-lg">Saved branches</div>' +
        state.branches.map(function (x) {
          return radio("branch", x.id, x.id === state.branch, esc(x.name), x.lines.join(", ") + ' · ' + esc(x.hours), { tag: x.pinned ? chip("Pin saved", { style: "tonal", size: "sm", icon: I.location }) : '' });
        }).join('') +
        '<hr class="hb-divider" data-orientation="horizontal">' +
        '<div class="hb-label-lg">Contact for this delivery</div>' +
        field({ id: "e-contact", label: "Receiving contact", value: b.contact, req: true }) +
        phoneField({ id: "e-phone", label: "Phone", value: b.phone.replace(/^\+973\s?/, "") }) +
        field({ id: "e-email", label: "Email for the delivery note", value: b.email, type: "email" }) +
        '<div class="hb-field hb-textfield"><label class="hb-field__label" for="e-notes">Delivery instructions</label>' +
          '<div class="hb-field__control"><textarea class="hb-field__input" id="e-notes" rows="2" placeholder="Gate code, receiving contact, pallet requirements…">' + esc(state.notes) + '</textarea></div></div>' +
      '</div>',
      btn("Cancel", { style: "ghost", attrs: ' data-act="close-drawer"' }) + btn("Save", { attrs: ' data-act="save-branch"' }));
  }
  function uploadDocDrawer(id){
    var d = doc(id);
    drawer(d.file ? "Replace " + d.name.toLowerCase() : "Add " + d.name.toLowerCase(),
      '<div class="stack">' +
        '<p class="hb-body-md">' + (d.status === "expiring" ? "The current document expires on " + esc(d.until) + ". Upload the renewed one and the old copy stays on file until it is verified." : "Reviewed within one working day and kept on the account — you will not be asked again.") + '</p>' +
        '<div class="hb-upload" data-state="ready" tabindex="0" role="button" data-act="pick-doc" data-doc="' + id + '">' +
          '<span class="hb-upload__icon">' + I.upload + '</span><span class="hb-upload__title">Drop the document here</span>' +
          '<span class="hb-upload__hint">or click to choose a file</span><span class="hb-upload__max">PDF, JPG or PNG · up to 10 MB · all pages, legible</span></div>' +
        (d.file ? '<div class="hb-li"><span class="doc__prev">' + (d.file.url && d.file.isImage ? '<img src="' + d.file.url + '" alt="">' : I.file) + '</span><div class="hb-li__body"><div class="hb-li__title hb-body-md">' + esc(d.file.name) + '</div><div class="hb-body-sm muted num">' + esc(d.file.size) + ' · current</div></div></div>' : '') +
      '</div>',
      btn("Cancel", { style: "ghost", attrs: ' data-act="close-drawer"' }));
  }

  /* ---------- Placing the order ---------- */
  function placeOrder(){
    if (!state.agree) { toast("Please accept the supply terms first.", { kind: "bad" }); return; }
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
    "recheck": function () { state.checkedAt = "just now"; renderVerify(); toast("Stock and minimums re-checked — nothing changed.", { kind: "ok" }); },
    "edit-branch": editBranchDrawer,
    "save-branch": function () {
      var picked = $('input[name="branch"]:checked'); if (picked) { state.branch = picked.value; }
      var b = branch();
      b.contact = $("#e-contact").value.trim() || b.contact;
      b.phone = "+973 " + $("#e-phone").value.trim();
      b.email = $("#e-email").value.trim() || b.email;
      state.notes = $("#e-notes").value;
      closeDrawer(); renderVerify(); toast("Delivery details updated.", { kind: "ok" });
    },
    "upload-doc": function (el) { uploadDocDrawer(el.dataset.doc); },
    "pick-doc": function (el) { pickFile(el.dataset.doc); },
    "view-doc": function (el) { var d = doc(el.dataset.doc); previewFile(d.file.url ? d.file : { name: d.file.name, size: d.file.size, isImage: false }, d.name); },
    "toggle-lines": function () { state.showLines = !state.showLines; renderVerify(); },
    "terms": function () { drawer("Supply terms", '<p class="hb-body-md">Summary of the Highbase supply terms would appear here. The prototype shows the pattern: terms open in a Drawer, never a new tab that loses the checkout.</p>', btn("Close", { style: "ghost", attrs: ' data-act="close-drawer"' })); },
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
    if (t.name === "pay" && t.checked) { state.payment = t.value; renderVerify(); return; }
    if (t.dataset.bind === "agree") { state.agree = t.checked; renderVerify(); return; }
    if (t.dataset.bind === "invoiceEmail") { state.invoiceEmail = t.checked; return; }
    if (t.dataset.bind === "po") { state.po = t.value.trim(); return; }   // no re-render: the field keeps focus
  });
  document.addEventListener("input", function (e) { if (e.target.dataset.bind === "po") { state.po = e.target.value.trim(); } });

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
