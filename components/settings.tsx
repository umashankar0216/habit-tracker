"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { Moon, Sun, Bell, Trash2, Crown } from "lucide-react"
import { HostDashboard } from "@/components/host-dashboard"

interface SettingsProps {
  userId: string
  isHost?: boolean
}

export function Settings({ userId, isHost = false }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState("09:00")
  const [userName, setUserName] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPreferences()
  }, [userId])

  const loadPreferences = async () => {
    const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    if (data) {
      setDarkMode(data.dark_mode)
      setReminderEnabled(data.reminder_enabled)
      setReminderTime(data.reminder_time || "09:00")
    }

    const { data: userData } = await supabase.from("users").select("name").eq("id", userId).single()
    if (userData?.name) {
      setUserName(userData.name)
    }
  }

  const updateUserName = async () => {
    if (!userName.trim()) {
      alert("Please enter a valid name")
      return
    }

    const { error } = await supabase.from("users").update({ name: userName }).eq("id", userId)

    if (error) {
      console.error("Error updating name:", error)
      alert("Failed to update name")
    } else {
      setEditingName(false)
      window.location.reload()
    }
  }

  const savePreferences = async () => {
    await supabase.from("user_preferences").upsert({
      user_id: userId,
      dark_mode: darkMode,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderTime,
      updated_at: new Date().toISOString(),
    })

    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  useEffect(() => {
    savePreferences()
  }, [darkMode, reminderEnabled, reminderTime])

  const handleClearAllData = async () => {
    setIsClearing(true)
    try {
      await Promise.all([
        supabase
          .from("habit_completions")
          .delete()
          .in("habit_id", supabase.from("habits").select("id").eq("user_id", userId)),
        supabase.from("habits").delete().eq("user_id", userId),
        supabase.from("sleep_tracking").delete().eq("user_id", userId),
        supabase.from("personal_goals").delete().eq("user_id", userId),
        supabase.from("daily_journals").delete().eq("user_id", userId),
        supabase.from("habit_notes").delete().eq("user_id", userId),
        supabase.from("user_preferences").delete().eq("user_id", userId),
      ])

      window.location.reload()
    } catch (error) {
      console.error("Error clearing data:", error)
    } finally {
      setIsClearing(false)
      setShowClearDialog(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`grid w-full grid-cols-${isHost ? "3" : "2"}`}>
          <TabsTrigger value="general">General</TabsTrigger>
          {isHost && (
            <TabsTrigger value="host" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Host</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Settings</h3>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Profile Name</h4>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={updateUserName}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{userName || "Not set"}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingName(true)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Label>Dark Mode</Label>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label>Daily Reminders</Label>
                </div>
                <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
              </div>

              {reminderEnabled && (
                <div>
                  <Label>Reminder Time</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {isHost && (
          <TabsContent value="host">
            <HostDashboard userId={userId} />
          </TabsContent>
        )}

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="p-6">
            <div className="pt-6 border-t border-destructive/20">
              <h4 className="text-sm font-semibold text-destructive mb-3">Danger Zone</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Permanently delete all your tracking data including habits, sleep logs, goals, and journals.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setShowClearDialog(true)} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All habits and their completion history</li>
                <li>All sleep tracking data</li>
                <li>All personal goals</li>
                <li>All daily journals</li>
                <li>All settings and preferences</li>
              </ul>
              <p className="font-semibold text-destructive mt-4">
                This will reset your account to a completely blank state.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? "Clearing..." : "Yes, Delete Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
