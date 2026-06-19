import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'

// Paleta Recharts — ocre nos modos claros (papel creme); cobre no escuro

export function useAxelChartTheme()
{
  const colorScheme = useTaskStore((s) => s.accessibility.colorScheme)
  const isDarkMode = colorScheme === 'dark'

  return useMemo(() =>
  {
    const axisStroke = isDarkMode ? '#6B6560' : '#8B7D6B'
    const gridStroke = isDarkMode ? '#2E2C28' : '#E8DFC8'
    const refStroke = isDarkMode ? '#6B6560' : '#C9B896'
    const tickFill = isDarkMode ? '#9C9890' : '#1A1A1A'
    const legendColor = isDarkMode ? '#9C9890' : '#1A1A1A'
    const openLineStroke = isDarkMode ? '#6B6560' : '#8B7D6B'
    const exerciseFill = isDarkMode ? '#232220' : '#F5EDD6'
    const exerciseStroke = isDarkMode ? '#C17F3A' : '#8B6317'

    const accent = isDarkMode ? '#C17F3A' : '#5C4A32'

    const waterBar = isDarkMode ? '#C17F3A' : '#5C4A32'
    const waterBarMuted = isDarkMode ? '#8A5A2E' : '#C9A96E'

    return {
      isDarkMode,
      accent,
      waterBar,
      waterBarMuted,
      grid: {
        strokeDasharray: '3 3',
        stroke: gridStroke,
        vertical: false as const,
      },
      axis: {
        stroke: axisStroke,
        fontSize: 11,
        tickLine: false as const,
        axisLine: false as const,
        tick: { fill: tickFill },
      },
      refLine: refStroke,
      legendStyle: { fontSize: 10, paddingTop: 8, color: legendColor },
      productivity: {
        completed: isDarkMode ? '#C17F3A' : '#9A5B1A',
        open: openLineStroke,
      },
      exercise: {
        fill: exerciseFill,
        stroke: exerciseStroke,
      },
    }
  }, [isDarkMode])
}
