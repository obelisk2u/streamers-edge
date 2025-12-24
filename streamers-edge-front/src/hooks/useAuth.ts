import { useEffect, useState } from "react"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export type MeResponse =
  | { authenticated: false }
  | {
      authenticated: true
      twitch_user_id: string
      login: string
      display_name: string
      profile_image_url: string | null
    }

export function useAuth() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: MeResponse) => setUser(data))
      .catch(() => setUser({ authenticated: false }))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}