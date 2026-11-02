/**
 * Protocolo de sobrecarga. Não é crise, não é TCC e não dá ponto.
 * O CVV continua em outro card, na mesma tela.
 */

export const OVERLOAD_STEPS = [
  { id: 'sair', title: 'Saia do lugar', hint: 'Um corredor, o banheiro ou a rua, se der.' },
  { id: 'agua', title: 'Água', hint: 'Um gole já conta.' },
  { id: 'som', title: 'Diminua o som', hint: 'Fone, ou afaste o que está alto.' },
  { id: 'conhecido', title: 'Um lugar conhecido', hint: 'Volte para onde o corpo já sabe ficar.' },
] as const
