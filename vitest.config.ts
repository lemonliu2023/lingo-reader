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
      exclude: ['ui', ...coverageConfigDefaults.exclude],
    },
    testTimeout: 15_000,
  },
})
