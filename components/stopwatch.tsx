"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw } from "lucide-react"

interface StopwatchProps {
  onClose?: () => void
}

export function Stopwatch({ onClose }: StopwatchProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [motivationalQuotes] = useState([
    "Every second counts towards your goal!",
    "You're building the life you want, one moment at a time.",
    "Consistency is the key to success.",
    "Small steps lead to big results.",
    "Focus on the process, not just the outcome.",
    "You are stronger than you think.",
    "Progress, not perfection.",
    "Keep pushing, you're closer than you think.",
    "Your future self will thank you for this effort.",
    "One day you will wish you started today.",
    "Don't watch the clock; do what it does. Keep going.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal.",
    "Believe you can and you're halfway there.",
    "You don't have to be great to start, but you have to start to be great.",
    "The future depends on what you do today.",
    "Excellence is not a skill, it's an attitude.",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream bigger. Do bigger.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little progress each day is big progress.",
    "It's going to be hard, but hard does not mean impossible.",
    "Don't wait for opportunity. Create it.",
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    "The key to success is to focus on goals, not obstacles.",
    "Dream so big you'll have no time for your fears.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Hustle until your idols become your rivals.",
    "Don't just dream it, do it.",
    "Everything you want is on the other side of fear.",
    "You've got this. Believe in yourself.",
    "Keep your eyes on the prize.",
    "Your time is now.",
    "Make it happen.",
  ])
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  useEffect(() => {
    if (isRunning) {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setCurrentQuote(randomQuote)

      const quoteInterval = setInterval(() => {
        const newQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
        setCurrentQuote(newQuote)
      }, 30000) // Change quote every 30 seconds

      return () => clearInterval(quoteInterval)
    }
  }, [isRunning, motivationalQuotes])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleToggle = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setTime(0)
    setIsRunning(false)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold">Focus Timer</h3>

        <div className="text-5xl font-bold font-mono text-orange-600 dark:text-orange-400 tracking-wider">
          {formatTime(time)}
        </div>

        <p className="text-sm italic text-muted-foreground px-4">{currentQuote}</p>

        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={handleToggle} variant={isRunning ? "destructive" : "default"}>
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  )
}
