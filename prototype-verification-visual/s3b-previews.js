
  /* ============================================================
     Version B · five ways to preview a section's data, read only.
     Each style renders the same three sections from the same state; none of
     them is editable, and every one of them hands editing to the Drawer.
     The switcher that chooses between them is review chrome (proposal).
     ============================================================ */

  function docStatusChip(d){
    return d.file ? statusChip("active", "On file")
      : d.required ? statusChip("pending", "Required") : statusChip("approved", "Optional");
  }
  function docIds(){ return ["cr", "id"].concat(state.hasVat ? ["vat"] : []); }
  function docThumb(d){
    var f = d.file;
    return '<span class="doc__prev" aria-hidden="true">' +
      (f ? (f.url && f.isImage ? '<img src="' + f.url + '" alt="">' : I.file) : I.upload) + '</span>';
  }
  function phoneText(){ return '<bdi dir="ltr" class="num">+973 ' + esc(state.branchDetails.phone) + '</bdi>'; }
  function vatValue(){
    return state.hasVat
      ? (state.taxNumber ? '<span class="num">' + esc(state.taxNumber) + '</span>' : '<span class="muted">Not entered</span>')
      : '<span class="muted">Not registered</span>';
  }
  function vatLabel(){ return state.hasVat ? "Tax Number" : "VAT registration"; }
  function pinLabel(){ return state.address.pinned ? "Pin saved · Block 460" : "No pin saved"; }

  /* ---------- 1 · Facts — labelled values in a grid, the thumbnail beside them ---------- */
  function gridBranch(){
    var b = state.branchDetails;
    return '<div class="prev">' +
      '<span class="hb-avatar" data-shape="square" data-size="40">' + esc(initialsOf(b.name)) + '</span>' +
      '<dl class="prev__facts">' +
        fact("Branch Name", esc(b.name)) + fact("Branch Phone", phoneText()) + fact("Branch Email", esc(b.email)) +
      '</dl></div>';
  }
  function gridAddress(){
    var a = state.address;
    return '<div class="prev">' +
      '<span class="prev__map" aria-label="Delivery pin, Block 460">' + I.location + '<span class="hb-label-sm">' + (a.pinned ? 'Pin saved' : 'No pin') + '</span></span>' +
      '<dl class="prev__facts">' +
        fact("Country", esc(a.country)) + fact("State / Province", esc(a.state)) + fact("City", esc(a.city)) +
        fact("Street Address", esc(a.street)) + fact("Building", esc(a.building)) + fact("ZIP / Postal Code", esc(a.zip)) +
      '</dl></div>';
  }
  function gridDocs(){
    var facts = '<div class="prev"><dl class="prev__facts">' +
      fact("CR Number", '<span class="num">' + esc(state.crNumber) + '</span>') +
      fact(vatLabel(), vatValue()) +
      fact("On file", docsOnFile() + ' of ' + docsNeeded() + ' documents') + '</dl></div>';
    var tiles = '<div class="doctiles" style="margin-top:var(--hb-space-12)">' + docIds().map(function (k) {
      var d = state.docs[k], f = d.file;
      return '<div class="doctile" data-state="' + (f ? "done" : "todo") + '">' + docThumb(d) +
        '<div class="doctile__main"><span class="hb-label-lg">' + esc(d.label) + '</span>' +
          '<span class="hb-body-sm muted">' + (f ? esc(f.name) + ' · ' + esc(f.size) : (d.required ? 'Not uploaded yet' : 'Optional')) + '</span></div>' +
        docStatusChip(d) + '</div>';
    }).join('') + '</div>';
    return facts + tiles;
  }

  /* ---------- 2 · Rows — one value per line, label start, value end ---------- */
  function row(label, value, o){
    o = o || {};
    return '<div class="prow"' + (o.state ? ' data-state="' + o.state + '"' : '') + '>' +
      '<dt class="hb-body-md">' + label + '</dt><dd class="hb-body-md">' + value + '</dd></div>';
  }
  function rowsBranch(){
    var b = state.branchDetails;
    return '<dl class="prows">' + row("Branch Name", esc(b.name)) + row("Branch Phone", phoneText()) +
      row("Branch Email", esc(b.email)) + '</dl>';
  }
  function rowsAddress(){
    var a = state.address;
    return '<dl class="prows">' + row("Country", esc(a.country)) + row("State / Province", esc(a.state)) +
      row("City", esc(a.city)) + row("Street Address", esc(a.street)) + row("Building", esc(a.building)) +
      row("ZIP / Postal Code", esc(a.zip)) + row("Map pin", esc(pinLabel())) + '</dl>';
  }
  function rowsDocs(){
    return '<dl class="prows">' + row("CR Number", '<span class="num">' + esc(state.crNumber) + '</span>') +
      row(vatLabel(), vatValue()) +
      docIds().map(function (k) {
        var d = state.docs[k], f = d.file;
        return row(esc(d.label), '<span class="prow__file">' +
          (f ? '<span class="hb-body-md">' + esc(f.name) + '</span><span class="hb-body-sm muted">' + esc(f.size) + '</span>' : '<span class="hb-body-sm muted">' + (d.required ? 'Not uploaded yet' : 'Optional') + '</span>') +
          docStatusChip(d) + '</span>', { state: f ? "" : "todo" });
      }).join('') + '</dl>';
  }

  /* ---------- 3 · As used — the data in the shape it is used in, not as fields ---------- */
  function usedBranch(){
    var b = state.branchDetails;
    return '<div class="pused">' +
      '<span class="hb-avatar" data-shape="square" data-size="56">' + esc(initialsOf(b.name)) + '</span>' +
      '<div class="pused__lines">' +
        '<span class="hb-title-sm">' + esc(b.name) + '</span>' +
        '<span class="hb-body-md">' + phoneText() + '</span>' +
        '<span class="hb-body-md">' + esc(b.email) + '</span>' +
        '<span class="hb-body-sm muted">The driver calls this number on arrival.</span>' +
      '</div></div>';
  }
  function usedAddress(){
    return '<div class="pused">' +
      '<span class="pused__map" aria-label="Delivery pin, Block 460">' + I.location + '</span>' +
      '<div class="pused__lines">' +
        addressLines().map(function (l) { return '<span class="hb-body-lg">' + esc(l) + '</span>'; }).join('') +
        '<span class="hb-body-sm muted">' + esc(pinLabel()) + '</span>' +
      '</div></div>';
  }
  function usedDocs(){
    /* the document is drawn as the sheet it is — a page, with what is written on it beside it */
    var vat = state.hasVat ? (state.taxNumber ? 'Tax ' + esc(state.taxNumber) : 'Tax number not entered') : 'No VAT registration';
    return '<div class="stack" style="gap:var(--hb-space-12)">' +
      '<div class="pused__meta hb-body-md">CR <span class="num">' + esc(state.crNumber) + '</span> · ' + vat + '</div>' +
      '<div class="docrow">' + docIds().map(function (k) {
        var d = state.docs[k], f = d.file;
        return '<div class="docsheet" data-state="' + (f ? "done" : "todo") + '">' +
          '<span class="docsheet__art" aria-hidden="true">' + (f && f.url && f.isImage ? '<img src="' + f.url + '" alt="">' : (f ? I.file : I.upload)) + '</span>' +
          '<span class="docsheet__lines">' +
            '<span class="hb-label-lg">' + esc(d.label) + '</span>' +
            '<span class="hb-body-sm muted">' + (f ? esc(f.name) + ' · ' + esc(f.size) : (d.required ? 'Not uploaded yet' : 'Optional')) + '</span>' +
            docStatusChip(d) +
          '</span></div>';
      }).join('') + '</div></div>';
  }

  /* ---------- 4 · Summary — the card stays short; values as Chips ---------- */
  /* A value is a neutral Chip; a state is the status pill with the system's fixed
     vocabulary (active · approved · pending · cancelled · completed) — the Chip atom
     carries no success or warning style, and none is invented here. */
  function chipsOf(items){ return '<div class="pchips">' + items.join('') + '</div>'; }
  function valChip(label){ return chip(esc(label), { style: "neutral", size: "md" }); }
  function chipsBranch(){
    var b = state.branchDetails;
    return chipsOf([valChip(b.name), valChip('+973 ' + b.phone), valChip(b.email)]);
  }
  function chipsAddress(){
    var a = state.address;
    return chipsOf([valChip(a.city + ', ' + a.state), valChip('Building ' + a.building + ', Street ' + a.street),
      valChip(a.zip), valChip(a.country),
      a.pinned ? statusChip("active", "Pin saved") : statusChip("pending", "No pin")]);
  }
  function chipsDocs(){
    var items = [valChip('CR ' + state.crNumber)];
    if (state.hasVat) { items.push(valChip('Tax ' + (state.taxNumber || 'not entered'))); }
    docIds().forEach(function (k) {
      var d = state.docs[k];
      items.push(d.file ? statusChip("active", esc(d.label))
        : d.required ? statusChip("pending", esc(d.label) + " needed") : statusChip("approved", esc(d.label) + " optional"));
    });
    return chipsOf(items);
  }

  /* ---------- 5 · Record — the Data Table organism, two columns ---------- */
  function tableOf(rows){
    return '<div class="hb-table-wrap prev__table"><div class="hb-table-scroll"><table class="hb-table">' +
      '<thead><tr><th scope="col">Field</th><th scope="col">On your account</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  function tableBranch(){
    var b = state.branchDetails;
    return tableOf([["Branch Name", esc(b.name)], ["Branch Phone", phoneText()], ["Branch Email", esc(b.email)]]);
  }
  function tableAddress(){
    var a = state.address;
    return tableOf([["Country", esc(a.country)], ["State / Province", esc(a.state)], ["City", esc(a.city)],
      ["Street Address", esc(a.street)], ["Building", esc(a.building)], ["ZIP / Postal Code", esc(a.zip)],
      ["Map pin", esc(pinLabel())]]);
  }
  function tableDocs(){
    var rows = [["CR Number", '<span class="num">' + esc(state.crNumber) + '</span>'], [vatLabel(), vatValue()]];
    docIds().forEach(function (k) {
      var d = state.docs[k], f = d.file;
      rows.push([esc(d.label), '<span class="tcell">' +
        (f ? '<span>' + esc(f.name) + ' · ' + esc(f.size) + '</span>' : '<span class="muted">' + (d.required ? 'Not uploaded yet' : 'Optional') + '</span>') +
        docStatusChip(d) + '</span>']);
    });
    return tableOf(rows);
  }

  /* The five, with what each one is for — the Compare screen reads the same list. */
  var PREVIEWS = [
    { id: "grid",  name: "Facts",   branch: gridBranch,  address: gridAddress,  docs: gridDocs,
      how: "Labelled values in a grid, the avatar, map pin or document thumbnail beside them.",
      best: "A buyer checking one particular value — every label is visible, so nothing has to be inferred.",
      risk: "Three columns of label-plus-value is the most ink of the five, and the card grows with the section." },
    { id: "rows",  name: "Rows",    branch: rowsBranch,  address: rowsAddress,  docs: rowsDocs,
      how: "One value per line, label at the start, value at the end, hairline between rows — an account summary.",
      best: "Reading top to bottom and comparing against a document on the desk; the tallest card but the easiest scan.",
      risk: "A long list of rows reads as a form even though nothing here is editable." },
    { id: "used",  name: "As used", branch: usedBranch,  address: usedAddress,  docs: usedDocs,
      how: "The data in the shape it is used in: a contact block, a postal address as the driver will read it, documents as sheets.",
      best: "Recognition rather than reading — the buyer sees what the driver will see.",
      risk: "Without labels, an unusual value (a ZIP in the wrong field) is harder to spot." },
    { id: "chips", name: "Summary", branch: chipsBranch, address: chipsAddress, docs: chipsDocs,
      how: "Values as Chips on one or two lines, so every section stays the same short height.",
      best: "The returning buyer with nothing to change: the whole page fits above the fold.",
      risk: "Chips carry values without labels, and a long email or street fills the row; detail needs the Drawer." },
    { id: "table", name: "Record",  branch: tableBranch, address: tableAddress, docs: tableDocs,
      how: "The Data Table organism, two columns — Field and what is on your account.",
      best: "Buyers who already read this data as a record in the dashboard; the same table, the same dashed rules.",
      risk: "A table for three values looks heavier than it is, and it is the least mobile-friendly of the five." }
  ];
  function previewStyle(){
    for (var i = 0; i < PREVIEWS.length; i++) { if (PREVIEWS[i].id === state.previewStyle) { return PREVIEWS[i]; } }
    return PREVIEWS[0];
  }
  function previewOf(section){ return function () { return previewStyle()[section](); }; }

  /* The switcher is review chrome (proposal): a Segmented Control over the same page. */
  function previewSwitch(){
    return '<div class="stylebar">' +
      '<div class="stylebar__lines"><span class="hb-label-lg">Preview style</span>' +
        '<span class="hb-body-sm muted">' + previewStyle().how + '</span></div>' +
      '<span class="hb-segmented" role="group" aria-label="How the section data is previewed">' +
        PREVIEWS.map(function (p) {
          return '<button type="button" class="hb-segment" aria-pressed="' + (p.id === state.previewStyle) + '"' +
            ' data-act="preview-style" data-preview="' + p.id + '">' + p.name + '</button>';
        }).join('') +
      '</span></div>';
  }
