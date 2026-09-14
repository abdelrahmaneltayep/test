#!/bin/bash
set -e
D=/tmp/claude-0/-home-user-test/d071304f-3298-5cba-8f5f-704a2bf6e28d/scratchpad/proto
# body.html = static shell + <script> made of the slices
python3 - <<'PY'
D="/tmp/claude-0/-home-user-test/d071304f-3298-5cba-8f5f-704a2bf6e28d/scratchpad/proto/"
shell=open(D+"shell.html",encoding='utf-8').read()
parts=["s1-state.js","s2-render.js","s4-dialogs.js","s3-mutations.js","s5-file-order.js","s6-eval.js","s7-events.js"]
js="".join(open(D+p,encoding='utf-8').read() for p in parts)
open(D+"body.html","w",encoding='utf-8').write(shell + "\n<script>\n(function () {\n  \"use strict\";\n" + js + "\n})();\n</script>\n")
print("body assembled from", len(parts), "slices")
PY
node $D/build.js
