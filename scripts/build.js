const esbuild = require('esbuild')
const packageJson = require('../package.json')
const { join } = require('path')

/**
 * @type {esbuild.BuildOptions}
 */
const buildOptions = {
  entryPoints: [join(__dirname, '..', 'src', 'index.ts')],
  outfile: join(__dirname, '..', 'dist', 'index.js'),
  bundle: true,
  target: ['esnext'],
  format: 'cjs',
  platform: 'node',
  minify: true,
  external: [
    ...Object.keys(packageJson.dependencies ?? []),
    ...Object.keys(packageJson.peerDependencies ?? [])
  ]
}

console.time('done in')
console.log('Building package... 👨‍🍳')

esbuild.buildSync(buildOptions)

console.timeEnd('done in')
