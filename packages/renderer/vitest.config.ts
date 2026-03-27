import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'renderer',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@swoopy/engine': new URL('../engine/src/index.ts', import.meta.url).pathname,
    },
  },
})
