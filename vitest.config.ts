import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.d.ts', '.json', '.js'],
  },
  test: {
    pool: 'forks',
    globals: true,
    environment: 'node',
    include: ['./packages/**/test/*.test.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'reader-html',
        'ui',
        '**/dist/**',
        'docs/**',
        'bump.config.ts',
      ],
    },
    testTimeout: 10_000,
  },
})
