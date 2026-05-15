"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Crown, Users, Zap, Eye, Trash2, Lock, Share2, BarChart3 } from "lucide-react"

interface HostDashboardProps {
  userId: string
}

export function HostDashboard({ userId }: HostDashboardProps) {
  const [hostData, setHostData] = useState<any>(null)
  const [privileges, setPrivileges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadHostData()
  }, [userId])

  const loadHostData = async () => {
    try {
      // Fetch user role
      const { data: userData } = await supabase.from("users").select("role, name, is_admin").eq("id", userId).single()

      if (userData) {
        // Load privileges based on role
        const { data: privilegeData } = await supabase.from("host_privileges").select("privilege").eq("user_id", userId)

        const uniquePrivileges = Array.from(new Set(privilegeData?.map((p: any) => p.privilege) || []))
        setPrivileges(uniquePrivileges)
        setHostData(userData)
      }
    } catch (error) {
      console.error("[v0] Error loading host data:", error)
    } finally {
      setLoading(false)
    }
  }

  const privilegesList = [
    {
      icon: Users,
      title: "Friend Management",
      description: "Send/accept/reject friend requests and manage connections",
      category: "Friends",
    },
    {
      icon: Eye,
      title: "View Analytics",
      description: "Access detailed tracking analytics and statistics",
      category: "Analytics",
    },
    {
      icon: Zap,
      title: "Manage Habits",
      description: "Create, edit, and delete your habits freely",
      category: "Habits",
    },
    {
      icon: Share2,
      title: "Data Sharing",
      description: "Share tracking data with mutual friends",
      category: "Sharing",
    },
    {
      icon: Lock,
      title: "Privacy Control",
      description: "Control who can see your profile and data",
      category: "Privacy",
    },
    {
      icon: BarChart3,
      title: "Comparison",
      description: "Compare habits and progress with friends",
      category: "Analytics",
    },
    {
      icon: Trash2,
      title: "Data Management",
      description: "Export or clear your personal tracking data",
      category: "Data",
    },
    {
      icon: Crown,
      title: "Host Status",
      description: "Full control over your account and data",
      category: "Account",
    },
  ]

  if (loading) {
    return <div className="text-center py-8">Loading host dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h3 className="text-2xl font-bold">Host Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You have full control and access to all features as a host member
            </p>
          </div>
        </div>
      </Card>

      {/* Role Info */}
      {hostData && (
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{hostData.role || "User"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{hostData.name}</p>
            </div>
            {hostData.is_admin && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Admin Access</p>
                <p className="text-sm font-semibold text-green-600">✓ Enabled</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Privileges Grid */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Your Privileges</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privilegesList.map((priv, idx) => {
            const Icon = priv.icon
            return (
              <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-sm">{priv.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{priv.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {priv.category}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* What You Can Do */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">What You Can Do</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Create and manage unlimited habits and track daily progress</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Send friend requests and view mutual friends' tracking data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Access detailed analytics and comparison with friends</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Use motivational timer/stopwatch for focused work sessions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Track sleep logs and view personal goals and journals</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Customize settings including dark mode and reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>Export or permanently delete your personal data anytime</span>
          </li>
        </ul>
      </Card>

      {/* What You Cannot Do */}
      <Card className="p-6 border-red-200 dark:border-red-900/50">
        <h4 className="text-lg font-semibold mb-4">What You Cannot Do</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
            <span>View or edit friends' data (read-only access only)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
            <span>Access or manage other users' accounts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
            <span>Delete or modify friends' tracking history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
            <span>Change system settings or other user preferences</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
