"use client"

import { Card } from "@/components/ui/card"
import { Flame, Trophy, Target } from "lucide-react"

interface StreakTrackerProps {
  habits: Array<{
    id: string
    name: string
    completedDays: Set<number>
  }>
  daysInMonth: number
}

export function StreakTracker({ habits, daysInMonth }: StreakTrackerProps) {
  const calculateStreak = (completedDays: Set<number>) => {
    const sortedDays = Array.from(completedDays).sort((a, b) => b - a)
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else if (sortedDays[i] === sortedDays[i - 1] - 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Calculate current streak from today
    const today = new Date().getDate()
    if (completedDays.has(today)) {
      currentStreak = 1
      for (let day = today - 1; day >= 1; day--) {
        if (completedDays.has(day)) {
          currentStreak++
        } else {
          break
        }
      }
    }

    return { currentStreak, longestStreak }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        Streaks & Achievements
      </h3>
      <div className="grid gap-4">
        {habits.map((habit) => {
          const { currentStreak, longestStreak } = calculateStreak(habit.completedDays)
          const completionRate = (habit.completedDays.size / daysInMonth) * 100

          return (
            <Card key={habit.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{habit.name}</h4>
                  <p className="text-sm text-muted-foreground">{completionRate.toFixed(0)}% complete</p>
                </div>
                {currentStreak >= 7 && (
                  <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full text-xs">
                    <Flame className="h-3 w-3" />
                    On Fire!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl font-bold">{currentStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Current</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-2xl font-bold">{longestStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{habit.completedDays.size}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
