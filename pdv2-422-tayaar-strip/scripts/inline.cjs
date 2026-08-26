/** Inlines dist-artifact/{app.css,app.js} into a single artifact.html with no
 *  document wrapper (the artifact host supplies <!doctype>/<html>/<head>/<body>). */
const fs = require('fs'), path = require('path');
const d = path.join(__dirname, '..', 'dist-artifact');
let html = fs.readFileSync(path.join(d, 'index.artifact.html'), 'utf8');
const css = fs.readFileSync(path.join(d, 'app.css'), 'utf8');
const js  = fs.readFileSync(path.join(d, 'app.js'), 'utf8');

html = html.replace(/<link[^>]+href="[^"]*app\.css"[^>]*>/, () => `<style>\n${css}\n</style>`);
html = html.replace(/<script[^>]+src="[^"]*app\.js"[^>]*><\/script>/, () => `<script type="module">\n${js}\n</script>`);

const head = html.split('<head>')[1].split('</head>')[0].replace(/<meta[^>]*>/g, '');
const body = html.split('<body>')[1].split('</body>')[0];
const out = head.trim() + '\n' + body.trim() + '\n';

for (const bad of ['<!doctype', '<html ', '<head>', '</head>', '<body>', '</body>', '</html>']) {
  if (out.toLowerCase().includes(bad)) throw new Error('leftover wrapper: ' + bad);
}
fs.writeFileSync(path.join(__dirname, '..', 'artifact.html'), out);
console.log(`artifact.html: ${(out.length / 1024).toFixed(0)} KB`);
