import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import HabitTracker from "@/components/habit-tracker"

export default async function TrackerPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <HabitTracker />
}
