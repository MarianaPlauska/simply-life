// Vitest mora em frontend/node_modules; este config não importa nada dele,
// então roda com: npm test (ver package.json).

// Datas locais (elo, teto de XP) são testadas no fuso do Brasil (UTC-3),
// em qualquer máquina ou CI.
process.env.TZ = 'America/Sao_Paulo'

export default {
  test: {
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
}
