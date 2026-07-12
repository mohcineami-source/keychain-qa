/* Builds self-contained files from the multi-file source (no drift):
   - preview.html      : full standalone document (double-click to open; loads Tajawal via CDN)
   - artifact.html     : body-fragment for publishing as a Claude Artifact (system Arabic font)
   Run:  node build-preview.js
*/
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");

const html = read("index.html");
const styles = read("styles.css");
const config = read("config.js");
const script = read("script.js");

// 1) inline the three external refs into a full standalone document.
// NOTE: use FUNCTION replacers — a string replacement would interpret "$$", "$&", etc.
// inside the JS/CSS as special patterns (this is exactly what corrupted `$$` -> `$` before).
const preview = html
  .replace('<link rel="stylesheet" href="styles.css" />', () => "<style>\n" + styles + "\n</style>")
  .replace('<script src="config.js"></script>', () => "<script>\n" + config + "\n</script>")
  .replace('<script src="script.js"></script>', () => "<script>\n" + script + "\n</script>");
fs.writeFileSync(path.join(dir, "preview.html"), preview, "utf8");

// 2) Artifact fragment: body inner content + hoisted <style>, no doctype/html/head/body.
// The artifact is hosted on claude.ai where relative image paths can't resolve and the CSP
// blocks external requests, so inline every images/* reference as a base64 data URI.
function inlineImages(htmlStr) {
  return htmlStr.replace(/src="images\/([^"]+)"/g, function (m, fname) {
    try {
      const ext = path.extname(fname).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const b64 = fs.readFileSync(path.join(dir, "images", fname)).toString("base64");
      return 'src="data:' + mime + ";base64," + b64 + '"';
    } catch (e) { return m; }
  });
}
const bodyInner = preview.split("<body>")[1].split("</body>")[0];
const artifact =
  "<title>نَدى · نشّافة ملابس محمولة</title>\n" +
  "<style>\n" + styles + "\n</style>\n" +
  inlineImages(bodyInner);
fs.writeFileSync(path.join(dir, "artifact.html"), artifact, "utf8");

console.log("built preview.html (" + preview.length + " bytes) and artifact.html (" + artifact.length + " bytes)");
