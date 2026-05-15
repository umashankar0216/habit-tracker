"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Users, UserPlus, Check, X, Trash2, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: "pending" | "accepted" | "rejected"
  sender?: { id: string; name: string }
  receiver?: { id: string; name: string }
}

interface Friend {
  id: string
  name: string
}

interface FriendManagementProps {
  currentUserId: string
  onViewFriend?: (friend: { id: string; name: string }) => void
}

export function FriendManagement({ currentUserId, onViewFriend }: FriendManagementProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [allUsers, setAllUsers] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadFriendsData()
  }, [currentUserId])

  const loadFriendsData = async () => {
    try {
      setLoading(true)
      setError("")

      const { data: requests, error: requestError } = await supabase
        .from("friend_requests")
        .select(`
          *,
          sender:sender_id(id, name),
          receiver:receiver_id(id, name)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

      if (requestError) throw requestError

      const mutual: Friend[] = []
      const incoming: FriendRequest[] = []
      const outgoing: FriendRequest[] = []

      requests?.forEach((req: any) => {
        if (req.status === "accepted") {
          const friendData = req.sender_id === currentUserId ? req.receiver : req.sender
          if (friendData && !mutual.find((f) => f.id === friendData.id)) {
            mutual.push(friendData)
          }
        } else if (req.status === "pending") {
          if (req.receiver_id === currentUserId) {
            incoming.push(req)
          } else if (req.sender_id === currentUserId) {
            outgoing.push(req)
          }
        }
      })

      setFriends(mutual)
      setIncomingRequests(incoming)
      setOutgoingRequests(outgoing)

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .neq("id", currentUserId)

      if (usersError) throw usersError

      const availableUsers =
        users?.filter(
          (u) =>
            !mutual.find((f) => f.id === u.id) &&
            !incoming.find((r) => r.sender_id === u.id) &&
            !outgoing.find((r) => r.receiver_id === u.id),
        ) || []

      setAllUsers(availableUsers)
    } catch (err: any) {
      setError(err.message || "Failed to load friends")
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (receiverId: string) => {
    try {
      setError("")

      const { error: insertError } = await supabase.from("friend_requests").insert([
        {
          sender_id: currentUserId,
          receiver_id: receiverId,
          status: "pending",
        },
      ])

      if (insertError) throw insertError
      await loadFriendsData()
    } catch (err: any) {
      setError(err.message || "Failed to send friend request")
    }
  }

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      setError("")

      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({
          status: accept ? "accepted" : "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) throw updateError
      await loadFriendsData()
    } catch (err: any) {
      setError(err.message || "Failed to respond to request")
    }
  }

  const removeFriend = async (friendId: string) => {
    try {
      setError("")

      const { error: deleteError } = await supabase
        .from("friend_requests")
        .delete()
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`,
        )

      if (deleteError) throw deleteError
      await loadFriendsData()
    } catch (err: any) {
      setError(err.message || "Failed to remove friend")
    }
  }

  const filteredUsers = allUsers.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) return <div className="p-4">Loading friends...</div>

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No friends yet. Send a friend request to get started!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <Card key={friend.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{friend.name}</p>
                </div>
                <div className="flex gap-2">
                  {onViewFriend && (
                    <Button size="sm" variant="outline" onClick={() => onViewFriend(friend)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeFriend(friend.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {incomingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Friend Requests ({incomingRequests.length})</h3>
          <div className="space-y-2">
            {incomingRequests.map((request) => (
              <Card key={request.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.sender?.name || "Unknown User"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => respondToRequest(request.id, true)}>
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => respondToRequest(request.id, false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {outgoingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-2">
            {outgoingRequests.map((request) => (
              <Card key={request.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.receiver?.name || "Unknown User"}</p>
                </div>
                <p className="text-xs text-muted-foreground">Pending...</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Available Users
        </h3>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No users match your search" : "You've already sent requests to all available users"}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                </div>
                <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Friend
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
