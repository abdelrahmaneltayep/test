// The single place sweep.html is written. Three separate diagnostics have now read a
// stale copy, so every checker requires this first instead of assuming it is current.
const fs=require('fs');
const frag=fs.readFileSync(__dirname+'/highbase-payment-proposal.html','utf8');
const f=__dirname+'/sweep.html';
fs.writeFileSync(f,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${frag}</body></html>`);
module.exports=f;
