"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Trophy, Star, Target, Flame, Award } from "lucide-react"

interface AchievementsProps {
  userId: string
}

export function Achievements({ userId }: AchievementsProps) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAchievements()
  }, [userId])

  const loadAchievements = async () => {
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })

    if (data) {
      setAchievements(data)
    }
    setLoading(false)
  }

  const achievementIcons: any = {
    trophy: Trophy,
    star: Star,
    target: Target,
    flame: Flame,
    award: Award,
  }

  const achievementColors: any = {
    trophy: "text-yellow-500",
    star: "text-blue-500",
    target: "text-green-500",
    flame: "text-orange-500",
    award: "text-purple-500",
  }

  if (loading) return <div>Loading achievements...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Achievements ({achievements.length})
      </h3>

      {achievements.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No achievements yet. Keep tracking to earn some!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievementIcons[achievement.icon] || Award
            const colorClass = achievementColors[achievement.icon] || "text-gray-500"

            return (
              <Card key={achievement.id} className="p-4 text-center hover:border-primary transition-colors">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${colorClass}`} />
                <h4 className="font-medium text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
