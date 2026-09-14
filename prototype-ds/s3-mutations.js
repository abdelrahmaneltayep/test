
  /* ============================================================
     Lookups and mutations
     ============================================================ */
  function find(ref) {
    var parts = ref.split(":"), sup = null, item = null;
    state.suppliers.forEach(function (sp) {
      if (sp.id === parts[0]) {
        sup = sp;
        sp.items.forEach(function (it) { if (it.sku === parts[1]) { item = it; } });
      }
    });
    return { sup: sup, item: item };
  }

  function render() {
    // The evaluation sheet is static content; paint it once.
    var why = $("#screen-why");
    if (why && !why.firstElementChild) { why.innerHTML = EVAL_HTML; }
    renderCart();
    renderCartSummary();
    renderCheckout();
    if (state.order) { renderConfirm(); }
    applyLang();
  }

  function setQty(ref, qty) {
    var f = find(ref);
    if (!f.item) { return; }
    f.item.qty = Math.max(1, Math.min(999, qty || 1));
    render();
  }

  function removeItem(ref, silent) {
    var f = find(ref);
    if (!f.item) { return; }
    var idx = f.sup.items.indexOf(f.item);
    state.undo = { sup: f.sup, items: [{ item: f.item, idx: idx }] };
    f.sup.items.splice(idx, 1);
    render();
    if (!silent) {
      toast("Removed " + short(f.item.name) + ".", { action: "Undo", onAction: undoRemove });
    }
  }
  function undoRemove() {
    if (!state.undo) { return; }
    state.undo.items.slice().reverse().forEach(function (e) {
      state.undo.sup.items.splice(Math.min(e.idx, state.undo.sup.items.length), 0, e.item);
    });
    state.undo = null;
    render();
    toast("Restored.", { kind: "ok" });
  }
