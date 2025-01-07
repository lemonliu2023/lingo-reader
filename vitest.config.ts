import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  test: {
    pool: 'forks',
    globals: true,
    environment: 'node',
    include: ['./packages/**/test/*.test.ts'],
    coverage: {
      provider: 'v8',
      exclude: [...coverageConfigDefaults.exclude, 'reader-html', 'ui', '**/dist/**'],
    },
    testTimeout: 10_000,
  },
})
