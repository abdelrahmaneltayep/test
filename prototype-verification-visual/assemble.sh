#!/bin/bash
# body.html = static shell + <script> made of the slices, then build.js inlines the design system.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
python3 - "$D" <<'PY'
import sys, io
D = sys.argv[1] + "/"
shell = io.open(D + "shell.html", encoding="utf-8").read()
parts = ["s1-state.js", "s2-ui.js", "s3-shared.js", "s3b-previews.js", "s4-versions.js", "s5-why.js", "s6-events.js"]
js = "".join(io.open(D + p, encoding="utf-8").read() for p in parts)
io.open(D + "body.html", "w", encoding="utf-8").write(
    shell + "\n<script>\n(function () {\n  \"use strict\";\n" + js + "\n})();\n</script>\n")
print("body assembled from", len(parts), "slices")
PY
node "$D/build.js"
