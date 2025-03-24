import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postCssPxToRem from 'postcss-pxtorem'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/lingo-reader/',
  css: {
    postcss: {
      plugins: [
        postCssPxToRem({
          rootValue: 16 * 0.90,
          propList: ['*'],
          unitPrecision: 2,
          exclude: /node_modules/gi,
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const segments = id.split('node_modules/.pnpm/')
            if (segments.length > 1) {
              const packageName = segments[1].split('/')[0]
              let position = 0
              if (packageName.startsWith('@')) {
                position = 1
              }
              const name = packageName.slice(0, packageName.indexOf('@', position))
              // if different sub packages hava same return name,
              //  they will be bundled to one file
              return `${name}`
            }
          }
        },
      },
    },
  },
})
