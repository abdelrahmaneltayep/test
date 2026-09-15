
  /* ============================================================
     Shared pieces — the same data, forms and upload zones in every version.
     Only the composition differs between A, B and C.
     ============================================================ */
  var COUNTRIES = ["Bahrain", "Saudi Arabia", "Kuwait", "Qatar", "United Arab Emirates", "Oman"];
  var STATES = ["Capital", "Muharraq", "Northern", "Southern"];
  state.version = "a";
  state.step = { a: 0, c: 0 };       // the open step in A and C
  state.open = {};                    // opened cards in B
  state.editing = { branch: false, address: false };

  function err(id){ return state.errors[id] ? { state: "error", msg: I.error + '<span>' + esc(state.errors[id]) + '</span>' } : {}; }
  function withErr(o){ var e = err(o.id); if (e.state) { o.state = e.state; o.msg = e.msg; } return o; }
  function kv(pairs){
    return '<dl class="kv">' + pairs.map(function (p) {
      return '<div class="kv__row"><dt class="hb-label-md">' + p[0] + '</dt><dd class="hb-body-md">' + p[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  /* one-line summaries: what the buyer sees before anything opens */
  function branchLine(){ var b = state.branchDetails; return esc(b.name) + ' · <bdi dir="ltr" class="num">+973 ' + esc(b.phone) + '</bdi> · ' + esc(b.email); }
  function addressLine(){ var a = state.address; return 'Building ' + esc(a.building) + ', Street ' + esc(a.street) + ', ' + esc(a.city) + ', ' + esc(a.state) + ' ' + esc(a.zip) + ', ' + esc(a.country); }
  function docsNeeded(){ return 2 + (state.hasVat ? 1 : 0); }
  function docsOnFile(){ return ["cr", "id"].filter(function (k) { return state.docs[k].file; }).length + (state.hasVat && state.docs.vat.file ? 1 : 0); }
  function docsMissing(){
    var m = ["cr", "id"].filter(function (k) { return !state.docs[k].file; }).map(function (k) { return state.docs[k].label; });
    if (state.hasVat && !state.docs.vat.file) { m.push(state.docs.vat.label); }
    return m;
  }
  function docsLine(){
    var on = docsOnFile(), need = docsNeeded();
    return on >= need ? on + ' of ' + need + ' on file · ' + ["cr", "id"].concat(state.hasVat ? ["vat"] : []).map(function (k) { return esc(state.docs[k].file.name); }).join(', ')
                      : on + ' of ' + need + ' on file · still needed: ' + docsMissing().join(', ');
  }
  function docsOk(){ return docsOnFile() >= docsNeeded() && !(state.hasVat && !state.taxNumber); }

  /* ---------- Branch Details: saved view and edit form ---------- */
  function branchView(){
    var b = state.branchDetails;
    return kv([["Branch Name", esc(b.name)], ["Branch Phone", '<bdi dir="ltr" class="num">+973 ' + esc(b.phone) + '</bdi>'], ["Branch Email", esc(b.email)]]);
  }
  function branchForm(){
    var b = state.branchDetails;
    return '<div class="editform">' +
      '<div class="grid2">' +
        field(withErr({ id: "b-name", label: "Branch Name", value: b.name, req: true, attrs: ' autocomplete="organization"' })) +
        phoneField({ id: "b-phone", label: "Branch Phone", value: b.phone, error: state.errors["b-phone"] }) +
        field(withErr({ id: "b-email", label: "Branch Email", value: b.email, type: "email" })) +
      '</div>' +
      '<div class="row-end">' + btn("Cancel", { style: "ghost", attrs: ' data-act="cancel-branch"' }) + btn("Save Details", { icon: I.save, attrs: ' data-act="save-branch"' }) + '</div>' +
    '</div>';
  }
  function branchBlock(){
    return state.editing.branch ? branchForm() :
      '<div class="saved"><div class="saved__head"><span class="hb-label-lg">Saved Details</span>' + statusChip("active", "Saved") +
        '<span class="spacer"></span>' + btn("Edit Details", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-branch"' }) + '</div>' + branchView() + '</div>';
  }

  /* ---------- Delivery Address ---------- */
  function mapTile(edit){
    return '<div class="map" aria-label="Delivery pin, Block 460, Manama">' + I.location +
      '<span class="map__label hb-label-sm">' + (state.address.pinned ? 'Pin saved · Block 460' : 'No pin yet') + '</span>' +
      (edit ? '<span class="map__act">' + btn("Move pin", { style: "outlined", size: "sm", icon: I.location, attrs: ' data-act="move-pin"' }) + '</span>' : '') + '</div>';
  }
  function addressView(){
    var a = state.address;
    return '<div class="addr">' + kv([["Country", esc(a.country)], ["State / Province", esc(a.state)], ["City", esc(a.city)], ["Street Address", esc(a.street)], ["Building", esc(a.building)], ["ZIP / Postal Code", esc(a.zip)]]) + mapTile(false) + '</div>';
  }
  function addressForm(){
    var a = state.address;
    return '<div class="editform">' +
      '<div class="hb-field"><span class="hb-field__label">Select Address Location <span class="hb-field__req">*</span></span>' + mapTile(true) +
        '<div class="hb-field__msg">Drag the pin or search — the fields below fill from it</div></div>' +
      '<div class="grid2">' +
        field(withErr({ id: "a-country", label: "Country", value: a.country, options: COUNTRIES, req: true })) +
        field(withErr({ id: "a-state", label: "State / Province", value: a.state, options: STATES, req: true })) +
        field(withErr({ id: "a-city", label: "City", value: a.city, req: true })) +
        field(withErr({ id: "a-street", label: "Street Address", value: a.street, req: true })) +
        field(withErr({ id: "a-building", label: "Building Name / Number", value: a.building, req: true })) +
        field(withErr({ id: "a-zip", label: "Postal Code", value: a.zip, attrs: ' inputmode="numeric"' })) +
      '</div>' +
      '<div class="row-end">' + btn("Cancel", { style: "ghost", attrs: ' data-act="cancel-address"' }) + btn("Update Address", { icon: I.save, attrs: ' data-act="save-address"' }) + '</div>' +
    '</div>';
  }
  function addressBlock(){
    return state.editing.address ? addressForm() :
      '<div class="saved"><div class="saved__head"><span class="hb-label-lg">Saved Address</span>' + statusChip("active", "Pin saved") +
        '<span class="spacer"></span>' + btn("Edit Address", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-address"' }) + '</div>' + addressView() + '</div>';
  }

  /* ---------- Business Documents ---------- */
  function uploadZone(id){
    var d = state.docs[id], f = d.file;
    var head = '<div class="upzone__head"><span class="hb-field__label">' + d.label + (d.required ? ' <span class="hb-field__req">*</span>' : '') + '</span>' +
      (f ? statusChip("active", "On file") : d.required ? statusChip("pending", "Required") : statusChip("approved", "Optional")) + '</div>';
    if (state.uploading === id) {
      return '<div class="upzone">' + head + '<div class="hb-upload" data-state="uploading"><div class="hb-upload__files"><div class="hb-upload__file">' +
        '<span class="doc__prev">' + I.file + '</span><div class="hb-upload__file-meta"><span class="hb-upload__name">' + esc(state.uploadName || 'Uploading…') + '</span><span class="hb-upload__size">Uploading…</span>' +
        '<span class="hb-upload__bar"><i class="upzone__bar"></i></span></div></div></div></div></div>';
    }
    if (f) {
      return '<div class="upzone">' + head + '<div class="hb-upload" data-state="uploaded"><div class="hb-upload__files"><div class="hb-upload__file">' +
        '<span class="doc__prev" aria-hidden="true">' + (f.url && f.isImage ? '<img src="' + f.url + '" alt="">' : I.file) + '</span>' +
        '<div class="hb-upload__file-meta"><span class="hb-upload__name">' + esc(f.name) + '</span><span class="hb-upload__size"><span class="num">' + esc(f.size) + '</span> · ' + (f.at ? 'added ' + esc(f.at) : 'just now') + '</span></div>' +
        '<div class="row">' + btn("Preview", { style: "ghost", size: "sm", icon: I.view, attrs: ' data-act="view-doc" data-doc="' + id + '"' }) +
          btn("Replace", { style: "outlined", size: "sm", icon: I.refresh, attrs: ' data-act="pick-doc" data-doc="' + id + '"' }) +
          iconBtn(I.close, "Remove", { intent: "danger", attrs: ' data-act="remove-doc" data-doc="' + id + '"' }) + '</div></div></div></div></div>';
    }
    var e = state.errors["doc-" + id];
    return '<div class="upzone">' + head +
      '<div class="hb-upload" data-state="' + (e ? 'error' : 'ready') + '" tabindex="0" role="button" aria-label="Upload ' + esc(d.label) + '" data-act="pick-doc" data-doc="' + id + '" data-drop="' + id + '">' +
        '<span class="hb-upload__icon">' + (e ? I.error : I.upload) + '</span>' +
        '<span class="hb-upload__title">' + (e ? esc(e) : 'Upload ' + esc(d.label)) + '</span>' +
        '<span class="hb-upload__hint">' + (e ? 'Choose another file' : 'Drop the file here or click to choose') + '</span>' +
        '<span class="hb-upload__max">PDF, JPG or PNG · up to 10 MB</span></div></div>';
  }
  function docsBlock(o){
    o = o || {};
    return '<div class="stack">' +
      (state.errors.docs ? alert("error", '<span class="hb-alert__title">' + esc(state.errors.docs) + '</span>') : '') +
      '<div class="grid2">' +
        '<div class="stack">' + field({ id: "cr-no", label: "CR Number", value: state.crNumber, attrs: ' readonly', state: "disabled" }) + uploadZone("cr") + '</div>' +
        '<div class="stack">' +
          (state.hasVat
            ? '<div class="hb-field"><span class="hb-field__label">VAT registration</span>' + check("has-vat", true, "Have VAT certificate", ' data-bind="hasVat"') + '</div>' +
              field(withErr({ id: "tax-no", label: "Tax Number", value: state.taxNumber, placeholder: "Enter Tax Number", req: true, attrs: ' data-bind="taxNumber" inputmode="numeric"' })) + uploadZone("vat")
            : (o.vatAsLink
                ? '<div class="hb-field"><span class="hb-field__label">VAT registration</span><button type="button" class="disclose hb-body-md" data-act="show-vat">' + I.add + 'Add a VAT certificate (optional)</button><div class="hb-field__msg">Only if you want to reclaim VAT on the tax invoice</div></div>'
                : '<div class="hb-field"><span class="hb-field__label">VAT registration</span>' + check("has-vat", false, "Have VAT certificate", ' data-bind="hasVat"') + '<div class="hb-field__msg">Optional. Needed to reclaim VAT on the tax invoice.</div></div>')) +
        '</div>' +
      '</div>' + uploadZone("id") +
    '</div>';
  }

  /* ---------- Order summary rail, shared ---------- */
  function railTotals(){
    var t = totals();
    return '<div class="row"><span class="hb-avatar" data-shape="square" data-size="32">' + state.supplier.initials + '</span>' +
        '<div class="line__name"><div class="hb-title-sm">' + esc(state.supplier.name) + '</div><div class="hb-body-sm muted">' + t.lines + ' lines · ' + esc(state.slot.day) + '</div></div></div>' +
      '<dl class="sum hb-body-md">' +
        '<div class="sum__row"><dt>Items</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
        '<div class="sum__row"><dt>Delivery</dt><dd class="num">' + bhd(t.delivery) + '</dd></div>' +
        (t.discount ? '<div class="sum__row" data-save><dt>' + esc(state.coupon.code) + '</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
        '<div class="sum__row"><dt>VAT 10%</dt><dd class="num">' + bhd(t.vat) + '</dd></div></dl>' +
      '<hr class="hb-divider" data-orientation="horizontal">' +
      '<dl class="sum__total"><dt class="hb-title-md">Total</dt><dd><span class="hb-headline-sm num">' + bhd(t.total) + '</span><span class="hb-body-sm muted">Highbase Payment · bank transfer</span></dd></dl>';
  }
  function placeBtn(o){
    o = o || {};
    return btn(state.placing ? "Checking stock…" : (o.label || "Place Order"), { size: "lg", block: true, icon: state.placing ? I.refresh : I.chevronRight, attrs: ' data-act="place-order"' + (state.placing ? ' data-state="loading" aria-busy="true"' : '') });
  }
  function rail(extra){
    return '<aside class="rail"><div class="panel"><div class="panel__head"><h2 class="hb-title-md">Order summary</h2></div>' +
      '<div class="panel__body stack">' + railTotals() + (extra || '') + placeBtn() +
      '<p class="hb-body-sm muted" style="text-align:center">Next: bank details for the transfer.</p></div></div></aside>';
  }
  function pageHead(){
    return '<div class="hb-pagehead" style="margin:var(--hb-space-16) 0"><div class="hb-pagehead__row">' +
      '<h1 class="hb-pagehead__title hb-headline-md" data-ar="التحقق قبل الطلب">Checkout Verification</h1></div>' +
      '<p class="hb-pagehead__desc hb-body-md">Confirm your shipping address, then review business documents before placing your order.</p></div>';
  }
