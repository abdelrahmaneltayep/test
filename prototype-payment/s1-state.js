
  /* ============================================================
     State — the order the buyer has just placed, as the live page reports it.
     Same values in all three versions; only the disclosure differs.
     ============================================================ */
  var state = {
    order: {
      ref: "ORD-1788951602914",
      placedAt: "9 Sep 2026 · 11:00",
      total: 12.755,
      lines: 3,
      supplier: "Al Manar Trading",
      delivery: "Mon 14 Sep"
    },
    bank: {
      holder: "HIGHBASE TRADING WLL",
      iban: "BH29ALSA00165212100101",
      swift: "ALSABHBM",
      bank: "Al Salam Bank · Bahrain"
    },
    /* what the buyer has done so far */
    transferred: false,       // pressed "I have made the transfer"
    receipt: null,            // the uploaded file
    uploading: false,         // while the progress bar runs
    error: null,              // a refused file, shown in the zone itself
    qrOpen: false,            // version A and B: the QR is behind a disclosure
    payTab: "bank",           // version C: bank | qr
    step: null,               // version B: the step the buyer opened, if any — otherwise the live one
    version: "a",
    notes: true
  };

  /* ---------- Helpers ---------- */
  function bhd(n){ return "BHD " + (Math.round(n * 1000) / 1000).toFixed(3); }
  function esc(v){ return String(v).replace(/&(?![a-z#]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function $(sel, root){ return (root || document).querySelector(sel); }
  function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function group(s){ return String(s).replace(/(.{4})/g, "$1 ").trim(); }   /* IBANs read in fours */
  function paid(){ return !!state.receipt && !state.uploading; }
  function stage(){
    /* one vocabulary for where the order is, shared by all three versions */
    if (paid()) { return { key: "review", label: "Payment under review", status: "approved" }; }
    if (state.transferred) { return { key: "sent", label: "Waiting for your receipt", status: "pending" }; }
    return { key: "awaiting", label: "Awaiting your transfer", status: "pending" };
  }
