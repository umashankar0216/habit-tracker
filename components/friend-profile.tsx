"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, TrendingUp, Calendar, Flame } from "lucide-react"

interface FriendProfileProps {
  friendId: string
  friendName: string
  onBack: () => void
}

type Habit = {
  id: string
  name: string
  completedDays: Set<number>
}

type SleepLog = { [key: number]: number }

const DAYS_OF_WEEK = ["M", "T", "W", "Th", "F", "Sa", "Su"]
const SLEEP_OPTIONS = [9, 8, 7, 6, 5]

export function FriendProfile({ friendId, friendName, onBack }: FriendProfileProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [sleepLog, setSleepLog] = useState<SleepLog>({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"tracker" | "analytics" | "streaks">("tracker")
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const supabase = createClient()

  useEffect(() => {
    loadFriendData()
  }, [friendId, currentMonth, currentYear])

  const loadFriendData = async () => {
    try {
      setLoading(true)
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

      const { data: habitsData } = await supabase
        .from("habits")
        .select("*, habit_completions(*)")
        .eq("user_id", friendId)
        .eq("month", monthKey)

      if (habitsData) {
        const transformedHabits = habitsData.map((h: any) => ({
          id: h.id,
          name: h.name,
          completedDays: new Set(h.habit_completions.filter((c: any) => c.completed).map((c: any) => c.day)),
        }))
        setHabits(transformedHabits)
      }

      const { data: sleepData } = await supabase
        .from("sleep_tracking")
        .select("*")
        .eq("user_id", friendId)
        .eq("month", monthKey)

      if (sleepData) {
        const sleepObj: SleepLog = {}
        sleepData.forEach((s: any) => {
          sleepObj[s.day] = s.hours
        })
        setSleepLog(sleepObj)
      }
    } catch (error) {
      console.error("[v0] Error loading friend data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysArray = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const dayOfWeekIndex = date.getDay()
      const dayOfWeek = DAYS_OF_WEEK[dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1]
      days.push({ number: i, dayOfWeek })
    }
    return days
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {friendName}'s profile...</p>
        </div>
      </div>
    )
  }

  const days = getDaysArray()
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const monthName = monthNames[currentMonth]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{friendName}'s Tracking</h1>
            <p className="text-sm text-muted-foreground">(Read-only view)</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-card rounded-lg p-4 border">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            &larr;
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {monthName} {currentYear}
            </h2>
            <p className="text-sm text-muted-foreground">{friendName}'s data</p>
          </div>

          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            &rarr;
          </Button>
        </div>

        <div className="flex gap-2 border-b overflow-x-auto pb-2">
          <Button variant={view === "tracker" ? "default" : "ghost"} onClick={() => setView("tracker")}>
            <Calendar className="mr-2 h-4 w-4" />
            Tracker
          </Button>
          <Button variant={view === "analytics" ? "default" : "ghost"} onClick={() => setView("analytics")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant={view === "streaks" ? "default" : "ghost"} onClick={() => setView("streaks")}>
            <Flame className="mr-2 h-4 w-4" />
            Streaks
          </Button>
        </div>

        {view === "tracker" && (
          <div className="space-y-6">
            <Card className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[200px_repeat(31,40px)] gap-1 p-4 border-b bg-muted/50">
                  <div className="font-semibold">Habit</div>
                  {days.map((day) => (
                    <div key={day.number} className="text-center">
                      <div className="text-xs font-medium">{day.number}</div>
                      <div className="text-xs text-muted-foreground">{day.dayOfWeek}</div>
                    </div>
                  ))}
                </div>

                {habits.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {friendName} hasn't created any habits yet
                  </div>
                ) : (
                  <>
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="grid grid-cols-[200px_repeat(31,40px)] gap-1 p-4 border-b hover:bg-accent/50"
                      >
                        <div className="flex items-center pr-4">
                          <span className="text-sm font-medium truncate">{habit.name}</span>
                        </div>
                        {days.map((day) => (
                          <div
                            key={day.number}
                            className={`h-10 rounded border-2 flex items-center justify-center text-xs ${
                              habit.completedDays.has(day.number)
                                ? "bg-green-500 border-green-600"
                                : "bg-background border-muted-foreground/20"
                            }`}
                          >
                            {habit.completedDays.has(day.number) ? "✓" : ""}
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="grid grid-cols-[200px_repeat(31,40px)] gap-1 p-4 bg-muted/30 font-semibold">
                      <div>Total Points</div>
                      {days.map((day) => {
                        const completed = habits.filter((h) => h.completedDays.has(day.number)).length
                        return (
                          <div key={day.number} className="text-center text-sm">
                            {completed > 0 ? completed : "-"}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <div className="p-4 border-t">
                  <h3 className="font-semibold mb-4">Sleep</h3>
                  {SLEEP_OPTIONS.map((hours) => (
                    <div key={hours} className="grid grid-cols-[200px_repeat(31,40px)] gap-1 py-2">
                      <div className="text-sm text-muted-foreground">{hours}hrs</div>
                      {days.map((day) => (
                        <div
                          key={day.number}
                          className={`h-8 rounded border flex items-center justify-center ${
                            sleepLog[day.number] === hours
                              ? "bg-blue-500 border-blue-600"
                              : "bg-background border-muted-foreground/20"
                          }`}
                        >
                          {sleepLog[day.number] === hours ? "✓" : ""}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {view === "analytics" && (
          <div className="space-y-6">
            {(() => {
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
              const totalHabits = habits.length
              const totalDays = daysInMonth
              const totalPossible = totalHabits * totalDays
              const totalCompleted = habits.reduce((sum, h) => sum + h.completedDays.size, 0)
              const overallAccuracy = totalPossible > 0 ? ((totalCompleted / totalPossible) * 100).toFixed(1) : "0"

              const avgSleep =
                Object.values(sleepLog).length > 0
                  ? (
                      Object.values(sleepLog).reduce((a: any, b: any) => a + b, 0) / Object.values(sleepLog).length
                    ).toFixed(1)
                  : "0"

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Overall Accuracy</p>
                        <p className="text-4xl font-bold text-blue-600">{overallAccuracy}%</p>
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Total Completions</p>
                        <p className="text-4xl font-bold text-green-600">{totalCompleted}</p>
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Average Sleep</p>
                        <p className="text-4xl font-bold text-purple-600">{avgSleep} hrs</p>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Habit Accuracy</h3>
                    <div className="space-y-3">
                      {habits.map((habit) => {
                        const accuracy =
                          habit.completedDays.size > 0 ? Math.round((habit.completedDays.size / totalDays) * 100) : 0
                        return (
                          <div key={habit.id} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{habit.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${accuracy}%` }}></div>
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{accuracy}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </>
              )
            })()}
          </div>
        )}

        {view === "streaks" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Current Streaks</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {habits.map((habit) => {
                  let currentStreak = 0
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

                  for (let day = daysInMonth; day >= 1; day--) {
                    if (habit.completedDays.has(day)) {
                      currentStreak++
                    } else {
                      break
                    }
                  }

                  return (
                    <Card key={habit.id} className="p-4 border-l-4 border-orange-500">
                      <p className="text-sm text-muted-foreground mb-1">{habit.name}</p>
                      <p className="text-3xl font-bold text-orange-500">{currentStreak} days</p>
                    </Card>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
