
  /* ============================================================
     Receipt handling — a real file, previewed from the browser
     ============================================================ */
  var fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) { takeFile(fileInput.files[0]); }
    fileInput.value = "";
  });

  function takeFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      toast("That file is over 10 MB. Try a smaller scan or a PDF.", { kind: "bad" });
      return;
    }
    var ok = /pdf$/i.test(file.type) || /^image\//.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!ok) {
      toast("Receipts must be a PDF, JPG or PNG.", { kind: "bad" });
      return;
    }
    if (state.order.receipt && state.order.receipt.url) { URL.revokeObjectURL(state.order.receipt.url); }
    state.order.receipt = {
      name: file.name,
      size: file.size < 1024 * 1024
        ? Math.max(1, Math.round(file.size / 1024)) + " KB"
        : (file.size / 1024 / 1024).toFixed(1) + " MB",
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isImage: /^image\//.test(file.type),
      url: URL.createObjectURL(file)
    };
    renderConfirm();
    toast("Receipt attached. Submit it to finish the payment.", { kind: "ok" });
  }

  function wireDrop() {
    var drop = $("#drop");
    if (!drop) { return; }
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) { takeFile(e.dataTransfer.files[0]); }
    });
  }

  function previewReceipt() {
    var r = state.order && state.order.receipt;
    if (!r) { return; }
    modal(r.name,
      r.isImage
        ? '<img src="' + r.url + '" alt="Uploaded receipt" style="max-height:60vh;margin:0 auto;border-radius:8px">'
        : '<div class="empty" style="padding:36px 20px">📄<br><br><b>' + esc(r.name) + '</b><br>' +
          '<span class="num">' + r.size + '</span> · PDF<br><br>' +
          'PDFs open in your own reader — the prototype shows the file card rather than embedding it.</div>',
      '<button class="btn btn--primary" data-act="close-modal">Close</button>');
  }

  /* ============================================================
     Placing the order — snapshot the cart, then clear what shipped
     ============================================================ */
  function placeOrder() {
    var t = totals();
    if (!t.ready.length) {
      toast("Nothing is ready to order yet.", { kind: "bad" });
      return;
    }
    var now = new Date();
    var expiry = new Date(now.getTime() + 48 * 3600 * 1000);
    var addr = state.addresses.filter(function (a) { return a.id === state.checkout.addr; })[0];

    state.order = {
      ref: "ORD-" + String(Date.now()).slice(-13),
      placedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      placedOn: now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }),
      expiry: expiry.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) + ", " +
              expiry.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      deadline: expiry.getTime(),
      groups: t.ready.map(function (sup) {
        return { name: sup.name, items: sup.items.filter(function (it) { return it.sel; })
          .map(function (it) { return { sku: it.sku, name: it.name, qty: it.qty, per: it.per, price: it.price }; }) };
      }),
      lines: t.lines, items: t.items, delivery: t.delivery + t.slotFee,
      discount: t.discount, vat: t.vat, total: t.total,
      day: state.checkout.day, time: state.checkout.time,
      payment: state.checkout.payment, po: state.checkout.po,
      costCentre: state.checkout.costCentre, address: addr,
      paid: false, paidAt: null, receipt: null
    };

    // What shipped leaves the cart; what wasn't ready stays.
    t.ready.forEach(function (sup) {
      sup.items = sup.items.filter(function (it) { return !it.sel; });
    });
    state.applied = [];
    render();
    show("confirm");
    startCountdown();
  }

  var cdTimer = null;
  function startCountdown() {
    if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    var out = $("#countdown") && $("#countdown").querySelector(".num");
    if (!out || !state.order || state.order.paid) { return; }
    var tick = function () {
      if (!state.order || state.order.paid) { clearInterval(cdTimer); cdTimer = null; return; }
      var left = Math.max(0, Math.floor((state.order.deadline - Date.now()) / 1000));
      var pad = function (n) { return String(n).padStart(2, "0"); };
      out.textContent = pad(Math.floor(left / 3600)) + ":" + pad(Math.floor((left % 3600) / 60)) + ":" + pad(left % 60);
      if (left === 0) { clearInterval(cdTimer); cdTimer = null; }
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ============================================================
     Decorative payment QR (illustrative, not a scannable code)
     ============================================================ */
  function drawQR(seedRef) {
    var qr = $("#qr");
    if (!qr) { return; }
    var N = 25, seed = 0;
    for (var c = 0; c < seedRef.length; c++) { seed = (seed * 31 + seedRef.charCodeAt(c)) % 2147483647; }
    var rand = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    var corners = [[0, 0], [0, N - 7], [N - 7, 0]];
    var finder = function (r, c2) {
      return corners.some(function (o) {
        var dr = r - o[0], dc = c2 - o[1];
        if (dr < 0 || dr > 6 || dc < 0 || dc > 6) { return false; }
        return Math.max(Math.abs(dr - 3), Math.abs(dc - 3)) !== 2;
      });
    };
    var near = function (r, c2) {
      return corners.some(function (o) {
        return r >= o[0] - 1 && r <= o[0] + 7 && c2 >= o[1] - 1 && c2 <= o[1] + 7;
      });
    };
    var cells = "";
    for (var r = 0; r < N; r++) {
      for (var cc = 0; cc < N; cc++) {
        if (finder(r, cc) || (!near(r, cc) && rand() > 0.5)) {
          cells += '<rect x="' + cc + '" y="' + r + '" width="1" height="1"/>';
        }
      }
    }
    qr.innerHTML = '<svg viewBox="0 0 ' + N + ' ' + N + '" width="100%" height="100%" ' +
      'shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">' + cells + "</svg>";
  }
