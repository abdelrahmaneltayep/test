
  /* ============================================================
     State — one source of truth for both screens.
     ============================================================ */
  var VAT = 0.10;

  var state = {
    supplier: { name: "Al Manar Trading", initials: "AM", from: "Sitra", delivery: 2 },
    lines: [
      { sku: "NDC-LF200-18", name: "Nadec Long Life Low Fat UHT Milk 200ml", pack: "Case of 18", qty: 8, price: 1, stock: 60 },
      { sku: "NDC-SK1L",     name: "Nadec Long Life Skimmed UHT Milk 1L",    pack: "Single · 1L", qty: 1, price: 1, stock: 40 },
      { sku: "NDC-MG200",    name: "Nadec Fresh Mango Flavoured Milk 200ml", pack: "Single · 200ml", qty: 1, price: 1, stock: 24 }
    ],
    coupon: { code: "ALMANAR2", off: 2 },
    slot: { day: "Mon 14 Sep", window: "08:00 – 12:00" },

    /* The live page's own sections and values, kept as they are. */
    branchDetails: { name: "Buyer", phone: "908070605", email: "branch@highbaseco.com" },
    address: { country: "Bahrain", state: "Capital", city: "Manama", street: "18", building: "19", zip: "11111", pinned: true },
    crNumber: "5056050560-1",
    hasVat: false,
    taxNumber: "",
    docs: {
      cr:  { label: "Commercial License (CR)", required: true,  file: { name: "CR-5056050560-1.pdf", size: "412 KB", isImage: false, at: "12 Jan 2026" } },
      vat: { label: "VAT Certificate",         required: false, file: null },
      id:  { label: "Personal ID Document",    required: true,  file: { name: "CPR-front.jpg", size: "1.2 MB", isImage: false, at: "12 Jan 2026" } }
    },
    editing: { branch: false, address: false },
    errors: {},
    uploading: null,          // doc id while the progress bar runs
    payment: "hb",          // hb | cod | credit
    po: "",
    invoiceEmail: true,
    notes: "",
    agree: true,

    scenarioStockChange: false,   // the review bar toggle: one line changes while the buyer is here
    placing: false,
    order: null,                  // set by placeOrder()
    receipt: null,                // set by takeFile()
    saved: { branch: null, docs: {} }
  };

  /* ---------- Helpers ---------- */
  function bhd(n) { return "BHD " + (Math.round(n * 1000) / 1000).toFixed(3); }
  function esc(v) { return String(v).replace(/&(?![a-z#]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function doc(id) { return state.docs[id]; }
  function addressLines() {
    var a = state.address;
    return ["Building " + a.building + ", Street " + a.street, a.city + ", " + a.state + " " + a.zip, a.country];
  }
  function branch() { return { name: state.branchDetails.name, lines: addressLines() }; }

  function totals() {
    var items = state.lines.reduce(function (t, l) { return t + l.qty * l.price; }, 0);
    var delivery = state.supplier.delivery;
    var discount = Math.min(state.coupon ? state.coupon.off : 0, items);
    var net = items + delivery - discount;
    var vat = net * VAT;
    return { items: items, delivery: delivery, discount: discount, net: net, vat: vat, total: net + vat,
             lines: state.lines.length };
  }

  function fmtDate(d) {
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + ", " +
           d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
