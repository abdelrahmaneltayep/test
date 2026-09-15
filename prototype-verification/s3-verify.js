
  /* ============================================================
     Screen 1 — Checkout Verification. The live page's sections and values,
     kept as they are: Branch Details · Delivery Address · Business Documents.
     The work is in how each is edited and how files upload.
     ============================================================ */
  var COUNTRIES = ["Bahrain", "Saudi Arabia", "Kuwait", "Qatar", "United Arab Emirates", "Oman"];
  var STATES = ["Capital", "Muharraq", "Northern", "Southern"];

  function stepper(now){
    var steps = ["Cart", "Review", "Address & Documents", "Pay"];
    return '<nav class="steps hb-label-lg" aria-label="Checkout progress">' + steps.map(function (s, i) {
      var st = i < now ? "done" : i === now ? "now" : "";
      return '<span class="step"' + (st ? ' data-state="' + st + '"' : '') + (st === "now" ? ' aria-current="step"' : '') + '>' +
        '<span class="step__no hb-label-md">' + (st === "done" ? I.check : (i + 1)) + '</span><span>' + s + '</span></span>' +
        (i < steps.length - 1 ? '<span class="step__bar" aria-hidden="true"></span>' : '');
    }).join('') + '</nav>';
  }

  /* A saved value is a definition list: label in on-surface-variant, value in on-surface. */
  function kv(pairs){
    return '<dl class="kv">' + pairs.map(function (p) {
      return '<div class="kv__row"><dt class="hb-label-md">' + p[0] + '</dt><dd class="hb-body-md' + (p[2] ? ' ' + p[2] : '') + '">' + p[1] + '</dd></div>';
    }).join('') + '</dl>';
  }
  function err(id){ return state.errors[id] ? { state: "error", msg: I.error + '<span>' + esc(state.errors[id]) + '</span>' } : {}; }
  function withErr(o){ var e = err(o.id); if (e.state) { o.state = e.state; o.msg = e.msg; } return o; }

  /* ---------- Branch Details ---------- */
  function branchDetails(){
    var b = state.branchDetails;
    var body = state.editing.branch
      ? '<div class="editform">' +
          '<div class="grid2">' +
            field(withErr({ id: "b-name", label: "Branch Name", value: b.name, req: true, attrs: ' autocomplete="organization"' })) +
            phoneField({ id: "b-phone", label: "Branch Phone", value: b.phone, error: state.errors["b-phone"] }) +
            field(withErr({ id: "b-email", label: "Branch Email", value: b.email, type: "email", msg: state.errors["b-email"] ? undefined : "Delivery notes and the tax invoice go here" })) +
          '</div>' +
          '<div class="row-end">' + btn("Cancel", { style: "ghost", attrs: ' data-act="cancel-branch"' }) + btn("Save Details", { icon: I.save, attrs: ' data-act="save-branch"' }) + '</div>' +
        '</div>'
      : '<div class="saved">' +
          '<div class="saved__head"><span class="hb-label-lg">Saved Details</span>' + statusChip("active", "Saved") +
            '<span class="spacer"></span>' + btn("Edit Details", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-branch"' }) + '</div>' +
          kv([["Branch Name", esc(b.name)], ["Branch Phone", '<bdi dir="ltr" class="num">+973 ' + esc(b.phone) + '</bdi>'], ["Branch Email", esc(b.email)]]) +
        '</div>';
    return '<section class="panel" id="sec-branch">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="بيانات الفرع">Branch Details' + pin(3) + '</h2></div>' +
      '<div class="panel__body">' + body + '</div></section>';
  }

  /* ---------- Delivery Address ---------- */
  function mapTile(){
    return '<div class="map" aria-label="Delivery pin, Block 460, Manama">' + I.location +
      '<span class="map__label hb-label-sm">' + (state.address.pinned ? 'Pin saved · Block 460' : 'No pin yet') + '</span>' +
      (state.editing.address ? '<span class="map__act">' + btn("Move pin", { style: "outlined", size: "sm", icon: I.location, attrs: ' data-act="move-pin"' }) + '</span>' : '') +
    '</div>';
  }
  function deliveryAddress(){
    var a = state.address;
    var body = state.editing.address
      ? '<div class="editform">' +
          '<div class="hb-field"><span class="hb-field__label">Select Address Location <span class="hb-field__req">*</span></span>' + mapTile() +
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
        '</div>'
      : '<div class="saved">' +
          '<div class="saved__head"><span class="hb-label-lg">Saved Address</span>' + statusChip("active", "Pin saved") +
            '<span class="spacer"></span>' + btn("Edit Address", { style: "outlined", size: "sm", icon: I.edit, attrs: ' data-act="edit-address"' }) + '</div>' +
          '<div class="addr">' +
            kv([["Country", esc(a.country)], ["State / Province", esc(a.state)], ["City", esc(a.city)], ["Street Address", esc(a.street)], ["Building", esc(a.building)], ["ZIP / Postal Code", esc(a.zip)]]) +
            mapTile() +
          '</div>' +
        '</div>';
    return '<section class="panel" id="sec-address">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="عنوان التوصيل">Delivery Address' + pin(2) + '</h2></div>' +
      '<div class="panel__body">' + body + '</div></section>';
  }

  /* ---------- Business Documents ---------- */
  function uploadZone(id){
    var d = state.docs[id], f = d.file;
    var head = '<div class="upzone__head"><span class="hb-field__label">' + d.label + (d.required ? ' <span class="hb-field__req">*</span>' : '') + '</span>' +
      (f ? statusChip("active", "On file") : d.required ? statusChip("pending", "Required") : statusChip("approved", "Optional")) + '</div>';
    if (state.uploading === id) {
      return '<div class="upzone">' + head +
        '<div class="hb-upload" data-state="uploading"><div class="hb-upload__files"><div class="hb-upload__file">' +
          '<span class="doc__prev">' + I.file + '</span>' +
          '<div class="hb-upload__file-meta"><span class="hb-upload__name">' + esc(state.uploadName || 'Uploading…') + '</span><span class="hb-upload__size">Uploading…</span>' +
          '<span class="hb-upload__bar"><i class="upzone__bar"></i></span></div></div></div></div></div>';
    }
    if (f) {
      return '<div class="upzone">' + head +
        '<div class="hb-upload" data-state="uploaded"><div class="hb-upload__files"><div class="hb-upload__file">' +
          '<span class="doc__prev" aria-hidden="true">' + (f.url && f.isImage ? '<img src="' + f.url + '" alt="">' : I.file) + '</span>' +
          '<div class="hb-upload__file-meta"><span class="hb-upload__name">' + esc(f.name) + '</span>' +
            '<span class="hb-upload__size"><span class="num">' + esc(f.size) + '</span> · ' + (f.at ? 'added ' + esc(f.at) : 'just now') + '</span></div>' +
          '<div class="row">' +
            btn("Preview", { style: "ghost", size: "sm", icon: I.view, attrs: ' data-act="view-doc" data-doc="' + id + '"' }) +
            btn("Replace", { style: "outlined", size: "sm", icon: I.refresh, attrs: ' data-act="pick-doc" data-doc="' + id + '"' }) +
            iconBtn(I.close, "Remove", { intent: "danger", attrs: ' data-act="remove-doc" data-doc="' + id + '"' }) +
          '</div></div></div></div></div>';
    }
    var e = state.errors["doc-" + id];
    return '<div class="upzone">' + head +
      '<div class="hb-upload" data-state="' + (e ? 'error' : 'ready') + '" tabindex="0" role="button" aria-label="Upload ' + esc(d.label) + '" data-act="pick-doc" data-doc="' + id + '" data-drop="' + id + '">' +
        '<span class="hb-upload__icon">' + (e ? I.error : I.upload) + '</span>' +
        '<span class="hb-upload__title">' + (e ? esc(e) : 'Upload ' + esc(d.label)) + '</span>' +
        '<span class="hb-upload__hint">' + (e ? 'Choose another file' : 'Drop the file here or click to choose') + '</span>' +
        '<span class="hb-upload__max">PDF, JPG or PNG · up to 10 MB · all pages, legible</span>' +
      '</div></div>';
  }
  function businessDocuments(){
    var onFile = ["cr", "id"].filter(function (k) { return state.docs[k].file; }).length + (state.hasVat && state.docs.vat.file ? 1 : 0);
    var need = 2 + (state.hasVat ? 1 : 0);
    return '<section class="panel" id="sec-docs">' +
      '<div class="panel__head"><h2 class="hb-title-md" data-ar="مستندات المنشأة">Business Documents' + pin(4) + '</h2>' +
        chip("Step 2", { style: "tonal", size: "sm" }) +
        statusChip(onFile >= need ? "active" : "pending", onFile + ' of ' + need + ' on file') + '</div>' +
      '<div class="panel__body stack">' +
        (state.errors.docs ? alert("error", '<span class="hb-alert__title">' + esc(state.errors.docs) + '</span>') : '') +
        '<div class="grid2">' +
          '<div class="stack">' +
            field({ id: "cr-no", label: "CR Number", value: state.crNumber, attrs: ' readonly', state: "disabled", msg: "From your commercial registration — contact support to change it" }) +
            uploadZone("cr") +
          '</div>' +
          '<div class="stack">' +
            '<div class="hb-field"><span class="hb-field__label">VAT registration</span>' +
              check("has-vat", state.hasVat, "Have VAT certificate", ' data-bind="hasVat"') +
              '<div class="hb-field__msg">Optional. Needed to reclaim VAT on the tax invoice.</div></div>' +
            (state.hasVat
              ? field(withErr({ id: "tax-no", label: "Tax Number", value: state.taxNumber, placeholder: "Enter Tax Number", req: true, attrs: ' data-bind="taxNumber" inputmode="numeric"' })) + uploadZone("vat")
              : '') +
          '</div>' +
        '</div>' +
        uploadZone("id") + pin(5) +
      '</div>' +
      '<div class="panel__foot"><span class="hb-body-sm muted">Documents save to your account as you add them and are reviewed within one working day — you will not be asked for them on the next order.</span>' +
        '<span class="spacer"></span>' + btn("Save Documents", { style: "outlined", size: "sm", icon: I.save, attrs: ' data-act="save-docs"' }) + '</div>' +
    '</section>';
  }

  /* ---------- Summary rail ---------- */
  function summaryRail(){
    var t = totals();
    return '<aside class="rail">' +
      '<div class="panel">' +
        '<div class="panel__head"><h2 class="hb-title-md" data-ar="ملخص الطلب">Order summary' + pin(7) + '</h2></div>' +
        '<div class="panel__body stack">' +
          '<div class="row"><span class="hb-avatar" data-shape="square" data-size="32">' + state.supplier.initials + '</span>' +
            '<div class="line__name"><div class="hb-title-sm">' + esc(state.supplier.name) + '</div><div class="hb-body-sm muted">' + t.lines + ' lines · ' + esc(state.slot.day) + '</div></div></div>' +
          '<dl class="sum hb-body-md">' +
            '<div class="sum__row"><dt>Items</dt><dd class="num">' + bhd(t.items) + '</dd></div>' +
            '<div class="sum__row"><dt>Delivery</dt><dd class="num">' + bhd(t.delivery) + '</dd></div>' +
            (t.discount ? '<div class="sum__row" data-save><dt>' + esc(state.coupon.code) + '</dt><dd class="num">−' + bhd(t.discount) + '</dd></div>' : '') +
            '<div class="sum__row"><dt>VAT 10%</dt><dd class="num">' + bhd(t.vat) + '</dd></div>' +
          '</dl>' +
          '<hr class="hb-divider" data-orientation="horizontal">' +
          '<dl class="sum__total"><dt class="hb-title-md">Total</dt><dd><span class="hb-headline-sm num">' + bhd(t.total) + '</span><span class="hb-body-sm muted">Highbase Payment · bank transfer' + pin(6) + '</span></dd></dl>' +
          '<ul class="checks hb-body-sm">' +
            '<li>' + I.success + '<span>Address confirmed</span></li>' +
            '<li' + (["cr", "id"].every(function (k) { return state.docs[k].file; }) ? '' : ' data-state="warn"') + '>' + (["cr", "id"].every(function (k) { return state.docs[k].file; }) ? I.success : I.warning) + '<span>Required documents on file</span></li>' +
            '<li>' + I.success + '<span>Stock checked ' + (state.checkedAt || 'a moment ago') + pin(1) + '</span></li>' +
          '</ul>' +
          btn(state.placing ? "Checking stock…" : "Place Order", { size: "lg", block: true, icon: state.placing ? I.refresh : I.chevronRight, attrs: ' data-act="place-order"' + (state.placing ? ' data-state="loading" aria-busy="true"' : '') }) +
          '<p class="hb-body-sm muted" style="text-align:center">Next: bank details for a transfer of ' + bhd(t.total) + '.</p>' +
        '</div>' +
      '</div>' +
    '</aside>';
  }

  function renderVerify(){
    var host = $("#screen-verify");
    host.innerHTML =
      stepper(2) +
      '<div class="hb-pagehead" style="margin-bottom:var(--hb-space-16)"><div class="hb-pagehead__row">' +
        '<h1 class="hb-pagehead__title hb-headline-md" data-ar="التحقق قبل الطلب">Checkout Verification</h1></div>' +
        '<p class="hb-pagehead__desc hb-body-md">Confirm your shipping address, then review business documents before placing your order.</p></div>' +
      '<div class="cols">' +
        '<div class="stack">' +
          '<nav class="substeps hb-label-lg" aria-label="On this page">' +
            '<a href="#sec-branch" class="substep" data-state="now"><span class="step__no hb-label-md">1</span>Address</a>' +
            '<a href="#sec-docs" class="substep"><span class="step__no hb-label-md">2</span>Documents</a></nav>' +
          alert("success", '<span class="hb-alert__text">Your pin location is saved. You can update it any time before purchase.</span>',
            { actions: btn("Update pin", { style: "ghost", size: "sm", icon: I.location, attrs: ' data-act="edit-address"' }) }) +
          branchDetails() + deliveryAddress() + businessDocuments() +
        '</div>' + summaryRail() +
      '</div>' +
      '<div class="commit-bar"><span class="hb-title-sm num">' + bhd(totals().total) + '</span>' +
        btn("Place Order", { size: "lg", icon: I.chevronRight, attrs: ' data-act="place-order"' }) + '</div>';
    applyLang();
    wireDocDrops();
  }
