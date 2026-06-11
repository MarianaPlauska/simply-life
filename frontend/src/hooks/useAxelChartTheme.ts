import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'

// Paleta Recharts — tons quentes alinhados ao acento cobre

export function useAxelChartTheme()
{
  const colorScheme = useTaskStore((s) => s.accessibility.colorScheme)
  const isDarkMode = colorScheme === 'dark'

  return useMemo(() =>
  {
    const axisStroke = isDarkMode ? '#6B6560' : '#9C9890'
    const gridStroke = isDarkMode ? '#2E2C28' : '#E8E4DB'
    const refStroke = isDarkMode ? '#6B6560' : '#D8D3C8'
    const tickFill = isDarkMode ? '#9C9890' : '#6B6560'
    const legendColor = isDarkMode ? '#9C9890' : '#6B6560'
    const openLineStroke = isDarkMode ? '#6B6560' : '#9C9890'
    const exerciseFill = isDarkMode ? '#232220' : '#EDE9E0'
    const exerciseStroke = isDarkMode ? '#C17F3A' : '#9A5B1A'

    const accent = isDarkMode ? '#C17F3A' : '#9A5B1A'

    const waterBar = isDarkMode ? '#C17F3A' : '#9A5B1A'
    const waterBarMuted = isDarkMode ? '#8A5A2E' : '#C4A574'

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
