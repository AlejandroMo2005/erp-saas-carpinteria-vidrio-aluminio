import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment para DOM testing
    environment: 'jsdom',

    // Configuración global
    globals: true,
    
    // Setup files (importa utilities antes de los tests)
    setupFiles: ['./src/__tests__/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.jsx',
        '**/*.test.js',
        '**/*.config.js',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },

    // Include/exclude patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],

    // Timeout for tests
    testTimeout: 10000,

    // CSS handling
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },

  // Vite config para testing
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
