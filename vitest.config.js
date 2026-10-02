import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],

    include: [
      'src/**/*.{test,spec}.{js,jsx}',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**',
      'e2e/**',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.{js,jsx}',
      ],
      exclude: [
        'src/__tests__/**',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/*.config.js',
        'src/setupTests.js',
        'src/index.jsx',
      ],
    },

    testTimeout: 10000,

    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
