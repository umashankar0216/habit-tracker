"use client"

import { Card } from "@/components/ui/card"

interface HeatmapViewProps {
  habits: Array<{
    id: string
    name: string
    completedDays: Set<number>
  }>
  daysInMonth: number
}

export function HeatmapView({ habits, daysInMonth }: HeatmapViewProps) {
  const getIntensityColor = (completionRate: number) => {
    if (completionRate === 0) return "bg-gray-100 dark:bg-gray-800"
    if (completionRate < 25) return "bg-green-200 dark:bg-green-900/40"
    if (completionRate < 50) return "bg-green-300 dark:bg-green-800/60"
    if (completionRate < 75) return "bg-green-400 dark:bg-green-700/80"
    return "bg-green-500 dark:bg-green-600"
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Monthly Heatmap</h3>

      <div className="space-y-3">
        {habits.map((habit) => (
          <Card key={habit.id} className="p-4">
            <h4 className="font-medium mb-3">{habit.name}</h4>
            <div className="grid grid-cols-31 gap-1">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const isCompleted = habit.completedDays.has(day)
                const completionRate = isCompleted ? 100 : 0
                const colorClass = getIntensityColor(completionRate)

                return (
                  <div
                    key={day}
                    className={`aspect-square rounded ${colorClass} border border-gray-200 dark:border-gray-700`}
                    title={`Day ${day}${isCompleted ? " - Completed" : ""}`}
                  />
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border" />
          <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40 border" />
          <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-800/60 border" />
          <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700/80 border" />
          <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600 border" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
