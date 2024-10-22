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

const external = ['path-browserify']

function commonjsAndEsmConfig(input, output) {
  return {
    input,
    external,
    output: [
      {
        file: output.cjs,
        format: 'cjs',
      },
      {
        file: output.esm,
        format: 'esm',
      },
    ],
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [
      replace({
        __BROWSER__: JSON.stringify(false),
      }),
      esbuild(),
      nodeResolve(),
      commonjs(),
    ],
  }
}

function browserConfig(input, output) {
  return {
    input,
    external,
    output: [
      {
        file: output,
        format: 'esm',
      },
    ],
    treeshake: {
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
  }
}

function dtsConfig(input, output) {
  return {
    input,
    external,
    output: [
      {
        file: output,
        format: 'es',
      },
    ],
    plugins: [dts()],
  }
}

export default [
  // reader.ts
  commonjsAndEsmConfig('./src/index.ts', {
    cjs: './dist/index.js',
    esm: './dist/index.mjs',
  }),
  browserConfig('./src/index.ts', './dist/index.browser.mjs'),
  dtsConfig('./src/index.ts', './dist/index.d.ts'),

  // path.ts
  commonjsAndEsmConfig('./src/path.ts', {
    cjs: './dist/path/path.js',
    esm: './dist/path/path.mjs',
  }),
  browserConfig('./src/path.ts', './dist/path/path.browser.mjs'),
  dtsConfig('./src/path.ts', './dist/path/path.d.ts'),
]
