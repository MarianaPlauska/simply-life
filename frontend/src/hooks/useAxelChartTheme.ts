import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'

// Paleta Recharts - tons Meridian (ardósia + teal)

export function useAxelChartTheme()
{
  const colorScheme = useTaskStore((s) => s.accessibility.colorScheme)
  const isDarkMode = colorScheme === 'dark'

  return useMemo(() =>
  {
    const axisStroke = isDarkMode ? '#64748B' : '#94A3B8'
    const gridStroke = isDarkMode ? '#2A3340' : '#E2E8F0'
    const refStroke = isDarkMode ? '#64748B' : '#CBD5E1'
    const tickFill = isDarkMode ? '#94A3B8' : '#334155'
    const legendColor = isDarkMode ? '#94A3B8' : '#334155'
    const openLineStroke = isDarkMode ? '#64748B' : '#94A3B8'
    const exerciseFill = isDarkMode ? '#1A2029' : '#E8ECF2'
    const exerciseStroke = isDarkMode ? '#D4924A' : '#C17F3A'

    const accent = isDarkMode ? '#D4924A' : '#C17F3A'

    const waterBar = isDarkMode ? '#D4924A' : '#C17F3A'
    const waterBarMuted = isDarkMode ? '#A66B2E' : '#E8B87A'

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
        completed: isDarkMode ? '#D4924A' : '#C17F3A',
        open: openLineStroke,
      },
      exercise: {
        fill: exerciseFill,
        stroke: exerciseStroke,
      },
    }
  }, [isDarkMode])
}
