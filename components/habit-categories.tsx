"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Plus, Folder } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface HabitCategoriesProps {
  userId: string
  onCategorySelect?: (categoryId: string) => void
}

export function HabitCategories({ userId, onCategorySelect }: HabitCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6")
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [userId])

  const loadCategories = async () => {
    const { data } = await supabase.from("habit_categories").select("*").eq("user_id", userId)

    if (data) {
      setCategories(data)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const { data } = await supabase
      .from("habit_categories")
      .insert({
        user_id: userId,
        name: newCategoryName,
        color: newCategoryColor,
      })
      .select()
      .single()

    if (data) {
      setCategories([...categories, data])
      setNewCategoryName("")
      setNewCategoryColor("#3b82f6")
      setOpen(false)
    }
  }

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Categories
        </Label>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Fitness, Learning"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        newCategoryColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={addCategory} className="w-full">
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            className="px-3 py-1 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: category.color }}
            onClick={() => onCategorySelect?.(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
