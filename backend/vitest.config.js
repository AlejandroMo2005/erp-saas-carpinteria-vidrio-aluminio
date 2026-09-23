// backend/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Usar Node environment para backend
    environment: 'node',

    // Configuración global
    globals: true,

    // Timeout para tests
    testTimeout: 15000,

    // Include/exclude patterns
    include: [
      '__tests__/**/*.{test,spec}.js',
    ],
    exclude: [
      'node_modules',
      'dist',
    ],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.test.js',
        '**/*.config.js',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
