
  /* ============================================================
     Screens, language, files, and one delegated listener
     ============================================================ */
  var screens = ["a", "b", "c", "why"];
  function show(name){
    if (screens.indexOf(name) === -1) { name = "a"; }
    state.version = name;
    screens.forEach(function (sc) { $("#screen-" + sc).hidden = (sc !== name); });
    $$(".proto-nav .hb-btn").forEach(function (b) { b.setAttribute("aria-current", String(b.dataset.screen === name)); });
    window.scrollTo(0, 0);
    if (location.hash.slice(1) !== name) { try { history.replaceState(null, "", "#" + name); } catch (err) { /* sandboxed */ } }
  }
  function renderPay(){ renderA(); renderB(); renderC(); applyLang(); wireDrop(); }
  function render(){ renderPay(); renderWhy(); }

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

  /* ---------- The receipt is a real file, previewed from the browser ---------- */
  var fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/*"; fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) { takeFile(fileInput.files[0]); }
    fileInput.value = "";
  });
  function describe(file){
    return { name: file.name,
      size: file.size < 1024 * 1024 ? Math.max(1, Math.round(file.size / 1024)) + " KB" : (file.size / 1024 / 1024).toFixed(1) + " MB",
      isImage: /^image\//.test(file.type), url: URL.createObjectURL(file) };
  }
  function takeFile(file){
    var reject = null;
    if (file.size > 10 * 1024 * 1024) { reject = "That file is over 10 MB — try a screenshot or a smaller PDF"; }
    else if (!(/pdf$/i.test(file.type) || /^image\//.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name))) {
      reject = "Only PDF, JPG or PNG files are accepted";
    }
    if (reject) {
      /* refused in the zone itself, where the buyer is looking — not only as a toast */
      state.error = reject; renderPay(); return;
    }
    state.error = null;
    state.uploading = true; state.uploadName = file.name;
    renderPay();
    setTimeout(function () {
      if (state.receipt && state.receipt.url) { URL.revokeObjectURL(state.receipt.url); }
      state.receipt = describe(file);
      state.uploading = false;
      state.transferred = true;    /* a receipt implies the transfer was made */
      renderPay();
      toast("Receipt sent. We will confirm within one working day.", { kind: "ok" });
    }, 950);
  }
  /* drag and drop onto the zone, which is what a buyer with a screenshot reaches for */
  function wireDrop(){
    $$("[data-drop]").forEach(function (zone) {
      ["dragenter", "dragover"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("is-over"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("is-over"); });
      });
      zone.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) { takeFile(e.dataTransfer.files[0]); }
      });
    });
  }
  function previewReceipt(){
    var f = state.receipt;
    if (!f) { return; }
    drawer("Transfer receipt", '<div class="stack">' +
      (f.isImage && f.url
        ? '<img src="' + f.url + '" alt="' + esc(f.name) + '" style="max-height:52vh;margin:0 auto;border-radius:var(--hb-radius-8)">'
        : '<div class="hb-empty"><span class="hb-empty__art">' + I.file + '</span>' +
          '<div class="hb-empty__title hb-title-md">' + esc(f.name) + '</div>' +
          '<div class="hb-empty__text hb-body-sm">' + esc(f.size) + ' · this file type opens in your own reader.</div></div>') +
      '<p class="hb-body-sm muted" style="text-align:center">' + esc(f.name) + ' · ' + esc(f.size) + '</p></div>',
      btn("Close", { style: "ghost", attrs: ' data-act="close-drawer"' }));
  }

  /* ---------- Actions ---------- */
  var ACTIONS = {
    "goto": function (el) { show(el.dataset.screen); },
    /* every value here has to be retyped into a banking app, so all of them copy.
       The clipboard is not available on every origin — a failure is reported, never claimed. */
    "copy": function (el) {
      var v = el.dataset.value, label = el.dataset.label || "value";
      var ok = function () { toast("Copied the " + label + "."); };
      var no = function () { toast("Could not copy — select the " + label + " instead.", { kind: "bad" }); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(v).then(ok, no); }
      else { no(); }
    },
    "toggle-qr": function () { state.qrOpen = !state.qrOpen; renderPay(); },
    /* the small tile is the QR's place on the page; this is the same code at scanning size */
    "open-qr": function () {
      drawer("Pay by QR", '<div class="stack">' + qrBlock() +
        '<p class="hb-body-sm muted">The code carries the account, the amount and the reference, so the transfer opens already filled in.</p>' +
        '</div>', btn("Close", { style: "ghost", size: "lg", attrs: ' data-act="close-drawer"' }), "sm");
    },
    "pay-tab": function (el) { state.payTab = el.dataset.tab; renderPay(); },
    "open-step": function (el) {
      var id = Number(el.dataset.step);
      if (stepState(id) === "next") { toast("Finish the step before it first.", { kind: "bad" }); return; }
      state.step = id; renderPay();
    },
    "mark-transferred": function () {
      state.transferred = true; state.step = 3; renderPay();
      toast("Marked as transferred. Send the receipt to finish.");
      var zone = $("#screen-" + state.version + " [data-drop]");
      if (zone) { zone.scrollIntoView({ block: "center" }); }
    },
    "pick-receipt": function () { fileInput.click(); },
    "view-receipt": previewReceipt,
    "remove-receipt": function () {
      confirmDialog({
        intent: "danger", icon: I.warning, title: "Remove the receipt?",
        body: "We will not be able to match your transfer until another one is sent.",
        actions: btn("Keep it", { style: "ghost", attrs: ' data-act="close-confirm"' }) +
          btn("Remove", { intent: "danger", attrs: ' data-act="remove-receipt-go"' })
      });
    },
    "remove-receipt-go": function () {
      if (state.receipt && state.receipt.url) { URL.revokeObjectURL(state.receipt.url); }
      state.receipt = null; closeConfirm(); renderPay();
      toast("Receipt removed.", { kind: "ok" });
    },
    "close-confirm": closeConfirm,
    "close-drawer": closeDrawer,
    /* the two page-level destinations are inert here: this prototype is one screen
       of the flow, not the order page or the marketplace (proposal) */
    "track": function () { toast("The order page is outside this prototype."); },
    "market": function () { toast("The marketplace is outside this prototype."); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (el && ACTIONS[el.dataset.act]) { ACTIONS[el.dataset.act](el); return; }
    var nav = e.target.closest(".proto-nav .hb-btn");
    if (nav) { show(nav.dataset.screen); }
  });

  /* ---------- Review chrome (proposal): annotations, direction, breakpoint ---------- */
  $("#t-notes").addEventListener("click", function () {
    state.notes = !state.notes;
    document.body.classList.toggle("no-notes", !state.notes);
    this.setAttribute("aria-pressed", String(state.notes));
  });
  function setDir(rtl){
    LANG = rtl ? "ar" : "en";
    document.documentElement.lang = rtl ? "ar" : "en";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    $("#t-dir").setAttribute("aria-pressed", String(rtl));
    applyLang();
  }
  $("#t-dir").addEventListener("click", function () { setDir(document.documentElement.dir !== "rtl"); });
  var dir2 = $("#t-dir-2");
  if (dir2) { dir2.addEventListener("click", function () { setDir(document.documentElement.dir !== "rtl"); }); }

  /* The Header carries its own compact behaviour, but four things are the page's to set:
     the size axis, the Logo's mark, the Avatar's size and the Search's compressed style.
     Without the last one the logo keeps its wordmark width and the row overflows at 390. */
  var mqCompact = window.matchMedia("(max-width: 743px)");
  function syncHeader(){
    var compact = mqCompact.matches;
    var h = $(".hb-header"), f = $(".hb-footer");
    if (h) { h.dataset.size = compact ? "compact" : "expanded"; }
    if (f) { f.dataset.size = window.innerWidth < 1280 ? "compact" : "expanded"; }
    var logo = $("#h-logo .hb-logo"); if (logo) { logo.dataset.type = compact ? "mark" : "wordmark"; }
    var av = $("#h-avatar"); if (av) { av.dataset.size = compact ? "32" : "40"; }
    var search = $(".hb-header .hb-search"); if (search) { search.dataset.style = compact ? "compressed" : "default"; }
  }
  if (mqCompact.addEventListener) { mqCompact.addEventListener("change", syncHeader); } else { mqCompact.addListener(syncHeader); }
  window.addEventListener("resize", syncHeader);
  var toTop = $("#to-top");
  window.addEventListener("scroll", function () { toTop.hidden = window.scrollY < 320; });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });

  /* the review shell is addressable: the hash names the version on screen */
  window.addEventListener("hashchange", function () { show((location.hash || "#a").slice(1)); });

  /* ---------- Go ---------- */
  syncHeader();
  render();
  show((location.hash || "#a").slice(1));
