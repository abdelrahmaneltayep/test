import sys, pymupdf
src, out, *layers = sys.argv[1:]
doc = pymupdf.open(src); sts = [pymupdf.open(l) for l in layers]
for p in doc:
    for st in sts: p.show_pdf_page(p.rect, st, 0, overlay=True)
doc.save(out, garbage=3, deflate=True)
