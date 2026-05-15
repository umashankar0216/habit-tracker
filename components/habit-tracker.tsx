"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Trash2, TrendingUp, Calendar, User, Users, Flame, SettingsIcon, LogOut, Crown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PersonalSpace } from "@/components/personal-space"
import { StreakTracker } from "@/components/streak-tracker"
import { FriendComparison } from "@/components/friend-comparison"
import { ExportData } from "@/components/export-data"
import { Settings } from "@/components/settings"
import { AdminPanel } from "@/components/admin-panel"
import { FriendProfile } from "@/components/friend-profile"
import { FriendManagement } from "@/components/friend-management"
import { Stopwatch } from "@/components/stopwatch"
import { HostDashboard } from "@/components/host-dashboard"

type Habit = {
  id: string
  name: string
  completedDays: Set<number>
}

type SleepLog = { [key: number]: number }

type UndoAction = {
  type: "habit" | "sleep"
  habitId?: string
  day: number
  previousValue: boolean | number
  timestamp: number
}

const DAYS_OF_WEEK = ["M", "T", "W", "Th", "F", "Sa", "Su"]
const SLEEP_OPTIONS = [9, 8, 7, 6, 5]

export default function HabitTracker() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [habits, setHabits] = useState<Habit[]>([])
  const [sleepLog, setSleepLog] = useState<SleepLog>({})
  const [view, setView] = useState<
    "tracker" | "analytics" | "personal" | "streaks" | "comparison" | "settings" | "admin" | "friends" | "host"
  >("tracker")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [viewingFriend, setViewingFriend] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()

  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadAllUsers()
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedUserId) {
      loadHabitsAndSleep()
    }
  }, [selectedUserId, currentMonth, currentYear])

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("[v0] Auth error loading user:", authError)
      }
      
      if (user) {
        setCurrentUser(user)
        setSelectedUserId(user.id)
        console.log("[v0] Current user loaded:", user.email)

        const { data, error } = await supabase
          .from("users")
          .select("is_admin, name, active_group_id, role")
          .eq("id", user.id)
          .single()
        
        if (error) {
          console.warn("[v0] Could not load user details:", error)
        }
        
        if (data?.is_admin) {
          setIsAdmin(true)
          console.log("[v0] Current user is admin, can see all data")
        }
        if (data?.role === "host") {
          setIsHost(true)
          console.log("[v0] Current user is a host")
        }
      } else {
        console.log("[v0] No authenticated user found")
      }
    } catch (err) {
      console.error("[v0] Exception loading current user:", err)
    }
    setLoading(false)
  }

  const loadAllUsers = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        user:users(*)
      `)
      .eq("group_members.group_id", currentUser.active_group_id || "")

    if (!error && data) {
      const users = data.map((item: any) => item.user).filter(Boolean)
      setAllUsers(users)
    }
  }

  const loadHabitsAndSleep = async () => {
    try {
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*, habit_completions(*)")
        .eq("user_id", selectedUserId)
        .eq("month", monthKey)

      if (habitsError) {
        console.warn("[v0] Error loading habits:", habitsError)
      } else if (habitsData) {
        console.log("[v0] Habits loaded:", habitsData.length)
        const transformedHabits = habitsData.map((h: any) => ({
          id: h.id,
          name: h.name,
          completedDays: new Set(h.habit_completions.filter((c: any) => c.completed).map((c: any) => c.day)),
        }))
        setHabits(transformedHabits)
      }

      const { data: sleepData, error: sleepError } = await supabase
        .from("sleep_tracking")
        .select("*")
        .eq("user_id", selectedUserId)
        .eq("month", monthKey)

      if (sleepError) {
        console.warn("[v0] Error loading sleep data:", sleepError)
      } else if (sleepData) {
        const sleepObj: SleepLog = {}
        sleepData.forEach((s: any) => {
          sleepObj[s.day] = s.hours
        })
        setSleepLog(sleepObj)
      }
    } catch (err) {
      console.error("[v0] Exception loading habits and sleep:", err)
    }
  }

  const addHabit = async (name: string) => {
    if (!currentUser) {
      console.log("[v0] No current user, cannot add habit")
      return
    }

    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

    try {
      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: currentUser.id,
          name,
          month: monthKey,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding habit:", error)
        alert("Failed to add habit. Check if Supabase is connected.")
        return
      }

      if (data) {
        console.log("[v0] Habit added successfully:", data)
        setHabits([
          ...habits,
          {
            id: data.id,
            name: data.name,
            completedDays: new Set(),
          },
        ])
      }
    } catch (err) {
      console.error("[v0] Exception adding habit:", err)
      alert("Error adding habit. Check console for details.")
    }
  }

  const deleteHabit = async (id: string) => {
    try {
      const { error } = await supabase.from("habits").delete().eq("id", id)

      if (error) {
        console.error("[v0] Error deleting habit:", error)
        alert("Failed to delete habit")
        return
      }

      console.log("[v0] Habit deleted successfully:", id)
      setHabits(habits.filter((h) => h.id !== id))
    } catch (err) {
      console.error("[v0] Exception deleting habit:", err)
      alert("Error deleting habit. Check console for details.")
    }
  }

  const toggleDay = async (habitId: string, day: number) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) {
      console.warn("[v0] Habit not found:", habitId)
      return
    }

    const isCompleted = habit.completedDays.has(day)

    setUndoAction({
      type: "habit",
      habitId,
      day,
      previousValue: isCompleted,
      timestamp: Date.now(),
    })

    try {
      const { error } = await supabase.from("habit_completions").upsert(
        {
          habit_id: habitId,
          day,
          completed: !isCompleted,
        },
        {
          onConflict: "habit_id,day",
        },
      )

      if (error) {
        console.error("[v0] Error toggling habit completion:", error)
        alert("Failed to update habit. Check console for details.")
        return
      }

      console.log("[v0] Habit completion updated:", habitId, "day:", day)
      setHabits(
        habits.map((h) => {
          if (h.id === habitId) {
            const newCompletedDays = new Set(h.completedDays)
            if (isCompleted) {
              newCompletedDays.delete(day)
            } else {
              newCompletedDays.add(day)
            }
            return { ...h, completedDays: newCompletedDays }
          }
          return h
        }),
      )
    } catch (err) {
      console.error("[v0] Exception toggling habit completion:", err)
      alert("Error updating habit. Check console for details.")
    }
  }

  const updateSleep = async (day: number, hours: number) => {
    if (!selectedUserId) {
      console.warn("[v0] No user selected for sleep update")
      return
    }

    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

    setUndoAction({
      type: "sleep",
      day,
      previousValue: sleepLog[day] || 0,
      timestamp: Date.now(),
    })

    try {
      const { error } = await supabase.from("sleep_tracking").upsert(
        {
          user_id: selectedUserId,
          month: monthKey,
          day,
          hours,
        },
        {
          onConflict: "user_id,month,day",
        },
      )

      if (error) {
        console.error("[v0] Error updating sleep:", error)
        alert("Failed to update sleep log")
        return
      }

      console.log("[v0] Sleep log updated:", day, "hours:", hours)
      setSleepLog((prev) => ({
        ...prev,
        [day]: hours,
      }))
    } catch (err) {
      console.error("[v0] Exception updating sleep:", err)
      alert("Error updating sleep log. Check console for details.")
    }
  }

  const deleteSleep = async (day: number) => {
    if (!selectedUserId) return

    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
    const previousHours = sleepLog[day] || 0

    setUndoAction({
      type: "sleep",
      day,
      previousValue: previousHours,
      timestamp: Date.now(),
    })

    const { error } = await supabase
      .from("sleep_tracking")
      .delete()
      .eq("user_id", selectedUserId)
      .eq("month", monthKey)
      .eq("day", day)

    if (!error) {
      setSleepLog((prev) => {
        const newLog = { ...prev }
        delete newLog[day]
        return newLog
      })
    }
  }

  const handleUndo = async () => {
    if (!undoAction) return

    if (undoAction.type === "habit" && undoAction.habitId) {
      const { error } = await supabase.from("habit_completions").upsert(
        {
          habit_id: undoAction.habitId,
          day: undoAction.day,
          completed: undoAction.previousValue as boolean,
        },
        {
          onConflict: "habit_id,day",
        },
      )

      if (!error) {
        setHabits(
          habits.map((h) => {
            if (h.id === undoAction.habitId) {
              const newCompletedDays = new Set(h.completedDays)
              if (undoAction.previousValue) {
                newCompletedDays.add(undoAction.day)
              } else {
                newCompletedDays.delete(undoAction.day)
              }
              return { ...h, completedDays: newCompletedDays }
            }
            return h
          }),
        )
      }
    } else if (undoAction.type === "sleep") {
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
      const previousHours = undoAction.previousValue as number

      if (previousHours === 0) {
        await supabase
          .from("sleep_tracking")
          .delete()
          .eq("user_id", selectedUserId)
          .eq("month", monthKey)
          .eq("day", undoAction.day)
      } else {
        await supabase.from("sleep_tracking").upsert(
          {
            user_id: selectedUserId,
            month: monthKey,
            day: undoAction.day,
            hours: previousHours,
          },
          {
            onConflict: "user_id,month,day",
          },
        )
      }

      setSleepLog((prev) => {
        if (previousHours === 0) {
          const newLog = { ...prev }
          delete newLog[undoAction.day]
          return newLog
        }
        return {
          ...prev,
          [undoAction.day]: previousHours,
        }
      })
    }

    setUndoAction(null)
  }

  useEffect(() => {
    if (undoAction) {
      const timeout = setTimeout(() => {
        setUndoAction(null)
      }, 10000) // 10 seconds

      return () => clearTimeout(timeout)
    }
  }, [undoAction])

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

  const getMonthInfo = (month: number, year: number) => {
    const date = new Date(year, month, 1)
    const monthName = date.toLocaleString("default", { month: "long" })
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = date.getDay()

    return { monthName, year, daysInMonth, firstDayOfWeek }
  }

  const monthInfo = getMonthInfo(currentMonth, currentYear)

  const days = Array.from({ length: monthInfo.daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const adjustedFirstDay = monthInfo.firstDayOfWeek === 0 ? 6 : monthInfo.firstDayOfWeek - 1
    const dayOfWeekIndex = (adjustedFirstDay + i) % 7
    return {
      number: dayNum,
      dayOfWeek: DAYS_OF_WEEK[dayOfWeekIndex],
    }
  })

  const selectedUser = allUsers.find((u) => u.id === selectedUserId)

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/auth/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {undoAction && (
          <div className="flex items-center justify-center gap-4 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 p-3 rounded-lg border border-amber-300 dark:border-amber-700">
            <span className="text-sm font-medium">Action performed</span>
            <Button variant="outline" size="sm" onClick={handleUndo} className="bg-white dark:bg-amber-950">
              Undo
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-3xl font-bold">Getting 1% Better Each Day</h1>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedUser && (
            <ExportData
              habits={habits}
              sleepLog={sleepLog}
              month={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
              userName={selectedUser.name}
            />
          )}

          <Button variant="outline" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between bg-card rounded-lg p-4 border">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            &larr;
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {monthInfo.monthName} {monthInfo.year}
            </h2>
            <p className="text-sm text-muted-foreground">{selectedUser?.name}</p>
          </div>

          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            &rarr;
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
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
              <Button variant={view === "comparison" ? "default" : "ghost"} onClick={() => setView("comparison")}>
                <Users className="mr-2 h-4 w-4" />
                Compare
              </Button>
              <Button variant={view === "personal" ? "default" : "ghost"} onClick={() => setView("personal")}>
                <User className="mr-2 h-4 w-4" />
                Personal
              </Button>
              <Button variant={view === "friends" ? "default" : "ghost"} onClick={() => setView("friends")}>
                <Users className="mr-2 h-4 w-4" />
                Friends
              </Button>
              <Button variant={view === "settings" ? "default" : "ghost"} onClick={() => setView("settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
              {isAdmin && (
                <Button variant={view === "admin" ? "default" : "ghost"} onClick={() => setView("admin")}>
                  <User className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              )}
              {isHost && (
                <Button
                  onClick={() => setView("host")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    view === "host" ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Host</span>
                </Button>
              )}
            </div>
          </div>

          <div>
            <Stopwatch />
          </div>
        </div>

        {view === "tracker" && (
          <TrackerView
            habits={habits}
            sleepLog={sleepLog}
            days={days}
            onToggleDay={toggleDay}
            onDeleteHabit={deleteHabit}
            onUpdateSleep={updateSleep}
            onAddHabit={addHabit}
            onDeleteSleep={deleteSleep}
          />
        )}

        {view === "analytics" && (
          <AnalyticsView habits={habits} sleepLog={sleepLog} days={days} daysInMonth={monthInfo.daysInMonth} />
        )}

        {view === "streaks" && <StreakTracker habits={habits} daysInMonth={monthInfo.daysInMonth} />}

        {view === "comparison" && currentUser && (
          <FriendComparison
            currentUserId={currentUser.id}
            month={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
          />
        )}

        {view === "personal" && <PersonalSpace />}

        {view === "settings" && currentUser && <Settings userId={currentUser.id} />}

        {view === "admin" && isAdmin && currentUser && <AdminPanel adminId={currentUser.id} />}

        {view === "friends" && currentUser && (
          <>
            {viewingFriend ? (
              <FriendProfile
                friendId={viewingFriend.id}
                friendName={viewingFriend.name}
                onBack={() => setViewingFriend(null)}
              />
            ) : (
              <FriendManagement currentUserId={currentUser.id} onViewFriend={(friend) => setViewingFriend(friend)} />
            )}
          </>
        )}

        {view === "host" && <HostDashboard userId={currentUser?.id || ""} />}
      </div>
    </main>
  )
}

function TrackerView({
  habits,
  sleepLog,
  days,
  onToggleDay,
  onDeleteHabit,
  onUpdateSleep,
  onAddHabit,
  onDeleteSleep,
}: {
  habits: Habit[]
  sleepLog: SleepLog
  days: Array<{ number: number; dayOfWeek: string }>
  onToggleDay: (habitId: string, day: number) => void
  onDeleteHabit: (id: string) => void
  onUpdateSleep: (day: number, hours: number) => void
  onAddHabit: (name: string) => void
  onDeleteSleep: (day: number) => void
}) {
  const [newHabitName, setNewHabitName] = useState("")

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      onAddHabit(newHabitName.trim())
      setNewHabitName("")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a new habit..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <Button onClick={handleAddHabit}>Add Habit</Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[200px_repeat(31,40px)] gap-1 p-4 border-b bg-muted/50">
            <div className="font-semibold">Habit/Rules</div>
            {days.map((day) => (
              <div key={day.number} className="text-center">
                <div className="text-xs font-medium">{day.number}</div>
                <div className="text-xs text-muted-foreground">{day.dayOfWeek}</div>
              </div>
            ))}
          </div>

          {habits.map((habit) => (
            <div
              key={habit.id}
              className="grid grid-cols-[200px_repeat(31,40px)] gap-1 p-4 border-b hover:bg-accent/50"
            >
              <div className="flex items-center justify-between pr-4">
                <span className="text-sm font-medium truncate">{habit.name}</span>
                <Button variant="ghost" size="icon" onClick={() => onDeleteHabit(habit.id)} className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {days.map((day) => (
                <button
                  key={day.number}
                  onClick={() => onToggleDay(habit.id, day.number)}
                  className={`h-10 rounded border-2 transition-all hover:scale-110 ${
                    habit.completedDays.has(day.number)
                      ? "bg-green-500 border-green-600"
                      : "bg-background border-muted-foreground/20 hover:border-primary"
                  }`}
                />
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

          <div className="p-4 border-t">
            <h3 className="font-semibold mb-4">Sleep</h3>
            <div className="grid grid-cols-[200px_repeat(31,40px)] gap-1 py-2 border-b border-muted-foreground/20">
              <div className="text-sm text-muted-foreground">Clear</div>
              {days.map((day) => (
                <button
                  key={day.number}
                  onClick={() => onDeleteSleep(day.number)}
                  disabled={!sleepLog[day.number]}
                  className={`h-8 rounded border transition-all hover:scale-110 ${
                    sleepLog[day.number]
                      ? "bg-destructive/10 border-destructive hover:bg-destructive/20"
                      : "bg-muted/20 border-muted-foreground/10 cursor-not-allowed opacity-30"
                  }`}
                  title={sleepLog[day.number] ? "Clear sleep data" : "No sleep data"}
                >
                  <span className="text-xs text-destructive">✕</span>
                </button>
              ))}
            </div>
            {SLEEP_OPTIONS.map((hours) => (
              <div key={hours} className="grid grid-cols-[200px_repeat(31,40px)] gap-1 py-2">
                <div className="text-sm text-muted-foreground">{hours}hrs</div>
                {days.map((day) => (
                  <button
                    key={day.number}
                    onClick={() => onUpdateSleep(day.number, hours)}
                    className={`h-8 rounded border transition-all hover:scale-110 ${
                      sleepLog[day.number] === hours
                        ? "bg-blue-500 border-blue-600"
                        : "bg-background border-muted-foreground/20 hover:border-primary"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function AnalyticsView({
  habits,
  sleepLog,
  days,
  daysInMonth,
}: {
  habits: Habit[]
  sleepLog: SleepLog
  days: Array<{ number: number; dayOfWeek: string }>
  daysInMonth: number
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const dailyAccuracy = days.map((day) => {
    const total = habits.length
    const completed = habits.filter((h) => h.completedDays.has(day.number)).length
    const percentage = total > 0 ? (completed / total) * 100 : 0
    return { day: day.number, percentage, completed, total }
  })

  const sleepChartData = Object.entries(sleepLog)
    .map(([day, hours]) => ({
      day: Number.parseInt(day),
      hours,
    }))
    .sort((a, b) => a.day - b.day)

  const totalHabits = habits.length
  const totalDays = daysInMonth
  const totalPossible = totalHabits * totalDays
  const totalCompleted = habits.reduce((sum, h) => sum + h.completedDays.size, 0)
  const overallAccuracy = totalPossible > 0 ? ((totalCompleted / totalPossible) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall Accuracy</p>
            <p className="text-4xl font-bold text-blue-600">{overallAccuracy}%</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Completed</p>
            <p className="text-4xl font-bold text-green-600">{totalCompleted}</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Active Habits</p>
            <p className="text-4xl font-bold text-purple-600">{totalHabits}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Daily Accuracy</h3>
        <div className="grid grid-cols-7 gap-2">
          {dailyAccuracy.map((data) => (
            <button
              key={data.day}
              onClick={() => setSelectedDay(data.day)}
              className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                selectedDay === data.day ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs font-medium mb-1">{data.day}</div>
                <div
                  className={`text-lg font-bold ${
                    data.percentage >= 80
                      ? "text-green-600"
                      : data.percentage >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {data.percentage.toFixed(0)}%
                </div>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted"
                  opacity="0.2"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={
                    data.percentage >= 80
                      ? "text-green-600"
                      : data.percentage >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }
                  strokeDasharray={`${(data.percentage / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </Card>

      {Object.keys(sleepLog).length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <h3 className="text-xl font-bold mb-4 text-white">Sleep Hours Trend</h3>
          <SleepChart data={sleepChartData} />
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Habit Performance</h3>
        <div className="space-y-4">
          {habits.map((habit) => {
            const completed = habit.completedDays.size
            const percentage = totalDays > 0 ? (completed / totalDays) * 100 : 0

            return (
              <div key={habit.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{habit.name}</span>
                  <span className="text-muted-foreground">
                    {completed}/{totalDays} days
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function SleepChart({ data }: { data: Array<{ day: number; hours: number }> }) {
  const maxHours = 10
  const [hoveredPoint, setHoveredPoint] = useState<{ day: number; hours: number; x: number; y: number } | null>(null)

  const chartWidth = 800
  const chartHeight = 300
  const padding = 40

  const xScale = (day: number) => padding + ((day - 1) / 30) * (chartWidth - padding * 2)
  const yScale = (hours: number) => chartHeight - padding - ((hours - 0) / maxHours) * (chartHeight - padding * 2)

  const pathData = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.day)} ${yScale(d.hours)}`).join(" ")

  const areaPath = `${pathData} L ${xScale(data[data.length - 1].day)} ${chartHeight - padding} L ${xScale(data[0].day)} ${chartHeight - padding} Z`

  return (
    <div className="relative">
      <svg width="100%" height="300" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        <defs>
          <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="rgb(6, 182, 212)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {[0, 2, 4, 6, 8, 10].map((h) => (
          <line
            key={h}
            x1={padding}
            y1={yScale(h)}
            x2={chartWidth - padding}
            y2={yScale(h)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#sleepGradient)" />

        <path d={pathData} fill="none" stroke="rgb(6, 182, 212)" strokeWidth="3" strokeLinecap="round" />

        {data.map((d) => (
          <circle
            key={d.day}
            cx={xScale(d.day)}
            cy={yScale(d.hours)}
            r="6"
            fill="rgb(6, 182, 212)"
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer hover:r-8 transition-all"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setHoveredPoint({
                day: d.day,
                hours: d.hours,
                x: rect.left + rect.width / 2,
                y: rect.top,
              })
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {hoveredPoint && (
        <div
          className="absolute bg-slate-900 text-white px-3 py-2 rounded-lg text-sm border border-cyan-500/50 pointer-events-none"
          style={{
            left: `${(hoveredPoint.x / window.innerWidth) * 100}%`,
            top: "0",
            transform: "translate(-50%, -100%) translateY(-10px)",
          }}
        >
          <div className="font-medium">Day {hoveredPoint.day}</div>
          <div className="text-cyan-400">{hoveredPoint.hours} hours</div>
        </div>
      )}
    </div>
  )
}
