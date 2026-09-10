const pptxgen = require("pptxgenjs");
const FIND = require("./findings.js");

/* ---- Palette: HIGHBASE's own navy dominates; amber marks today, green the fix ---- */
const NAVY="0A2540", NAVY_2="16456F", ICE="C7DCF0",
      INK="0F1C2B", MUTED="4A5B6E", FAINT="7C8DA0",
      WHITE="FFFFFF", MIST="F1F5F9",
      AMBER="9C5C00", AMBER_BG="FDF3E3",
      GREEN="15693D", GREEN_BG="EAF5EF",
      RED="A81E17",  RED_BG="FAEAE9",
      BLUE="1470BD";

const HEAD="Cambria", BODY="Calibri";
const SEV = {4:{label:"4 · Catastrophic",c:RED,bg:RED_BG},
             3:{label:"3 · Major",      c:AMBER,bg:AMBER_BG},
             2:{label:"2 · Minor",      c:BLUE, bg:"E9F2FB"}};

const SECTIONS = {
  cart :{n:"01", t:"Cart",                  sub:"/storefront/cart",                 blurb:"Eight findings. The basket hides what the order will cost and sells stock it does not have."},
  review:{n:"02",t:"Review",                sub:"/storefront/review",               blurb:"Three findings. The totals are stated in language the buyer cannot verify."},
  addr :{n:"03", t:"Address & documents",   sub:"/storefront/address-confirmation", blurb:"Ten findings — the densest section. Paperwork stands between the buyer and the order."},
  pay  :{n:"04", t:"Order placed",          sub:"confirmation & payment",           blurb:"Five findings. The order is declared complete while the money is still outstanding."}
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";           // 13.33 x 7.5
pres.author = "Design";
pres.title  = "HIGHBASE checkout — heuristic evaluation";
const W = 13.33, M = 0.6, CW = W - M*2;

const shadow = () => ({ type:"outer", color:NAVY, blur:10, offset:1, angle:90, opacity:0.09 });
let page = 0;

function footer(s, label){
  page++;
  s.addText(label || "HIGHBASE checkout — heuristic evaluation", {
    x:M, y:6.92, w:8, h:0.28, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:9, color:FAINT, valign:"middle"
  });
  s.addText(String(page), {
    x:W-M-0.6, y:6.92, w:0.6, h:0.28, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:9, color:FAINT, align:"right", valign:"middle"
  });
}

function card(s, o){
  s.addShape(pres.ShapeType.roundRect, {
    x:o.x, y:o.y, w:o.w, h:o.h, rectRadius:0.08,
    fill:{color:o.bg}, line:{color:o.bg}, shadow:shadow()
  });
}

/* ---------- 1. Title ---------- */
{
  const s = pres.addSlide();
  s.background = { color:NAVY };
  s.addText("HIGHBASE  ·  B2B MARKETPLACE  ·  BAHRAIN", {
    x:M, y:1.75, w:CW, h:0.3, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:12, bold:true, charSpacing:2.4, color:ICE });
  s.addText("Where the checkout loses orders", {
    x:M, y:2.14, w:11.9, h:1.25, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:42, bold:true, color:WHITE });
  s.addText("A heuristic evaluation of the live buyer flow — 26 findings, and the fix built for each one.", {
    x:M, y:3.4, w:9.4, h:0.9, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:18, color:ICE, lineSpacing:26 });
  s.addShape(pres.ShapeType.roundRect, { x:M, y:4.62, w:3.0, h:0.5, rectRadius:0.08,
    fill:{color:NAVY_2}, line:{color:NAVY_2} });
  s.addText("Prototype included", { x:M, y:4.62, w:3.0, h:0.5, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:13, bold:true, color:WHITE, align:"center", valign:"middle" });
  s.addText("Evaluated against Nielsen's ten usability heuristics  ·  September 2026", {
    x:M, y:6.55, w:CW, h:0.3, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:11, color:"8FA9C4" });
  s.addNotes("Source material: a recorded walkthrough of qa.highbasemarket.com from cart to order placed, plus two confirmation screenshots. Every finding in this deck is traceable to something visible in that recording.");
  page++;
}

/* ---------- 2. What we did ---------- */
{
  const s = pres.addSlide();
  s.addText("What we did", { x:M, y:0.55, w:8, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:38, bold:true, color:INK });
  s.addText("Three steps, in order. Each one depends on the one before it.", {
    x:M, y:1.32, w:9, h:0.35, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED });

  const steps = [
    ["1","Recorded the live flow","A full buyer journey on qa.highbasemarket.com — cart, review, address and documents, order placed — plus the two confirmation screenshots."],
    ["2","Inspected it against a standard","Nielsen's ten usability heuristics, the industry-standard inspection method. Each finding names the heuristic it breaks and carries a severity rating."],
    ["3","Built the fix, not just the critique","A working prototype of all three screens. Every one of the 26 findings has a corresponding change you can click through."]
  ];
  steps.forEach((st,i)=>{
    const y = 1.85 + i*1.62;
    s.addShape(pres.ShapeType.ellipse, { x:M, y:y+0.06, w:0.62, h:0.62,
      fill:{color:NAVY}, line:{color:NAVY} });
    s.addText(st[0], { x:M, y:y+0.06, w:0.62, h:0.62, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:22, bold:true, color:WHITE, align:"center", valign:"middle" });
    s.addText(st[1], { x:1.42, y:y, w:11.2, h:0.4, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:20, bold:true, color:INK, valign:"middle" });
    s.addText(st[2], { x:1.42, y:y+0.44, w:10.9, h:0.9, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:14, color:MUTED, lineSpacing:20, valign:"top" });
  });
  footer(s);
  s.addNotes("Worth saying out loud: this is an expert inspection, not a usability test. It predicts where buyers struggle; it does not measure that they do. The limits slide near the end says what that means for how much weight to put on it.");
}

/* ---------- 3. Executive summary ---------- */
{
  const s = pres.addSlide();
  s.addText("The headline", { x:M, y:0.55, w:8, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:38, bold:true, color:INK });
  s.addText("26 findings. Six of them are costing you orders today.", {
    x:M, y:1.22, w:11.5, h:0.5, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:19, color:MUTED });

  const stats = [
    ["26","findings across four screens",NAVY],
    ["6","rated catastrophic — they block or mislead on the path to purchase",RED],
    ["10/10","heuristics breached at least once",NAVY_2],
    ["12","of the 38 breaches are one heuristic: the flow hides its own state",BLUE]
  ];
  const bw = (CW - 0.36*3)/4;
  stats.forEach((st,i)=>{
    const x = M + i*(bw+0.36);
    card(s,{x, y:2.0, w:bw, h:2.28, bg:MIST});
    s.addText(st[0], { x:x+0.28, y:2.16, w:bw-0.56, h:0.94, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:50, bold:true, color:st[2], valign:"middle" });
    s.addText(st[1], { x:x+0.28, y:3.13, w:bw-0.56, h:1.08, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13, color:MUTED, lineSpacing:17, valign:"top" });
  });

  card(s,{x:M, y:4.52, w:CW, h:1.82, bg:NAVY});
  s.addText("The pattern behind the numbers", { x:M+0.42, y:4.74, w:11.8, h:0.4, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:19, bold:true, color:WHITE });
  s.addText("The checkout consistently withholds cost, progress and state until after the buyer has committed. The delivery fee arrives a page late, the order total is absent from the screen that asks for the order, and the confirmation announces success while the money is still outstanding.", {
    x:M+0.42, y:5.2, w:11.6, h:1.0, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:14.5, color:ICE, lineSpacing:21 });
  footer(s);
  s.addNotes("If the room only remembers one slide, this is it. The individual findings are symptoms; the disease is that the flow does not tell the buyer where they stand until it is too late to change their mind cheaply.");
}

/* ---------- 4. Where it costs money ---------- */
{
  const s = pres.addSlide();
  s.addText("Where it costs money", { x:M, y:0.55, w:9, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:38, bold:true, color:INK });
  s.addText("The 26 findings cluster into four commercial problems.", {
    x:M, y:1.32, w:10, h:0.35, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED });

  const themes = [
    ["Cost arrives too late","A BHD 10 delivery fee lands a page after the basket, and the screen that asks for the order shows no total at all. Buyers abandon at exactly the point they discover the real number.","C2 · R1 · A1 · A6"],
    ["Paperwork on every order","Trade documents are demanded inside each purchase rather than once per account — the tax falls hardest on the buyers who order most often.","A2 · A3 · A9"],
    ["Payment left unfinished","The order is declared successful while unpaid, with no deadline, no reference and the receipt upload on a different page entirely.","P1 · P2 · P3 · P5"],
    ["Nothing built for repeat buying","No reorder, no saved lists, no per-unit pricing, none of the fields a procurement team reconciles against.","C5 · C8 · A8"]
  ];
  const cw2 = (CW - 0.4)/2, ch = 2.28;
  themes.forEach((t,i)=>{
    const x = M + (i%2)*(cw2+0.4), y = 1.78 + Math.floor(i/2)*(ch+0.34);
    card(s,{x, y, w:cw2, h:ch, bg:i%2===0?MIST:"F7FAFC"});
    s.addText(t[0], { x:x+0.34, y:y+0.26, w:cw2-0.68, h:0.42, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:20, bold:true, color:NAVY, valign:"middle" });
    s.addText(t[1], { x:x+0.34, y:y+0.74, w:cw2-0.68, h:1.05, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13.5, color:MUTED, lineSpacing:19, valign:"top" });
    s.addText(t[2], { x:x+0.34, y:y+1.82, w:cw2-0.68, h:0.3, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:11.5, bold:true, color:BLUE });
  });
  footer(s);
  s.addNotes("These four are the argument for prioritising. Findings inside one cluster share a root cause, so fixing them together is cheaper than working down a severity list one row at a time.");
}

/* ---------- 5. How to read the findings ---------- */
{
  const s = pres.addSlide();
  s.addText("How to read the next 26 slides", { x:M, y:0.55, w:11, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:36, bold:true, color:INK });
  s.addText("One finding per slide, in the same shape every time: what happens today, what we changed, and what it costs you.", {
    x:M, y:1.28, w:11.9, h:0.6, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED, lineSpacing:21 });

  const legend = [
    ["4 · Catastrophic",RED,RED_BG,"Blocks or misleads on the path to purchase. Fix before anything else. 6 findings."],
    ["3 · Major",AMBER,AMBER_BG,"Causes real friction, rework or support load. High priority. 13 findings."],
    ["2 · Minor",BLUE,"E9F2FB","Costs time or clarity. Worth doing, not urgent. 7 findings."]
  ];
  legend.forEach((l,i)=>{
    const y = 1.95 + i*1.05;
    s.addShape(pres.ShapeType.roundRect, { x:M, y:y, w:2.15, h:0.56, rectRadius:0.08,
      fill:{color:l[2]}, line:{color:l[2]} });
    s.addText(l[0], { x:M, y:y, w:2.15, h:0.56, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13, bold:true, color:l[1], align:"center", valign:"middle" });
    s.addText(l[3], { x:3.05, y:y, w:9.6, h:0.56, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:14.5, color:MUTED, valign:"middle" });
  });

  card(s,{x:M, y:5.25, w:CW, h:1.1, bg:MIST});
  s.addText("Severity weighs how often buyers hit it, how badly it hurts when they do, and whether it gets easier the second time. Ratings are one evaluator's considered judgement, not a measurement.", {
    x:M+0.42, y:5.25, w:CW-0.84, h:1.1, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:13.5, color:MUTED, valign:"middle", lineSpacing:20 });
  footer(s);
}

/* ---------- Section dividers + finding slides ---------- */
["cart","review","addr","pay"].forEach(key => {
  const sec = SECTIONS[key];
  const rows = FIND.filter(f => f.sec === key);

  const d = pres.addSlide();
  d.background = { color:NAVY };
  d.addText(sec.n, { x:M, y:2.1, w:2.2, h:1.4, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:80, bold:true, color:NAVY_2 });
  d.addText(sec.t, { x:M, y:3.45, w:11, h:0.8, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:40, bold:true, color:WHITE });
  d.addText(sec.sub, { x:M, y:4.28, w:11, h:0.35, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:14, color:"8FA9C4" });
  d.addText(sec.blurb, { x:M, y:4.78, w:9.6, h:0.7, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:16, color:ICE, lineSpacing:23 });
  page++;

  rows.forEach(f => {
    const s = pres.addSlide();
    const sv = SEV[f.sev];

    s.addShape(pres.ShapeType.roundRect, { x:M, y:0.48, w:0.82, h:0.46, rectRadius:0.08,
      fill:{color:NAVY}, line:{color:NAVY} });
    s.addText(f.id, { x:M, y:0.48, w:0.82, h:0.46, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:16, bold:true, color:WHITE, align:"center", valign:"middle" });

    s.addText(f.title, { x:1.58, y:0.40, w:8.95, h:0.58, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:22, bold:true, color:INK, valign:"middle" });

    s.addShape(pres.ShapeType.roundRect, { x:10.73, y:0.48, w:2.0, h:0.46, rectRadius:0.08,
      fill:{color:sv.bg}, line:{color:sv.bg} });
    s.addText(sv.label, { x:10.73, y:0.48, w:2.0, h:0.46, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:12, bold:true, color:sv.c, align:"center", valign:"middle" });

    s.addText("Heuristic breached:  " + f.h.join("      ·      "), {
      x:1.58, y:1.0, w:9.0, h:0.3, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:11, color:FAINT });

    const cy = 1.5, chh = 3.55, cww = 5.95;
    // Today
    card(s,{x:M, y:cy, w:cww, h:chh, bg:AMBER_BG});
    s.addShape(pres.ShapeType.ellipse, { x:M+0.32, y:cy+0.32, w:0.15, h:0.15,
      fill:{color:AMBER}, line:{color:AMBER} });
    s.addText("WHAT HAPPENS TODAY", { x:M+0.6, y:cy+0.22, w:cww-0.9, h:0.34, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:11, bold:true, charSpacing:1.4, color:AMBER, valign:"middle" });
    s.addText(f.today, { x:M+0.32, y:cy+0.68, w:cww-0.64, h:1.85, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:14, color:INK, lineSpacing:20, valign:"top" });
    s.addText(f.ev, { x:M+0.32, y:cy+2.66, w:cww-0.64, h:0.68, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:10.5, italic:true, color:AMBER, lineSpacing:15, valign:"bottom" });

    // Fixed
    const rx = M + cww + 0.23;
    card(s,{x:rx, y:cy, w:cww, h:chh, bg:GREEN_BG});
    s.addShape(pres.ShapeType.ellipse, { x:rx+0.32, y:cy+0.32, w:0.15, h:0.15,
      fill:{color:GREEN}, line:{color:GREEN} });
    s.addText("WHAT WE CHANGED", { x:rx+0.6, y:cy+0.22, w:cww-0.9, h:0.34, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:11, bold:true, charSpacing:1.4, color:GREEN, valign:"middle" });
    s.addText(f.fixed, { x:rx+0.32, y:cy+0.68, w:cww-0.64, h:1.85, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:14, color:INK, lineSpacing:20, valign:"top" });
    s.addText("Live in the prototype", { x:rx+0.32, y:cy+2.72, w:cww-0.64, h:0.32, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:10.5, bold:true, color:GREEN });

    // Cost
    card(s,{x:M, y:5.28, w:CW, h:1.12, bg:MIST});
    s.addText("WHAT IT COSTS", { x:M+0.42, y:5.42, w:2.5, h:0.28, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:10.5, bold:true, charSpacing:1.4, color:NAVY });
    s.addText(f.cost, { x:M+0.42, y:5.7, w:CW-0.84, h:0.6, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13.5, color:INK, lineSpacing:19, valign:"top" });

    footer(s, SECTIONS[key].t + "  ·  finding " + f.id);
    s.addNotes("Severity " + f.sev + ". Heuristic breached: " + f.h.join("; ") + ". Evidence: " + f.ev);
  });
});

/* ---------- Breaches by heuristic ---------- */
{
  const s = pres.addSlide();
  s.addText("Breaches by heuristic", { x:M, y:0.55, w:9, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:36, bold:true, color:INK });
  s.addText("All ten are breached. One accounts for nearly a third of them.", {
    x:M, y:1.32, w:10, h:0.35, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED });

  // Horizontal bars render bottom-up, so feed the list in reverse to read largest-first.
  const rows = [
    ["1 · Visibility of system status",12],
    ["7 · Flexibility and efficiency",5],
    ["2 · Match the real world",4],
    ["4 · Consistency and standards",4],
    ["10 · Help and documentation",4],
    ["8 · Aesthetic and minimalist",3],
    ["3 · User control and freedom",2],
    ["6 · Recognition over recall",2],
    ["5 · Error prevention",1],
    ["9 · Recover from errors",1]
  ].reverse();

  s.addChart(pres.ChartType.bar,
    [{ name:"Breaches", labels:rows.map(r=>r[0]), values:rows.map(r=>r[1]) }],
    { x:M, y:1.75, w:7.9, h:4.6, barDir:"bar", barGapWidthPct:44,
      chartColors:[NAVY], showLegend:false, showTitle:false,
      showValue:true, dataLabelPosition:"outEnd", dataLabelColor:INK,
      dataLabelFontFace:BODY, dataLabelFontSize:12, dataLabelFontBold:true,
      catAxisLabelColor:MUTED, catAxisLabelFontFace:BODY, catAxisLabelFontSize:11,
      valAxisLabelColor:FAINT, valAxisLabelFontFace:BODY, valAxisLabelFontSize:10,
      valAxisMaxVal:14, valGridLine:{ color:"E4EBF2", size:1 }, catGridLine:{ style:"none" },
      catAxisLineShow:false, valAxisLineShow:false });

  card(s,{x:8.75, y:1.75, w:3.98, h:4.6, bg:MIST});
  s.addText("What this says", { x:9.07, y:2.02, w:3.34, h:0.4, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:19, bold:true, color:NAVY });
  s.addText([
    { text:"Visibility of system status is not one bug — it is the flow's habit.", options:{ bold:true, breakLine:true, paraSpaceAfter:10 } },
    { text:"Twelve of the 38 breaches are the interface failing to tell the buyer where they stand: what the order will cost, how many steps remain, whether the payment landed.", options:{ breakLine:true, paraSpaceAfter:10 } },
    { text:"That is good news for sequencing. A single principle — show cost and state before asking for commitment — closes a third of the findings.", options:{} }
  ], { x:9.07, y:2.52, w:3.34, h:3.6, isTextBox:true, margin:0,
       fontFace:BODY, fontSize:13, color:MUTED, lineSpacing:19, valign:"top" });
  footer(s);
  s.addNotes("38 breaches across 26 findings, because several findings break more than one heuristic at once.");
}

/* ---------- What changed, in four numbers ---------- */
{
  const s = pres.addSlide();
  s.addText("What the prototype changes", { x:M, y:0.55, w:10, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:36, bold:true, color:INK });
  s.addText("Measured against the flow in the recording.", { x:M, y:1.32, w:10, h:0.35, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:15, color:MUTED });

  const nums = [
    ["4 → 3","screens between cart and paid","One page absorbs delivery, purchase details and payment method."],
    ["3 → 0","document uploads inside the order","Verification is an account property, collected once and re-checked on expiry."],
    ["2 → 1","the screen where the delivery fee appears","Full cost breakdown from the basket onward, unchanged through checkout."],
    ["2.0 → 17.2","contrast ratio on field values","Above the 4.5:1 the accessibility standard requires, up from roughly half of it."]
  ];
  const bw = (CW - 0.34*3)/4;
  nums.forEach((n,i)=>{
    const x = M + i*(bw+0.34);
    card(s,{x, y:1.85, w:bw, h:3.5, bg:i===3?NAVY:MIST});
    s.addText(n[0], { x:x+0.22, y:2.12, w:bw-0.44, h:0.9, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:28, bold:true, color:i===3?WHITE:NAVY, valign:"middle" });
    s.addText(n[1], { x:x+0.28, y:3.05, w:bw-0.56, h:0.75, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13.5, bold:true, color:i===3?ICE:INK, lineSpacing:18, valign:"top" });
    s.addText(n[2], { x:x+0.28, y:3.85, w:bw-0.56, h:1.2, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:12, color:i===3?ICE:MUTED, lineSpacing:17, valign:"top" });
  });

  card(s,{x:M, y:5.6, w:CW, h:0.78, bg:GREEN_BG});
  s.addText("All 26 findings have a corresponding change in the prototype. None of them is a mock-up — every screen is clickable.", {
    x:M+0.42, y:5.6, w:CW-0.84, h:0.78, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:14, bold:true, color:GREEN, valign:"middle" });
  footer(s);
}

/* ---------- Recommended sequence ---------- */
{
  const s = pres.addSlide();
  s.addText("Where we would start", { x:M, y:0.55, w:10, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:36, bold:true, color:INK });
  s.addText("Three waves, ordered by what they cost you rather than by what they cost to build.", {
    x:M, y:1.32, w:11, h:0.35, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED });

  const waves = [
    ["Wave 1","Stop the bleeding",RED,RED_BG,"C2 · A1 · A6 — put the true cost and the running total in front of the buyer, everywhere.\nC1 — reconcile quantity against stock before payment, not after.\nA3 — cap attachment height so the buy button stays reachable.",
     "Six catastrophic findings. Mostly presentational, no new services."],
    ["Wave 2","Remove the paperwork wall",AMBER,AMBER_BG,"A2 — move CR, VAT and ID verification to the account, collected once.\nP1 · P2 · P3 · P5 — finish payment on the page that asks for it, with a deadline and a reference.",
     "The two structural changes. Needs compliance and finance in the room."],
    ["Wave 3","Make it a trade tool",BLUE,"E9F2FB","C3 · C4 · C6 — supplier grouping, one minimum-order bar, partial checkout.\nC5 · C8 · A7 · A8 — per-unit pricing, reorder, delivery windows, PO and cost centre.",
     "Where repeat-purchase growth actually comes from."]
  ];
  const cw3 = (CW - 0.36*2)/3;
  waves.forEach((w,i)=>{
    const x = M + i*(cw3+0.36);
    card(s,{x, y:1.8, w:cw3, h:4.45, bg:"FBFCFE"});
    s.addShape(pres.ShapeType.roundRect, { x:x+0.3, y:2.06, w:1.32, h:0.42, rectRadius:0.08,
      fill:{color:w[3]}, line:{color:w[3]} });
    s.addText(w[0], { x:x+0.3, y:2.06, w:1.32, h:0.42, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:12, bold:true, color:w[2], align:"center", valign:"middle" });
    s.addText(w[1], { x:x+0.3, y:2.6, w:cw3-0.6, h:0.78, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:19, bold:true, color:NAVY, valign:"middle" });
    s.addText(w[4], { x:x+0.3, y:3.42, w:cw3-0.6, h:1.95, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13, color:INK, lineSpacing:18, valign:"top" });
    s.addText(w[5], { x:x+0.3, y:5.45, w:cw3-0.6, h:0.72, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:11.5, italic:true, color:MUTED, lineSpacing:16 });
  });
  footer(s);
  s.addNotes("Wave 1 is deliberately the cheap half of the catastrophic list — presentation changes that need no new backend. Wave 2 is where the real product decisions are, and it needs compliance and finance at the table.");
}

/* ---------- Validate first ---------- */
{
  const s = pres.addSlide();
  s.addText("Two things to check before building", { x:M, y:0.55, w:11, h:0.72, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:36, bold:true, color:INK });
  s.addText("Both trade against constraints a design inspection cannot see from the outside.", {
    x:M, y:1.32, w:11, h:0.35, isTextBox:true, margin:0, fontFace:BODY, fontSize:15, color:MUTED });

  const risks = [
    ["A2","Documents inside every order","We propose verifying the business once, at account level, and letting an unverified buyer place an order while dispatch waits on the check.","Does Bahrain trade regulation, or your own supplier agreements, require the documents to sit against each individual order? If so, the fix becomes “collect once, attach automatically” rather than “collect once, skip afterwards”."],
    ["P1","Receipt upload on a separate page","We propose completing the transfer receipt on the confirmation page, where the payment is requested.","Was the split deliberate — a finance workflow that needs the receipt tied to a tracked order record? If so, the page can still host the upload and post it to the same record."]
  ];
  const cw2 = (CW - 0.4)/2;
  risks.forEach((r,i)=>{
    const x = M + i*(cw2+0.4);
    card(s,{x, y:1.8, w:cw2, h:4.45, bg:MIST});
    s.addShape(pres.ShapeType.roundRect, { x:x+0.34, y:2.08, w:0.82, h:0.46, rectRadius:0.08,
      fill:{color:NAVY}, line:{color:NAVY} });
    s.addText(r[0], { x:x+0.34, y:2.08, w:0.82, h:0.46, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:16, bold:true, color:WHITE, align:"center", valign:"middle" });
    s.addText(r[1], { x:x+1.3, y:1.98, w:cw2-1.64, h:0.66, isTextBox:true, margin:0,
      fontFace:HEAD, fontSize:17, bold:true, color:NAVY, valign:"middle" });
    s.addText("WHAT WE PROPOSE", { x:x+0.34, y:2.86, w:cw2-0.68, h:0.28, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:10.5, bold:true, charSpacing:1.4, color:MUTED });
    s.addText(r[2], { x:x+0.34, y:3.16, w:cw2-0.68, h:1.0, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13.5, color:INK, lineSpacing:19, valign:"top" });
    s.addText("WHAT WE NEED YOU TO CONFIRM", { x:x+0.34, y:4.26, w:cw2-0.68, h:0.28, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:10.5, bold:true, charSpacing:1.4, color:AMBER });
    s.addText(r[3], { x:x+0.34, y:4.56, w:cw2-0.68, h:1.62, isTextBox:true, margin:0,
      fontFace:BODY, fontSize:13.5, color:INK, lineSpacing:19, valign:"top" });
  });
  footer(s);
  s.addNotes("Raising these two here is deliberate. They are the highest-value findings in the deck and the two most likely to have a reason behind them that we cannot see. Better to ask than to ship a fix that breaks a compliance obligation.");
}

/* ---------- Close ---------- */
{
  const s = pres.addSlide();
  s.background = { color:NAVY };
  s.addText("The prototype", { x:M, y:1.9, w:10, h:0.9, isTextBox:true, margin:0,
    fontFace:HEAD, fontSize:40, bold:true, color:WHITE });
  s.addText("Every fix in this deck is clickable — cart, checkout and payment, with an annotations layer that puts each finding next to the change it produced, and the full evaluation as a fourth tab.", {
    x:M, y:2.85, w:9.4, h:1.1, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:17, color:ICE, lineSpacing:25 });
  card(s,{x:M, y:4.15, w:9.4, h:0.86, bg:NAVY_2});
  s.addText("claude.ai/code/artifact/3347569c-c1ae-4db3-ab55-23807cda4690", {
    x:M+0.4, y:4.15, w:8.6, h:0.86, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:15, bold:true, color:WHITE, valign:"middle" });
  s.addText("Open the Evaluation tab for the full findings table with evidence, heuristics and severities.", {
    x:M, y:5.2, w:9.4, h:0.4, isTextBox:true, margin:0,
    fontFace:BODY, fontSize:13, color:"8FA9C4" });
  page++;
  s.addNotes("Demo suggestion: open the cart with annotations on, then jump to the confirmation screen. Those two carry ten of the findings between them.");
}

pres.writeFile({ fileName: process.argv[2] }).then(f => console.log("wrote", f, "| slides:", page));
