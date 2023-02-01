const path = require('path')

require('esbuild').buildSync({
  bundle: true,
  platform: 'node',
  nodePaths: [path.join(__dirname, `node_modules`), path.join(__dirname, `dist`)],
  resolveExtensions: ['.js'],
  target: 'es2020',
  entryPoints: [
    'src/handlers/test-function.js',
  ],
})
