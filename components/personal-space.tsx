"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Heart, Target, BookOpen, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Goal {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

interface Journal {
  id: string
  date: string
  mood: string
  note: string
}

const MOOD_OPTIONS = [
  { emoji: "😄", label: "Great" },
  { emoji: "😊", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😞", label: "Bad" },
]

export function PersonalSpace() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [newGoal, setNewGoal] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [noteContent, setNoteContent] = useState("")
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (userId) {
      loadGoals()
      loadJournals()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadJournalForDate()
    }
  }, [selectedDate, userId])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  const loadGoals = async () => {
    const { data, error } = await supabase.from("personal_goals").select("*").eq("user_id", userId).order("created_at")

    if (!error && data) {
      setGoals(data)
    }
  }

  const loadJournals = async () => {
    const { data, error } = await supabase
      .from("daily_journals")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (!error && data) {
      setJournals(data)
    }
  }

  const loadJournalForDate = async () => {
    const { data, error } = await supabase
      .from("daily_journals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", selectedDate)
      .maybeSingle()

    if (!error) {
      if (data) {
        setNoteContent(data.note || "")
        setSelectedMood(data.mood || "")
      } else {
        setNoteContent("")
        setSelectedMood("")
      }
    }
  }

  const addGoal = async () => {
    if (!newGoal.trim() || !userId) return

    const { data, error } = await supabase
      .from("personal_goals")
      .insert({
        user_id: userId,
        text: newGoal,
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setGoals([...goals, data])
      setNewGoal("")
    }
  }

  const toggleGoal = async (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return

    const { error } = await supabase.from("personal_goals").update({ completed: !goal.completed }).eq("id", id)

    if (!error) {
      setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)))
    }
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("personal_goals").delete().eq("id", id)

    if (!error) {
      setGoals(goals.filter((g) => g.id !== id))
    }
  }

  const saveJournal = async () => {
    if (!userId) return

    const { error } = await supabase.from("daily_journals").upsert(
      {
        user_id: userId,
        date: selectedDate,
        mood: selectedMood,
        note: noteContent.trim() || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,date",
      },
    )

    if (!error) {
      loadJournals()
    }
  }

  const setMood = (emoji: string, label: string) => {
    setSelectedMood(emoji)
  }

  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        saveJournal()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [noteContent, selectedMood])

  const activeGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)
  const completionRate = goals.length > 0 ? ((completedGoals.length / goals.length) * 100).toFixed(0) : 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Goals</p>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Journal Entries</p>
              <p className="text-2xl font-bold">{journals.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Goals Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Personal Goals</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="flex-1"
              />
              <Button onClick={addGoal} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeGoals.length === 0 && completedGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No goals yet. Add one to get started!</p>
              ) : (
                <>
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <button onClick={() => toggleGoal(goal.id)} className="flex-shrink-0">
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      </button>
                      <span className="flex-1 text-sm">{goal.text}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  {completedGoals.length > 0 && (
                    <>
                      <div className="pt-4">
                        <p className="text-xs text-muted-foreground mb-2">Completed</p>
                      </div>
                      {completedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 group opacity-60"
                        >
                          <button onClick={() => toggleGoal(goal.id)} className="flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </button>
                          <span className="flex-1 text-sm line-through">{goal.text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGoal(goal.id)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Daily Journal Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Daily Journal</h3>
          </div>

          <div className="space-y-4">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

            {/* Mood Selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">How are you feeling today?</p>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setMood(mood.emoji, mood.label)}
                    className={`flex-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                      selectedMood === mood.emoji
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="text-2xl">{mood.emoji}</div>
                    <div className="text-xs mt-1">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Area */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Journal Entry</p>
              <Textarea
                placeholder="Write your thoughts, reflections, or experiences..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Changes are saved automatically</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mood History */}
      {journals.filter((j) => j.mood).length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-pink-600" />
            <h3 className="text-lg font-semibold">Mood History</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {journals
              .filter((j) => j.mood)
              .slice(0, 30)
              .map((journal) => (
                <button
                  key={journal.id}
                  onClick={() => setSelectedDate(journal.date)}
                  className={`flex flex-col items-center p-2 rounded-lg border hover:bg-accent transition-colors ${
                    selectedDate === journal.date ? "bg-accent ring-2 ring-primary/20" : ""
                  }`}
                >
                  <span className="text-2xl">{journal.mood}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(journal.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
