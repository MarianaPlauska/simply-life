import { createContext, useContext } from 'react'

const InSheet = createContext(false)
const InFlatCard = createContext(false)

/** Ficha ou diálogo: aí o cartão mantém a caixa, porque flutua sobre o fundo escuro. */
export const SheetSurface = InSheet.Provider
export const FlatCardScope = InFlatCard.Provider

export function useInSheet(): boolean
{
  return useContext(InSheet)
}

export function useInFlatCard(): boolean
{
  return useContext(InFlatCard)
}
