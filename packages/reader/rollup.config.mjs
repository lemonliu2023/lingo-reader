import { fileURLToPath } from 'node:url'

import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import rollupReplace from '@rollup/plugin-replace'

const __filename = fileURLToPath(import.meta.url)
globalThis.__filename = __filename

function replace(opts) {
  return rollupReplace({
    ...opts,
    preventAssignment: true,
  })
}

const external = ['playwright', 'xml2js', 'adm-zip', 'image-size']
// const globals = {}
export default [
  {
    input: './src/reader.ts',
    external,
    output: [
      {
        file: './dist/index.js',
        format: 'cjs',
      },
      {
        file: './dist/index.mjs',
        format: 'esm',
      },
    ],
    plugins: [
      replace({
        __BROWSER__: JSON.stringify(false),
      }),
      esbuild(),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: './src/reader.ts',
    external,
    output: [
      {
        file: './dist/index.browser.mjs',
        format: 'esm',
      },
    ],
    treeshake: {
      // The default is true, and setting it to false here means there are no side effects
      //  to remove 'import playwright;' and 'import image-size;'
      moduleSideEffects: false,
    },
    plugins: [
      replace({
        __BROWSER__: JSON.stringify(true),
      }),
      esbuild(),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: './src/reader.ts',
    output: [
      {
        file: './dist/index.d.ts',
        format: 'es',
        // globals,
      },
    ],
    plugins: [dts()],
  },
]
