"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Check, X, Clock, User } from "lucide-react"

interface PrivacyRequest {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  requested_at: string
  reviewed_at?: string
  reason?: string
  users: {
    name: string
    email?: string
  }
}

interface AdminPanelProps {
  adminId: string
}

export function AdminPanel({ adminId }: AdminPanelProps) {
  const [requests, setRequests] = useState<PrivacyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    console.log("[v0] Admin Panel: Loading privacy requests for admin:", adminId)
    setLoading(true)

    const { data, error } = await supabase
      .from("privacy_requests")
      .select(`
        *,
        users:user_id (
          name
        )
      `)
      .order("requested_at", { ascending: false })

    console.log("[v0] Admin Panel: Privacy requests query result:", { data, error, count: data?.length })

    if (error) {
      console.error("[v0] Admin Panel: Error loading privacy requests:", error)
    }

    if (data) {
      console.log("[v0] Admin Panel: Loaded requests:", data)
      setRequests(data as any)
    }
    setLoading(false)
  }

  const handleRequest = async (requestId: string, userId: string, approve: boolean) => {
    console.log("[v0] Admin Panel: Handling request:", { requestId, userId, approve })
    const status = approve ? "approved" : "rejected"

    const { error: updateError } = await supabase
      .from("privacy_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", requestId)

    console.log("[v0] Admin Panel: Request update result:", { updateError })

    if (approve) {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ approved_for_privacy: true })
        .eq("id", userId)

      console.log("[v0] Admin Panel: User approval update result:", { userUpdateError })
    }

    // Reload requests
    loadRequests()
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const reviewedRequests = requests.filter((r) => r.status !== "pending")

  console.log("[v0] Admin Panel: Requests breakdown:", {
    total: requests.length,
    pending: pendingRequests.length,
    reviewed: reviewedRequests.length,
  })

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Privacy Requests</h3>
          <Badge variant="secondary">{pendingRequests.length} Pending</Badge>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending privacy requests</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{request.users.name}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(request.requested_at).toLocaleString()}
                    </p>
                    {request.reason && (
                      <p className="text-sm mt-2">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, request.user_id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.id, request.user_id, false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {reviewedRequests.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Request History</h4>
          <div className="space-y-2">
            {reviewedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between text-sm p-2 rounded border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{request.users.name}</span>
                </div>
                <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                  {request.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
