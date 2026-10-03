const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.js'],
    exclude: ['node_modules/**'],
    testTimeout: 10000,
  },
});
