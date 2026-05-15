"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Trophy, TrendingUp, Users } from "lucide-react"

interface FriendComparisonProps {
  currentUserId: string
  month: string
}

export function FriendComparison({ currentUserId, month }: FriendComparisonProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadLeaderboard()
  }, [currentUserId, month])

  const loadLeaderboard = async () => {
    try {
      // Fetch all accepted friend requests for current user
      const { data: friendRequests, error: requestError } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

      if (requestError) throw requestError

      // Extract mutual friend IDs
      const friendIds = (friendRequests || []).map((req: any) =>
        req.sender_id === currentUserId ? req.receiver_id : req.sender_id,
      )

      if (friendIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch friend users with their data
      const { data: friends, error: friendError } = await supabase.from("users").select("*").in("id", friendIds)

      if (friendError) throw friendError

      // Calculate stats for each friend
      const userStats = await Promise.all(
        (friends || []).map(async (user) => {
          const { data: habits } = await supabase
            .from("habits")
            .select("*, habit_completions(*)")
            .eq("user_id", user.id)
            .eq("month", month)

          const totalCompletions =
            habits?.reduce((sum, h) => {
              return sum + h.habit_completions.filter((c: any) => c.completed).length
            }, 0) || 0

          const totalPossible = habits?.reduce((sum, h) => sum + 31, 0) || 1

          return {
            user,
            totalCompletions,
            completionRate: (totalCompletions / totalPossible) * 100,
            habitCount: habits?.length || 0,
          }
        }),
      )

      // Add current user to the list
      const { data: currentUserHabits } = await supabase
        .from("habits")
        .select("*, habit_completions(*)")
        .eq("user_id", currentUserId)
        .eq("month", month)

      const currentUserCompletions =
        currentUserHabits?.reduce((sum, h) => {
          return sum + h.habit_completions.filter((c: any) => c.completed).length
        }, 0) || 0

      const currentUserPossible = currentUserHabits?.reduce((sum, h) => sum + 31, 0) || 1

      const { data: currentUserData } = await supabase.from("users").select("*").eq("id", currentUserId).single()

      if (currentUserData) {
        userStats.push({
          user: currentUserData,
          totalCompletions: currentUserCompletions,
          completionRate: (currentUserCompletions / currentUserPossible) * 100,
          habitCount: currentUserHabits?.length || 0,
        })
      }

      userStats.sort((a, b) => b.totalCompletions - a.totalCompletions)
      setLeaderboard(userStats)
    } catch (err) {
      console.error("[v0] Error loading leaderboard:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading comparison...</div>

  if (!leaderboard.length) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
        <p className="text-sm text-muted-foreground">Add friends to see habit comparisons and compete together!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        Friends Comparison
      </h3>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <Card
            key={entry.user.id}
            className={`p-4 ${entry.user.id === currentUserId ? "border-primary border-2" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                  {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                  {index > 0 && <span className="text-sm">#{index + 1}</span>}
                </div>

                <div>
                  <h4 className="font-medium">
                    {entry.user.name}
                    {entry.user.id === currentUserId && " (You)"}
                  </h4>
                  <p className="text-sm text-muted-foreground">{entry.habitCount} habits tracked</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">{entry.totalCompletions}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {entry.completionRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
