import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,

    include: ['__tests__/**/*.{test,spec}.js'],

    exclude: [
      'node_modules',
      'dist',
    ],

    coverage: {
      provider: 'v8',

      reporter: [
        'text',
        'json',
        'html',
        'lcov',
      ],

      include: [
        'src/**/*.js',
        'utils/**/*.js',
        'app.js',
        'server.js',
      ],

      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/*.config.js',
      ],

      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});