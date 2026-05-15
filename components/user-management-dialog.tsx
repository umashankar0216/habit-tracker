"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: string[]
  currentUser: string
  onAddUser: (name: string) => void
  onDeleteUser: (name: string) => void
}

export function UserManagementDialog({
  open,
  onOpenChange,
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
}: UserManagementDialogProps) {
  const [newUserName, setNewUserName] = useState("")

  const handleAdd = () => {
    if (newUserName.trim()) {
      onAddUser(newUserName.trim())
      setNewUserName("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Users</DialogTitle>
          <DialogDescription>Add or remove users from your habit tracker.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Add New User</Label>
            <div className="flex gap-2">
              <Input
                id="user-name"
                placeholder="Enter user name..."
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleAdd}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Existing Users</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">
                    {user}
                    {user === currentUser && <span className="ml-2 text-xs text-muted-foreground">(Current)</span>}
                  </span>
                  {users.length > 1 && user !== currentUser && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
