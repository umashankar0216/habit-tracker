"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface AddHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string) => Promise<void>
}

export function AddHabitDialog({ open, onOpenChange, onAdd }: AddHabitDialogProps) {
  const [habitName, setHabitName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = habitName.trim()
    if (!name || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onAdd(name)
      setHabitName("")
      onOpenChange(false)
    } catch {
      setError("We couldn&apos;t save this habit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
            <DialogDescription>Create a new habit to track across the month.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="habit-name">Habit Name</Label>
            <Input
              id="habit-name"
              placeholder="e.g., Morning Exercise, Read 30 mins"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="mt-2"
              autoFocus
              disabled={isSubmitting}
            />
            {error ? <p className="mt-2 text-sm text-destructive" role="alert">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!habitName.trim() || isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
