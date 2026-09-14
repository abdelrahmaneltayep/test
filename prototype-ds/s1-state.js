
  /* ============================================================
     State — one source of truth. Everything on screen is derived
     from this, so a change in the cart reaches checkout and the
     confirmation without any of them being told about it.
     ============================================================ */
  var VAT = 0.10;

  var state = {
    suppliers: [
      {
        id: "almanar", name: "Al Manar Trading", initials: "AM",
        meta: "Nadec authorised distributor · Delivers Sun–Thu · Manama & Muharraq",
        from: "Sitra", moq: 10, delivery: 2, freeOver: 25,
        coupon: { code: "ALMANAR2", label: "supplier coupon", off: 2 },
        items: [
          { sku:"NDC-LF200-18", name:"Nadec Long Life Low Fat UHT Milk 200ml", emoji:"🥛",
            per:18, unitLabel:"case", price:1, qty:8, stock:60, sel:true },
          { sku:"NDC-SK1L", name:"Nadec Long Life Skimmed UHT Milk 1L", emoji:"🧃",
            per:1, unitLabel:"1L", price:1, qty:1, stock:40, sel:true },
          { sku:"NDC-MG200", name:"Nadec Fresh Mango Flavoured Milk 200ml", emoji:"🥭",
            per:1, unitLabel:"200ml", price:1, qty:1, stock:24, sel:true }
        ]
      },
      {
        id: "gulf", name: "Gulf Fresh Foods", initials: "GF", tint:true,
        meta: "Chilled & fresh · Delivers Mon, Wed, Sat · Capital Governorate",
        from: "Muharraq", moq: 15, delivery: 2.5, freeOver: 30, coupon: null,
        items: [
          { sku:"NDC-FF360", name:"Nadec Fresh Full Fat Milk 360ml", emoji:"🍼",
            per:1, unitLabel:"360ml", price:1, qty:1, stock:80, sel:true },
          { sku:"NDC-VN125-18", name:"Nadec Vanilla Flavoured Milk 125ml", emoji:"🍦",
            per:18, unitLabel:"case", price:1, qty:7, stock:1, sel:true }
        ]
      }
    ],
    catalog: {
      almanar: [
        { sku:"NDC-LB1L", name:"Nadec Laban 1L", emoji:"🥛", per:1, unitLabel:"1L", price:1.2, stock:50 },
        { sku:"NDC-YG170-12", name:"Nadec Fresh Yoghurt 170g", emoji:"🍶", per:12, unitLabel:"case", price:2.4, stock:30 },
        { sku:"NDC-CR250", name:"Nadec Cooking Cream 250ml", emoji:"🥄", per:1, unitLabel:"250ml", price:0.9, stock:65 }
      ],
      gulf: [
        { sku:"GF-EGG30", name:"Gulf Farm Eggs, tray of 30", emoji:"🥚", per:30, unitLabel:"tray", price:2.1, stock:40 },
        { sku:"GF-BTR200", name:"Gulf Fresh Butter 200g", emoji:"🧈", per:1, unitLabel:"200g", price:1.6, stock:35 },
        { sku:"GF-CHS400", name:"Gulf White Cheese 400g", emoji:"🧀", per:1, unitLabel:"400g", price:2.2, stock:28 },
        { sku:"GF-JUI1L-6", name:"Gulf Orange Juice 1L", emoji:"🍊", per:6, unitLabel:"case", price:4.5, stock:22 }
      ]
    },
    coupons: [
      { code:"HIGHBASE5", label:"marketplace credit", off:5, min:20 }
    ],
    applied: [],
    notify: {},
    savedLists: 0,
    addresses: [
      { id:"manama", name:"Buyer Bahrain — Manama branch", def:true,
        line:"Building 19, Road 18, Block 460, Manama, Capital Governorate 11111, Bahrain",
        contact:"Ahmed Khalil · +973 9080 7060 · branch@highbaseco.com",
        lat:26.2361, lng:50.5831 },
      { id:"muharraq", name:"Buyer Bahrain — Muharraq warehouse",
        line:"Gate 4, Industrial Area, Muharraq · Goods-in 07:00–14:00",
        contact:"Goods-in desk · +973 1745 0022", lat:26.2572, lng:50.6119 }
    ],
    checkout: {
      addr:"manama", day:1, time:0, payment:"transfer",
      po:"PO-2026-0914", costCentre:"Manama branch — F&B", notes:"", invoiceEmail:true
    },
    days: [
      { lab:"Sun", date:"13 Sep" }, { lab:"Mon", date:"14 Sep" },
      { lab:"Tue", date:"15 Sep" }, { lab:"Wed", date:"16 Sep" },
      { lab:"Thu", date:"Full", full:true }
    ],
    times: [
      { lab:"08:00 – 12:00", note:"Free", fee:0 },
      { lab:"12:00 – 16:00", note:"Free", fee:0 },
      { lab:"16:00 – 20:00", note:"+BHD 1.500", fee:1.5 }
    ],
    order: null,
    undo: null
  };

  /* ---------- Helpers ---------- */
  function bhd(n) { return "BHD " + (Math.round(n * 1000) / 1000).toFixed(3); }
  function esc(v) { return String(v).replace(/&(?![a-z#]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pieces(it) { return it.qty * it.per; }
  function short(name) { return name.replace(/^Nadec\s+|^Gulf\s+/, "").replace(/\s+(UHT|Flavoured|Fresh)\s+/g, " "); }

  /* ---------- Derived values ---------- */
  function conflicted(it) { return it.qty > it.stock; }
  function lineTotal(it) { return conflicted(it) ? null : it.qty * it.price; }

  function supplierSubtotal(sup) {
    return sup.items.reduce(function (t, it) {
      return t + (it.sel && !conflicted(it) ? it.qty * it.price : 0);
    }, 0);
  }
  function supplierHasBlocker(sup) {
    return sup.items.some(function (it) { return it.sel && conflicted(it); });
  }
  function supplierReady(sup) {
    return sup.items.some(function (it) { return it.sel; }) &&
           !supplierHasBlocker(sup) &&
           supplierSubtotal(sup) >= sup.moq;
  }
  function supplierDelivery(sup) {
    return supplierSubtotal(sup) >= sup.freeOver ? 0 : sup.delivery;
  }

  function totals() {
    var ready = state.suppliers.filter(supplierReady);
    var items = 0, delivery = 0, discount = 0, lines = 0, pcs = 0;
    ready.forEach(function (sup) {
      items += supplierSubtotal(sup);
      delivery += supplierDelivery(sup);
      if (sup.coupon) { discount += sup.coupon.off; }
      sup.items.forEach(function (it) { if (it.sel) { lines++; pcs += pieces(it); } });
    });
    var slotFee = ready.length ? state.times[state.checkout.time].fee : 0;
    state.applied.forEach(function (c) { if (items >= (c.min || 0)) { discount += c.off; } });
    discount = Math.min(discount, items + delivery + slotFee);
    var net = items + delivery + slotFee - discount;
    var vat = net * VAT;
    return { ready: ready, items: items, delivery: delivery, slotFee: slotFee,
             discount: discount, vat: vat, total: net + vat, lines: lines, pieces: pcs };
  }
