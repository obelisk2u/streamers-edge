import * as React from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import {
  HouseIcon,
  FilmStripIcon,
  ChartLineUpIcon,
  FileTextIcon,
  SmileyWinkIcon,
} from "@phosphor-icons/react"

import { useAuth } from "@/hooks/useAuth"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-[56px] bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-zinc-500/10 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
    </div>
  )
}

type NavItem = {
  label: string
  to: string
  match?: "exact" | "prefix"
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", match: "exact", icon: <HouseIcon /> },
  { label: "Streams", to: "/dashboard/streams", match: "prefix", icon: <FilmStripIcon /> },
  { label: "Chat MVPs", to: "/dashboard/vibe-check", match: "prefix", icon: <SmileyWinkIcon /> },
  { label: "Reports", to: "/dashboard/reports", match: "prefix", icon: <FileTextIcon /> },
  { label: "Deep Insights", to: "/dashboard/insights", match: "prefix", icon: <ChartLineUpIcon /> },
]

function useIsActive(to: string, match: NavItem["match"] = "prefix") {
  const { pathname } = useLocation()
  if (match === "exact") return pathname === to
  return pathname === to || pathname.startsWith(to + "/")
}

type User =
  | null
  | { authenticated: false }
  | {
      authenticated: true
      twitch_user_id: string
      login: string
      display_name: string
      profile_image_url: string | null
    }

function UserBadge({ user, loading }: { user: User; loading: boolean }) {
  const isAuthed = !!user && user.authenticated

  const displayName = loading ? "Loading..." : isAuthed ? user.display_name : "Not signed in"
  const handle = loading ? "" : isAuthed ? `@${"supertf"}` : ""

  const avatarUrl = isAuthed ? user.profile_image_url : null
  const initial =
    isAuthed && user.display_name ? user.display_name.slice(0, 1).toUpperCase() : "?"

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="bg-muted size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium">
            {initial}
          </div>
        )}
      </div>

      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <div className="truncate text-sm font-medium">{displayName}</div>
        <div className="text-muted-foreground truncate text-xs">{handle}</div>
      </div>
    </div>
  )
}

function AppSidebar({
  user,
  loading,
}: {
  user: User
  loading: boolean
}) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-2 text-sm font-semibold tracking-tight">
          <span className="group-data-[collapsible=icon]:hidden">Streamers Edge</span>
          <span className="hidden group-data-[collapsible=icon]:inline">SE</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = useIsActive(item.to, item.match)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton isActive={isActive} render={<NavLink to={item.to} />}>
                      <span className="shrink-0 [&>svg]:size-4">{item.icon}</span>
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-2">
        <UserBadge user={user} loading={loading} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function ChatPanel({ channel }: { channel: string }) {
  const parent = window.location.hostname
  const src = `https://www.twitch.tv/embed/supertf/chat?parent=${parent}&darkpopout`

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-sm font-medium">Live chat</div>
        <div className="text-xs text-muted-foreground">@{channel}</div>
      </div>

      <iframe title="Twitch chat" src={src} className="h-full w-full" frameBorder={0} />
    </div>
  )
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // hooks must be above returns
  const [chatOpen, setChatOpen] = React.useState(true)

  React.useEffect(() => {
    if (!loading && (!user || user.authenticated === false)) {
      navigate("/", { replace: true })
    }
  }, [loading, user, navigate])

  const onSignOut = React.useCallback(async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" })
    navigate("/", { replace: true })
  }, [navigate])

  if (loading) return null
  if (!user || user.authenticated === false) return null

  const channel = user.login // or "supertf" for testing

  return (
    <SidebarProvider defaultOpen>
      <Background />
      <AppSidebar user={user} loading={loading} />

      <SidebarInset>
        <div className={["grid min-h-screen", chatOpen ? "lg:grid-cols-[1fr_420px]" : "lg:grid-cols-1"].join(" ")}>
          <div>
            <header className="flex items-center gap-2 px-10 py-6">
              <SidebarTrigger />
              <div className="flex-1" />

              <Button variant="outline" size="sm" onClick={() => setChatOpen((v) => !v)}>
                {chatOpen ? "Hide chat" : "Show chat"}
              </Button>

              <Button variant="ghost" onClick={onSignOut}>
                Sign out
              </Button>
            </header>

            <main className="px-10 pb-10">
              <Outlet />
            </main>
          </div>

          {chatOpen ? (
            <aside className="hidden lg:block border-l bg-background/40 p-4">
              <div className="h-[calc(100vh-32px)]">
                <ChatPanel channel={channel} />
              </div>
            </aside>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}