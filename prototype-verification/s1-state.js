
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

    /* Account-level facts. Verification is a property of the business, not of this order —
       it is done once and re-used, which is why the page shows status rather than empty uploads. */
    branches: [
      { id: "manama", name: "Manama Central Warehouse", contact: "Buyer Bahrain", phone: "+973 3908 0705", email: "branch@highbaseco.com",
        lines: ["Building 19, Street 18", "Manama, Capital Governorate 11111", "Bahrain"], hours: "Sun–Thu · 07:00–16:00", pinned: true },
      { id: "sitra",  name: "Sitra Cold Store", contact: "Buyer Bahrain", phone: "+973 3908 0705", email: "sitra@highbaseco.com",
        lines: ["Warehouse 4, Sitra Industrial Area", "Sitra, Capital Governorate 20101", "Bahrain"], hours: "Sat–Thu · 06:00–18:00", pinned: true }
    ],
    branch: "manama",
    docs: [
      { id: "cr",  name: "Commercial registration (CR)", meta: "CR 5056050560-1", status: "verified", until: "31 Mar 2027", required: true,  file: { name: "CR-5056050560-1.pdf", size: "412 KB" } },
      { id: "vat", name: "VAT certificate",              meta: "Optional · needed to reclaim VAT on the tax invoice", status: "missing",  until: null, required: false, file: null },
      { id: "id",  name: "Authorised signatory ID",      meta: "Nadia Al-Sayed · CPR ending 4471", status: "expiring", until: "24 Sep 2026", required: true, file: { name: "CPR-front.jpg", size: "1.2 MB" } }
    ],
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
  function branch() { return state.branches.filter(function (b) { return b.id === state.branch; })[0]; }
  function doc(id) { return state.docs.filter(function (d) { return d.id === id; })[0]; }

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
