
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

  /* ---------- 6 · Credential — the section drawn as the document it stands for ---------- */
  /* After the insurance-card layout: a portrait, a dated badge, an identifier that can be
     copied, then the rest as two columns of labelled values. The card has no QR code — the
     icon library has no QR glyph, and nothing is substituted for one. */
  function credHead(art, badgeIcon, badgeLabel, badgeValue, pill){
    return '<div class="pcred__head">' + art +
      '<div class="pcred__badge"><span class="pcred__badge-ico">' + badgeIcon + '</span>' +
        '<span class="pcred__badge-lines"><span class="hb-label-md">' + badgeLabel + '</span>' +
        '<span class="hb-title-sm">' + badgeValue + '</span></span></div>' +
      '<span class="pcred__pill">' + pill + '</span></div>';
  }
  function copyable(value, label){
    return '<span class="pcopy"><span class="num">' + value + '</span>' +
      iconBtn(I.copy, "Copy " + label, { style: "ghost", size: "sm", attrs: ' data-act="copy-value" data-value="' + esc(value) + '" data-label="' + esc(label) + '"' }) + '</span>';
  }
  function credBranch(){
    var b = state.branchDetails;
    return '<div class="pcred">' +
      credHead('<span class="hb-avatar" data-shape="square" data-size="56">' + esc(initialsOf(b.name)) + '</span>',
        I.clock, "Branch on file since", "12 Jan 2026", statusChip("active", "Saved")) +
      '<dl class="pcred__facts">' + fact("Branch Name", esc(b.name)) +
        fact("Branch Phone", copyable('+973 ' + esc(b.phone), "branch phone")) +
        fact("Branch Email", esc(b.email)) + '</dl></div>';
  }
  function credAddress(){
    var a = state.address;
    return '<div class="pcred">' +
      credHead('<span class="pcred__map" aria-hidden="true">' + I.location + '</span>',
        I.clock, "Delivers to", esc(a.city) + ', ' + esc(a.state),
        a.pinned ? statusChip("active", "Pin saved") : statusChip("pending", "No pin")) +
      '<dl class="pcred__facts">' + fact("Street Address", esc(a.street)) + fact("Building", esc(a.building)) +
        fact("ZIP / Postal Code", copyable(esc(a.zip), "postal code")) + fact("Country", esc(a.country)) + '</dl></div>';
  }
  function credDocs(){
    var missing = docsNeeded() - docsOnFile();
    return '<div class="pcred">' +
      credHead('<span class="pcred__map" aria-hidden="true">' + I.file + '</span>',
        I.clock, "Kept on your account", docsOnFile() + ' of ' + docsNeeded() + ' documents',
        missing ? statusChip("pending", missing + " needed") : statusChip("active", "Complete")) +
      '<dl class="pcred__facts">' + fact("CR Number", copyable(esc(state.crNumber), "CR number")) +
        fact(vatLabel(), vatValue()) + '</dl>' +
      '<div class="doctiles">' + docIds().map(function (k) {
        var d = state.docs[k], f = d.file;
        return '<div class="doctile" data-state="' + (f ? "done" : "todo") + '">' + docThumb(d) +
          '<div class="doctile__main"><span class="hb-label-lg">' + esc(d.label) + '</span>' +
          '<span class="hb-body-sm muted">' + (f ? esc(f.name) : (d.required ? 'Not uploaded yet' : 'Optional')) + '</span></div>' +
          docStatusChip(d) + '</div>';
      }).join('') + '</div></div>';
  }

  /* ---------- 7 · Tiles — one soft row per value, leading icon, label over value ---------- */
  /* After the smart-home analytics list: rounded rows, a tinted icon tile, the label small
     above and the value below. The tile carries the section's icon — the library has no
     phone or mail glyph, and none is substituted. */
  function tile(icon, label, value){
    return '<div class="ptile"><span class="ptile__ico">' + icon + '</span>' +
      '<span class="ptile__lines"><span class="hb-label-sm">' + label + '</span>' +
      '<span class="hb-title-sm">' + value + '</span></span></div>';
  }
  function tilesBranch(){
    var b = state.branchDetails;
    return '<div class="ptiles">' + tile(I.building, "Branch Name", esc(b.name)) +
      tile(I.building, "Branch Phone", phoneText()) + tile(I.message, "Branch Email", esc(b.email)) + '</div>';
  }
  function tilesAddress(){
    var a = state.address;
    return '<div class="ptiles">' +
      tile(I.location, "City", esc(a.city) + ', ' + esc(a.state)) +
      tile(I.location, "Street and building", 'Street ' + esc(a.street) + ' · Building ' + esc(a.building)) +
      tile(I.location, "ZIP / Postal Code", esc(a.zip) + ' · ' + esc(a.country)) +
      tile(I.location, "Map pin", esc(pinLabel())) + '</div>';
  }
  function tilesDocs(){
    return '<div class="ptiles">' + tile(I.invoice, "CR Number", '<span class="num">' + esc(state.crNumber) + '</span>') +
      docIds().map(function (k) {
        var d = state.docs[k], f = d.file;
        return '<div class="ptile" data-state="' + (f ? "done" : "todo") + '">' +
          '<span class="ptile__ico">' + (f ? I.file : I.upload) + '</span>' +
          '<span class="ptile__lines"><span class="hb-label-sm">' + esc(d.label) + '</span>' +
          '<span class="hb-title-sm">' + (f ? esc(f.name) + ' <span class="hb-body-sm muted">' + esc(f.size) + '</span>' : (d.required ? 'Not uploaded yet' : 'Optional')) + '</span></span>' +
          docStatusChip(d) + '</div>';
      }).join('') + '</div>';
  }

  /* ---------- 8 · Highlights — the two values that decide the order, as Stat Cards ---------- */
  /* After the dashboard metric tiles: what the buyer would check at a glance is large, the
     rest is one line underneath and the whole detail is one Change away. */
  function metric(label, value, icon){
    return '<div class="hb-stat"><span class="hb-stat__body"><span class="hb-stat__label">' + label + '</span>' +
      '<span class="hb-stat__value">' + value + '</span></span><span class="hb-stat__trail">' + icon + '</span></div>';
  }
  function statsBranch(){
    var b = state.branchDetails;
    return '<div class="pstats">' + metric("Branch", esc(b.name), I.building) +
      metric("Phone the driver calls", phoneText(), "") + '</div>' +
      '<p class="pstats__rest hb-body-sm">Also on file: ' + esc(b.email) + '</p>';
  }
  function statsAddress(){
    var a = state.address;
    return '<div class="pstats">' + metric("Delivers to", esc(a.city) + ', ' + esc(a.state), I.location) +
      metric("Map pin", a.pinned ? "Block 460" : "Not set", I.location) + '</div>' +
      '<p class="pstats__rest hb-body-sm">Also on file: Street ' + esc(a.street) + ', Building ' + esc(a.building) + ', ' + esc(a.zip) + ', ' + esc(a.country) + '</p>';
  }
  function statsDocs(){
    var missing = docsMissing();
    return '<div class="pstats">' + metric("Documents on file", docsOnFile() + ' of ' + docsNeeded(), I.file) +
      metric("CR Number", '<span class="num">' + esc(state.crNumber) + '</span>', I.invoice) + '</div>' +
      '<p class="pstats__rest hb-body-sm">' + (missing.length ? 'Still needed: ' + missing.join(', ') + '.' : 'Nothing outstanding. ' + vatLabel() + ': ') + (missing.length ? '' : vatValue()) + '</p>';
  }

  /* ---------- 9 · Options — each record as a bordered card, the one in use marked ---------- */
  /* After the payment-method sheet: the same card per record, the active one outlined and
     pilled "In use". Read only — a switch would imply the choice can be made here, and the
     choosing happens in the Drawer. */
  function option(o){
    return '<div class="popt"' + (o.active ? ' data-active' : '') + (o.state ? ' data-state="' + o.state + '"' : '') + '>' +
      '<span class="popt__art" aria-hidden="true">' + o.art + '</span>' +
      '<span class="popt__lines"><span class="hb-title-sm">' + o.title + '</span>' +
        '<span class="hb-body-sm muted">' + o.text + '</span>' +
        (o.actions ? '<span class="popt__actions">' + o.actions + '</span>' : '') + '</span>' +
      '<span class="popt__trail">' + o.trail + '</span></div>';
  }
  function optionsBranch(){
    var b = state.branchDetails;
    return '<div class="popts">' + option({ active: true,
      art: '<span class="hb-avatar" data-shape="square" data-size="40">' + esc(initialsOf(b.name)) + '</span>',
      title: esc(b.name), text: '+973 ' + esc(b.phone) + ' · ' + esc(b.email),
      trail: statusChip("active", "In use") }) + '</div>';
  }
  function optionsAddress(){
    var a = state.address;
    return '<div class="popts">' + option({ active: true, art: I.location,
      title: 'Building ' + esc(a.building) + ', Street ' + esc(a.street),
      text: esc(a.city) + ', ' + esc(a.state) + ' ' + esc(a.zip) + ' · ' + esc(a.country),
      trail: statusChip("active", "In use") }) +
      option({ art: I.location, title: esc(pinLabel()), text: 'What the driver navigates to',
        trail: a.pinned ? statusChip("approved", "Saved") : statusChip("pending", "Not set") }) + '</div>';
  }
  function optionsDocs(){
    return '<div class="popts">' + docIds().map(function (k) {
      var d = state.docs[k], f = d.file;
      return option({ active: !!f, state: f ? "" : "todo", art: f ? I.file : I.upload,
        title: esc(d.label),
        text: f ? esc(f.name) + ' · ' + esc(f.size) + ' · added ' + esc(f.at || '—') : (d.required ? 'Not uploaded yet' : 'Optional'),
        actions: f ? '<button type="button" class="linkbtn hb-label-md" data-act="view-doc" data-doc="' + k + '">Preview</button>' : '',
        trail: docStatusChip(d) });
    }).join('') + '</div>';
  }

  /* ---------- 10 · Receipt — a summary sheet, values at the end, one emphasised line ---------- */
  /* After the cart summary: thumbnail rows with the value at the end, a rule, then the line
     that decides the delivery set in the largest type, the way a total is. */
  function rline(art, title, text, value){
    return '<div class="prcp__row">' + (art ? '<span class="prcp__art" aria-hidden="true">' + art + '</span>' : '') +
      '<span class="prcp__lines"><span class="hb-title-sm">' + title + '</span>' +
      (text ? '<span class="hb-body-sm muted">' + text + '</span>' : '') + '</span>' +
      '<span class="prcp__val hb-body-md">' + value + '</span></div>';
  }
  function rcpBranch(){
    var b = state.branchDetails;
    return '<div class="prcp">' +
      rline('<span class="hb-avatar" data-shape="square" data-size="40">' + esc(initialsOf(b.name)) + '</span>',
        esc(b.name), "Branch on the order", statusChip("active", "Saved")) +
      '<hr class="hb-divider" data-orientation="horizontal">' +
      rline('', "Branch Email", "", esc(b.email)) +
      '<div class="prcp__total"><span class="hb-body-md">The driver calls</span>' +
        '<span class="hb-headline-sm num">+973 ' + esc(b.phone) + '</span></div></div>';
  }
  function rcpAddress(){
    var a = state.address;
    return '<div class="prcp">' +
      rline('<span class="prcp__map">' + I.location + '</span>', addressLines()[0], addressLines()[1] + ' · ' + esc(a.country),
        a.pinned ? statusChip("active", "Pin saved") : statusChip("pending", "No pin")) +
      '<hr class="hb-divider" data-orientation="horizontal">' +
      rline('', "ZIP / Postal Code", "", '<span class="num">' + esc(a.zip) + '</span>') +
      '<div class="prcp__total"><span class="hb-body-md">Delivers to</span>' +
        '<span class="hb-headline-sm">' + esc(a.city) + ', ' + esc(a.state) + '</span></div></div>';
  }
  function rcpDocs(){
    var missing = docsNeeded() - docsOnFile();
    return '<div class="prcp">' + docIds().map(function (k) {
      var d = state.docs[k], f = d.file;
      return rline(docThumb(d), esc(d.label), f ? esc(f.name) + ' · ' + esc(f.size) : (d.required ? 'Not uploaded yet' : 'Optional'), docStatusChip(d));
    }).join('') +
      '<hr class="hb-divider" data-orientation="horizontal">' +
      rline('', "CR Number", vatLabel() + ': ' + vatValue(), '<span class="num">' + esc(state.crNumber) + '</span>') +
      '<div class="prcp__total"><span class="hb-body-md">' + (missing ? 'Still needed' : 'On your account') + '</span>' +
        '<span class="hb-headline-sm">' + (missing ? missing + ' of ' + docsNeeded() : docsOnFile() + ' of ' + docsNeeded()) + '</span></div></div>';
  }

  /* ============================================================
     11-15 · the List Item molecule, five ways. Every row below is the component's
     own markup — lead / body (top · title · time · text · actions) / trail — wrapped
     in .hb-list. What changes is which slot carries the value, and what a row offers.
     One prototype-layer override applies to all five: the component paints its text
     slot in on-surface-variant, and a value the buyer is checking should be on-surface,
     so the label takes the title slot and the value takes the text slot in full colour.
     ============================================================ */
  function li(o){
    return '<div class="hb-li"' + (o.unread ? ' data-unread' : '') + (o.state ? ' data-state="' + o.state + '"' : '') + '>' +
      (o.lead === false ? '' : '<span class="hb-li__lead">' + (o.lead || I.file) + '</span>') +
      '<span class="hb-li__body">' +
        '<span class="hb-li__top"><span class="hb-li__title">' + o.title + '</span>' +
        (o.tag ? o.tag : '') +
        (o.time ? '<span class="hb-li__time">' + o.time + '</span>' : '') + '</span>' +
        (o.text ? '<span class="hb-li__text">' + o.text + '</span>' : '') +
        (o.extra ? o.extra : '') +
        (o.actions ? '<span class="hb-li__actions">' + o.actions + '</span>' : '') +
      '</span>' +
      (o.trail ? '<span class="hb-li__trail">' + o.trail + '</span>' : '') + '</div>';
  }
  function list(cls, rows){ return '<div class="hb-list ' + cls + '">' + rows.join('') + '</div>'; }
  function docText(d){
    var f = d.file;
    return f ? esc(f.name) + ' · ' + esc(f.size) : (d.required ? 'Not uploaded yet' : 'Optional');
  }

  /* ---------- 11 · List — the component as built: label, value, status ---------- */
  function listBranch(){
    var b = state.branchDetails;
    return list("plist", [
      li({ lead: I.building, title: "Branch Name", text: esc(b.name) }),
      li({ lead: I.building, title: "Branch Phone", text: phoneText() }),
      li({ lead: I.message,  title: "Branch Email", text: esc(b.email) })
    ]);
  }
  function listAddress(){
    var a = state.address;
    return list("plist", [
      li({ lead: I.location, title: "City", text: esc(a.city) + ', ' + esc(a.state) + ' · ' + esc(a.country) }),
      li({ lead: I.location, title: "Street and building", text: 'Street ' + esc(a.street) + ' · Building ' + esc(a.building) }),
      li({ lead: I.location, title: "ZIP / Postal Code", text: '<span class="num">' + esc(a.zip) + '</span>' }),
      li({ lead: I.location, title: "Map pin", text: esc(pinLabel()),
        trail: a.pinned ? statusChip("active", "Saved") : statusChip("pending", "Not set") })
    ]);
  }
  function listDocs(){
    var rows = [li({ lead: I.invoice, title: "CR Number", text: '<span class="num">' + esc(state.crNumber) + '</span>' }),
      li({ lead: I.invoice, title: vatLabel(), text: vatValue() })];
    docIds().forEach(function (k) {
      var d = state.docs[k];
      rows.push(li({ lead: d.file ? I.file : I.upload, state: d.file ? "" : "todo",
        title: esc(d.label), text: docText(d), trail: docStatusChip(d) }));
    });
    return list("plist", rows);
  }

  /* ---------- 12 · Ledger — one line per value, the value in the trailing slot ---------- */
  function ledgerRow(label, value){ return li({ lead: false, title: label, trail: '<span class="hb-body-md">' + value + '</span>' }); }
  function ledgerBranch(){
    var b = state.branchDetails;
    return list("pledger", [ledgerRow("Branch Name", esc(b.name)), ledgerRow("Branch Phone", phoneText()), ledgerRow("Branch Email", esc(b.email))]);
  }
  function ledgerAddress(){
    var a = state.address;
    return list("pledger", [ledgerRow("Country", esc(a.country)), ledgerRow("State / Province", esc(a.state)),
      ledgerRow("City", esc(a.city)), ledgerRow("Street Address", esc(a.street)),
      ledgerRow("Building", esc(a.building)), ledgerRow("ZIP / Postal Code", '<span class="num">' + esc(a.zip) + '</span>'),
      ledgerRow("Map pin", esc(pinLabel()))]);
  }
  function ledgerDocs(){
    var rows = [ledgerRow("CR Number", '<span class="num">' + esc(state.crNumber) + '</span>'), ledgerRow(vatLabel(), vatValue())];
    docIds().forEach(function (k) {
      var d = state.docs[k];
      rows.push(li({ lead: false, state: d.file ? "" : "todo", title: esc(d.label),
        trail: '<span class="hb-body-sm muted">' + (d.file ? esc(d.file.name) : '') + '</span>' + docStatusChip(d) }));
    });
    return list("pledger", rows);
  }

  /* ---------- 13 · Activity — one row per value, and the two states a document takes ---------- */
  /* The chosen preview for B. A pill would repeat what the line already states, so every row
     carries the fact in words. Each value gets its own row: a buyer checking one thing — the
     phone the driver will call, the postcode — finds it without reading a sentence. */
  function activityRow(icon, label, value, when){
    return li({ lead: icon, title: label, time: when || "", text: value });
  }
  var SAVED_AT = "12 Jan 2026";
  function activityBranch(){
    var b = state.branchDetails;
    /* the drawer's own field labels, so the row a buyer reads and the field they edit agree */
    return list("pactivity", [
      activityRow(I.building, "Branch name", esc(b.name), SAVED_AT),
      activityRow(I.building, "Branch phone", phoneText(), SAVED_AT),
      activityRow(I.building, "Branch email", esc(b.email), SAVED_AT)
    ]);
  }
  function activityAddress(){
    var a = state.address;
    return list("pactivity", [
      activityRow(I.location, "Country", esc(a.country), SAVED_AT),
      activityRow(I.location, "State / Province", esc(a.state), SAVED_AT),
      activityRow(I.location, "City", esc(a.city), SAVED_AT),
      activityRow(I.location, "Street address", esc(a.street), SAVED_AT),
      activityRow(I.location, "Building", esc(a.building), SAVED_AT),
      activityRow(I.location, "Postal code", '<span class="num">' + esc(a.zip) + '</span>', SAVED_AT),
      li({ lead: I.location, state: a.pinned ? "" : "todo", title: "Map pin",
        time: a.pinned ? "08 Sep 2026" : "", text: esc(pinLabel()) })
    ]);
  }
  /* Required is a red asterisk after the name, the same mark every field label in this
     prototype uses (PM, 17 Sep). It replaces the Required / Optional chip: the mark is the
     form convention the buyer already reads, and it leaves the row's trailing slot to Preview.
     Optional carries no mark — absence is the signal, as it is on a form. */
  function reqMark(d){ return d.required ? ' <span class="hb-field__req">*</span>' : ''; }

  /* The three documents are shown in both of the states a row can take, side by side, because
     the two are what this section has to get right. In the product a document is in one state
     or the other; here they are drawn together so both can be reviewed at once. */
  var DOC_CASE_IDS = ["cr", "id", "vat"];
  /* VAT has no file on this account, so the after case borrows the design system's own File
     Upload sample rather than inventing a document. (proposal — sample content) */
  var DOC_SAMPLE = { vat: { name: "vat-certificate.pdf", size: "1.1 MB", at: "12 Jan 2026" } };
  function docBefore(k){
    var d = state.docs[k];
    return li({ lead: I.upload, state: "todo", title: esc(d.label) + reqMark(d), text: "Not uploaded" });
  }
  /* A document on file is something to look at, so the row carries Preview (PM, 17 Sep).
     It sits in the List Item's trailing slot, at the end of the row — the tag is beside the
     title now, so the slot the tag used to borrow is free for the affordance it was built for. */
  function docAfter(k){
    var d = state.docs[k], f = d.file || DOC_SAMPLE[k];
    if (!f) { return docBefore(k); }
    var replaced = d.file && d.prev;
    /* the mark belongs immediately after the name, so what happened to the file moves onto
       the line below it — the row still says uploaded or replaced, just not in the title */
    return li({ lead: replaced ? I.refresh : I.file,
      title: esc(d.label) + reqMark(d),
      time: esc(f.at || "just now"),
      text: (replaced ? "Replaced · " : "Uploaded · ") + esc(f.name) + ' · ' + esc(f.size),
      trail: d.file ? iconBtn(I.view, "Preview " + esc(d.label), { style: "ghost", size: "md",
        attrs: ' data-act="view-doc" data-doc="' + k + '"' }) : '' });
  }
  function docCase(title, note, rows){
    return '<div class="pcase">' +
      '<div class="pcase__head"><span class="hb-label-md">' + title + '</span>' +
        '<span class="hb-body-sm muted">' + note + '</span></div>' +
      list("pactivity", rows) + '</div>';
  }
  function activityDocs(){
    return list("pactivity", [
      activityRow(I.invoice, "CR Number", '<span class="num">' + esc(state.crNumber) + '</span>', SAVED_AT),
      activityRow(I.invoice, vatLabel(), vatValue(), SAVED_AT)
    ]) +
    docCase("Before upload", "The row is not filled in: the page\u2019s own surface, an outlined icon, and what is still needed.",
      DOC_CASE_IDS.map(docBefore)) +
    docCase("After upload", "The file, its size and the day it arrived. A file that replaced an earlier one says so.",
      DOC_CASE_IDS.map(docAfter));
  }

  /* ---------- 14 · Actions — every row carries what can be done to it ---------- */
  function rowAct(label, act, attrs){
    return '<button type="button" class="linkbtn hb-label-md" data-act="' + act + '"' + (attrs || '') + '>' + label + '</button>';
  }
  function copyAct(value, label){
    return rowAct("Copy", "copy-value", ' data-value="' + esc(value) + '" data-label="' + esc(label) + '"');
  }
  function changeAct(section, label){
    return rowAct(label || "Change", "open-drawer", ' data-drawer="' + section + '"');
  }
  function actionsBranch(){
    var b = state.branchDetails;
    return list("pactions", [
      li({ lead: I.building, title: "Branch Name", text: esc(b.name), actions: changeAct("branch") }),
      li({ lead: I.building, title: "Branch Phone", text: phoneText(),
        actions: copyAct('+973 ' + b.phone, "branch phone") + changeAct("branch") }),
      li({ lead: I.message, title: "Branch Email", text: esc(b.email),
        actions: copyAct(b.email, "branch email") + changeAct("branch") })
    ]);
  }
  function actionsAddress(){
    var a = state.address;
    return list("pactions", [
      li({ lead: I.location, title: "Delivery Address", text: addressLines().join(', '),
        actions: copyAct(addressLines().join(', '), "delivery address") + changeAct("address") }),
      li({ lead: I.location, title: "Map pin", text: esc(pinLabel()),
        trail: a.pinned ? statusChip("active", "Saved") : statusChip("pending", "Not set"),
        actions: changeAct("address", a.pinned ? "Move pin" : "Set pin") })
    ]);
  }
  function actionsDocs(){
    var rows = [li({ lead: I.invoice, title: "CR Number", text: '<span class="num">' + esc(state.crNumber) + '</span>',
      actions: copyAct(state.crNumber, "CR number") + changeAct("docs", "Edit") })];
    docIds().forEach(function (k) {
      var d = state.docs[k], f = d.file;
      rows.push(li({ lead: f ? I.file : I.upload, state: f ? "" : "todo", title: esc(d.label), text: docText(d),
        trail: docStatusChip(d),
        actions: (f ? rowAct("Preview", "view-doc", ' data-doc="' + k + '"') + changeAct("docs", "Replace")
                    : changeAct("docs", "Upload")) }));
    });
    return list("pactions", rows);
  }

  /* ---------- 15 · Grouped — subheaders inside the list, a count per group ---------- */
  function group(title, count, rows){
    return '<div class="pgroup__head"><span class="hb-label-lg">' + title + '</span>' +
      '<span class="hb-label-md muted">' + count + '</span></div>' + rows.join('');
  }
  function groupedBranch(){
    var b = state.branchDetails;
    return list("pgrouped", [
      group("Who receives it", "1 value", [li({ lead: I.building, title: "Branch Name", text: esc(b.name) })]),
      group("How the driver reaches them", "2 values", [
        li({ lead: I.building, title: "Branch Phone", text: phoneText() }),
        li({ lead: I.message, title: "Branch Email", text: esc(b.email) })])
    ]);
  }
  function groupedAddress(){
    var a = state.address;
    return list("pgrouped", [
      group("Where", "3 values", [
        li({ lead: I.location, title: "Country", text: esc(a.country) }),
        li({ lead: I.location, title: "State / Province", text: esc(a.state) }),
        li({ lead: I.location, title: "City", text: esc(a.city) })]),
      group("Exactly where", "4 values", [
        li({ lead: I.location, title: "Street Address", text: esc(a.street) }),
        li({ lead: I.location, title: "Building", text: esc(a.building) }),
        li({ lead: I.location, title: "ZIP / Postal Code", text: '<span class="num">' + esc(a.zip) + '</span>' }),
        li({ lead: I.location, title: "Map pin", text: esc(pinLabel()),
          trail: a.pinned ? statusChip("active", "Saved") : statusChip("pending", "Not set") })])
    ]);
  }
  function groupedDocs(){
    var files = docIds().map(function (k) {
      var d = state.docs[k];
      return li({ lead: d.file ? I.file : I.upload, state: d.file ? "" : "todo",
        title: esc(d.label), text: docText(d), trail: docStatusChip(d) });
    });
    return list("pgrouped", [
      group("Registration", "2 values", [
        li({ lead: I.invoice, title: "CR Number", text: '<span class="num">' + esc(state.crNumber) + '</span>' }),
        li({ lead: I.invoice, title: vatLabel(), text: vatValue() })]),
      group("Files", docsOnFile() + ' of ' + docsNeeded() + ' on file', files)
    ]);
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
      risk: "A table for three values looks heavier than it is, and it is the least mobile-friendly of the ten." },
    { id: "cred",  name: "Credential", branch: credBranch, address: credAddress, docs: credDocs,
      how: "The section drawn as the document it stands for: a portrait or thumbnail, a dated badge, an identifier that copies, then the rest in two columns.",
      best: "The sections that are records — an account's branch, its licence — where the buyer is checking an identity, not a form.",
      risk: "It borrows the authority of a real card; the page has no QR code because the icon library has none, so it stops short of the reference." },
    { id: "tiles", name: "Tiles",      branch: tilesBranch, address: tilesAddress, docs: tilesDocs,
      how: "One soft, rounded row per value, a tinted icon tile at the start, the label small above the value.",
      best: "Touch, and any width: the rows stack without reflowing and stay comfortably tappable if they ever become editable.",
      risk: "The library has no phone or mail glyph, so the tiles repeat the section's own icon; a per-field icon set would have to be drawn." },
    { id: "stats", name: "Highlights", branch: statsBranch, address: statsAddress, docs: statsDocs,
      how: "The two values that actually decide the order as Stat Cards, everything else on one line beneath them.",
      best: "The quickest read of the ten — the buyer checks the two things that change an order and moves on.",
      risk: "It chooses for the buyer. Anything not chosen is invisible until the Drawer opens." },
    { id: "options", name: "Options",  branch: optionsBranch, address: optionsAddress, docs: optionsDocs,
      how: "Each record as a bordered card — the one in use outlined and pilled, documents carrying a Preview action.",
      best: "Accounts with more than one of something: a second address, a renewed licence beside the expired one.",
      risk: "It looks like a chooser and is not one; the choosing happens in the Drawer, and a single record makes a lonely card." },
    { id: "receipt", name: "Receipt",  branch: rcpBranch, address: rcpAddress, docs: rcpDocs,
      how: "A summary sheet: thumbnail rows with the value at the end, a rule, then the line that matters set large, the way a total is.",
      best: "The last screen before paying — it reads like the order summary next to it, so the page holds one voice.",
      risk: "Emphasis by size means one line wins; if the buyer needs a different value, it is the smallest thing on the card." },
    { id: "list",     name: "List",     branch: listBranch,     address: listAddress,     docs: listDocs,
      how: "The List Item molecule as built — a leading icon, the label, the value beneath it, a status pill in the trailing slot, one divider per row.",
      best: "The safest of the fifteen: a component the buyer already meets in notifications and menus, carrying nothing it was not built to carry.",
      risk: "Every row looks equally important, so a section with seven values reads as seven equal things." },
    { id: "ledger",   name: "Ledger",   branch: ledgerBranch,   address: ledgerAddress,   docs: ledgerDocs,
      how: "The same component with the leading slot dropped and the value moved into the trailing slot: one line per value, values aligned down the end edge.",
      best: "Checking many values quickly — the alignment makes a missing or odd one obvious at a glance.",
      risk: "The densest of the fifteen; with no icons and no second line it is the least scannable on a phone." },
    { id: "activity", name: "Activity", branch: activityBranch, address: activityAddress, docs: activityDocs, noStatus: true,
      how: "One row per value, with the date in the time slot and a Required or Optional tag beside each document. No status pills. The documents are drawn in both states — before upload, where the row keeps the page's own surface and an outlined icon, and after, where it carries the file, its size and the day it arrived.",
      best: "Returning buyers asking the real question — has anything changed since my last order? It is the chosen preview for B.",
      risk: "One row per value makes the address seven rows, and showing both document states doubles that section — this is the tallest of the fifteen." },
    { id: "actions",  name: "Actions",  branch: actionsBranch,  address: actionsAddress,  docs: actionsDocs,
      how: "Every row uses the component's actions slot: Copy on an identifier, Preview on a document, Upload or Change opening the Drawer at that section.",
      best: "Doing one small thing without opening anything — copying the CR number, replacing one expired licence.",
      risk: "Three actions a row is a lot of blue; it is the busiest of the fifteen and the least restful to read." },
    { id: "grouped",  name: "Grouped",  branch: groupedBranch,  address: groupedAddress,  docs: groupedDocs,
      how: "One list per section, split by subheaders with a count — Where and Exactly where, Registration and Files.",
      best: "Sections that keep growing: the grouping survives a fourth document or a second contact where a flat list stops being readable.",
      risk: "Two subheaders over seven values is more structure than the data needs today." }
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
