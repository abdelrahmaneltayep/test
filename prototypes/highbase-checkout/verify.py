from playwright.sync_api import sync_playwright
import pathlib
OUT = pathlib.Path("/tmp/claude-0/-home-user-test/5b0e276a-ef9d-5dfe-afe5-85c44bdfe77f/scratchpad/shots2")
OUT.mkdir(exist_ok=True)
URL = "file:///home/user/test/prototypes/highbase-checkout/index.html"
errs = []
ok = lambda label, cond: print(("PASS " if cond else "**FAIL** ") + label)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = b.new_page(viewport={"width":1280,"height":1000})
    pg.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
    pg.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type=="error" else None)
    pg.goto(URL); pg.wait_for_timeout(700)

    # C1 — stock conflict suppresses the line total
    ok("C1 over-stock line voids its total", pg.locator('.line__void').count() == 1)
    ok("C1 offers Reduce + restock alert",
       pg.locator('[data-act="clamp"]').count()==1 and pg.locator('[data-act="restock"]').count()==1)
    # C2 — delivery itemised in the cart
    rows = pg.locator('.rail__row').all_inner_texts()
    ok("C2 delivery itemised in cart summary", any("Delivery" in r for r in rows))
    # C5 — per piece
    ok("C5 per-piece price shown", pg.locator('.line__per').count() >= 10)
    # C6 — nothing ready yet, both suppliers held
    # at rest: Gulf is ready, Nadec is held by the filmed stock conflict
    ok("C6 opens with one supplier ready", not pg.locator('[data-act="todetails"]').is_disabled())
    ok("C6 held supplier named at rest", "Nadec" in pg.locator('.held').inner_text())
    ok("C6 summary is non-zero at rest", "BHD 0.000" not in pg.locator('.rail__row[data-total="true"]').inner_text())
    # C7 — group readiness chips
    ok("C7 group states readiness", pg.locator('.supplier .pill').first.inner_text().strip() != "")
    pg.screenshot(path=OUT/"01-cart.png", full_page=True)

    # fix stock, top up Nadec only -> partial checkout
    pg.locator('[data-act="clamp"]').click(); pg.wait_for_timeout(250)
    q = pg.locator('input[data-act="qty"][data-sup="nadec"][data-item="a2"]')
    q.fill("12"); q.press("Enter"); pg.wait_for_timeout(350)
    btn = pg.locator('[data-act="todetails"]')
    ok("C6 both suppliers ready after the fix", "2 suppliers" in btn.inner_text())
    ok("C6 nothing held once both qualify", pg.locator('.held').count() == 0)
    pg.screenshot(path=OUT/"02-cart-partial.png", full_page=True)

    # R3/R2 coupon at top of summary
    pg.locator('.coupon-row__in').fill("SAVE5")
    pg.locator('[data-act="coupon"]').click(); pg.wait_for_timeout(350)
    ok("R2/R3 coupon applied and named in summary",
       any("SAVE5" in r for r in pg.locator('.rail__row').all_inner_texts()))

    # C8 SKU + list
    pg.locator('#sku').fill("NDC-1L-SK"); pg.locator('[data-act="sku"]').click(); pg.wait_for_timeout(250)
    pg.locator('[data-act="savelist"]').first.click(); pg.wait_for_timeout(300)
    ok("C8 saved list appears", pg.locator('[data-act="loadlist"]').count() == 1)

    # -> details
    pg.locator('[data-act="todetails"]').click(); pg.wait_for_timeout(500)
    ok("A4 three-step indicator", pg.locator('.stepper__item').count() == 3)
    ok("A2 verification shown as a value, no upload fields", pg.locator('.verif').count()==1 and pg.locator('.drop').count()==0)
    ok("A10 pin shows coordinates", "26.2" in pg.locator('.pin').inner_text())
    ok("A7 one shipment block per ready supplier", pg.locator('.ship').count() == 2)
    ok("A8 PO + cost centre + invoice email", pg.locator('#po').count()==1 and pg.locator('#cc').count()==1 and pg.locator('#ie').count()==1)
    ok("A6 button carries the amount", "BHD" in pg.locator('[data-act="place"]').inner_text())
    pg.screenshot(path=OUT/"03-details.png", full_page=True)

    # A7 — cannot place without a slot
    pg.locator('[data-act="place"]').click(); pg.wait_for_timeout(500)
    ok("A7 place blocked without a delivery window", pg.locator('.ship[data-invalid="true"]').count() == 2)
    # bad email
    pg.locator('#ie').fill("not-an-email")
    # fill a window for EVERY shipment — one per ready supplier
    for ship in range(pg.locator('.ship').count()):
        s = pg.locator('.ship').nth(ship)
        s.locator('[data-act="slotday"]').first.click(); pg.wait_for_timeout(120)
        s.locator('[data-act="slottime"]').first.click(); pg.wait_for_timeout(120)
    pg.locator('[data-act="place"]').click(); pg.wait_for_timeout(500)
    ok("A8 invoice email validated", pg.locator('[data-invalid="true"] #ie').count() == 1)
    pg.locator('#ie').fill("finance@buyer.com")
    pg.screenshot(path=OUT/"04-details-errors.png", full_page=True)

    # place for real
    pg.locator('[data-act="place"]').click(); pg.wait_for_timeout(1600)
    ok("P2 says 'Order received', not 'successful'", "Order received" in pg.locator('.page__title').inner_text())
    ok("P2 payment outstanding stated", "outstanding" in pg.locator('.page__sub').inner_text())
    ok("P3 countdown present", pg.locator('#cd').count() == 1)
    cd1 = pg.locator('#cd').inner_text(); pg.wait_for_timeout(1300)
    ok("P3 countdown is live", pg.locator('#cd').inner_text() != cd1)
    ok("P5 transfer reference is its own copyable field", pg.locator('.bankrow--ref').count() == 1)
    ok("P1 receipt dropzone on this page", pg.locator('.drop').count() == 1)
    ok("P1 'I'll pay later' offered", pg.locator('[data-act="paylater"]').count() == 1)
    ok("P4 page continues past IBAN", pg.locator('.timeline li').count() >= 5)
    ok("P4 proforma + message supplier", pg.get_by_text("Download proforma invoice").count()==1)
    ok("C8 reorder prompt on confirmation", pg.locator('.reorder').count() == 1)
    pg.screenshot(path=OUT/"05-payment.png", full_page=True)

    # RTL + phone
    pg.locator('[data-px="dir"][data-px-val="rtl"]').click(); pg.wait_for_timeout(400)
    ok("RTL flips", pg.evaluate("document.documentElement.dir") == "rtl")
    pg.screenshot(path=OUT/"06-rtl.png", full_page=True)
    pg.set_viewport_size({"width":390,"height":900}); pg.wait_for_timeout(400)
    ovf = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    ok(f"no horizontal overflow at 390px (got {ovf})", ovf == 0)
    pg.screenshot(path=OUT/"07-phone.png", full_page=True)
    b.close()
print("CONSOLE:", [e for e in errs if "CERT" not in e] or "clean")
