const fs = require("node:fs")
const Module = require("node:module")
const path = require("node:path")

// QML's JavaScript-to-JavaScript import directive is not ECMAScript syntax,
// so Node tests compile the same source after removing only those directives.
function requireQmlJs(filename, parent) {
  const resolved = path.resolve(filename)
  const source = fs.readFileSync(resolved, "utf8")
    .replace(/^\s*\.import\s+[^\n]+\n/gm, "")
  const loaded = new Module(resolved, parent || module)
  loaded.filename = resolved
  loaded.paths = Module._nodeModulePaths(path.dirname(resolved))
  loaded._compile(source, resolved)
  return loaded.exports
}

module.exports = requireQmlJs
