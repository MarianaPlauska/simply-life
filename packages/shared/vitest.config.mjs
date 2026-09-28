// Vitest mora em frontend/node_modules; este config não importa nada dele,
// então roda com: npm test (ver package.json).
export default {
  test: {
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
}
