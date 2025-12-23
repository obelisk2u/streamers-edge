import { NavLink, Outlet, useLocation } from "react-router-dom"

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
  {
    label: "Streams",
    to: "/dashboard/streams",
    match: "prefix",
    icon: <FilmStripIcon />,
  },
  {
    label: "Chat MVPs",
    to: "/dashboard/vibe-check",
    match: "prefix",
    icon: <SmileyWinkIcon />,
  },
  {
    label: "Reports",
    to: "/dashboard/reports",
    match: "prefix",
    icon: <FileTextIcon />,
  },
  {
    label: "Deep Insights",
    to: "/dashboard/insights",
    match: "prefix",
    icon: <ChartLineUpIcon />,
  },
]

function useIsActive(to: string, match: NavItem["match"] = "prefix") {
  const { pathname } = useLocation()
  if (match === "exact") return pathname === to
  return pathname === to || pathname.startsWith(to + "/")
}

function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-2 text-sm font-semibold tracking-tight">
          <span className="group-data-[collapsible=icon]:hidden">
            Streamers Edge
          </span>
          <span className="hidden group-data-[collapsible=icon]:inline">
            SE
          </span>
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
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<NavLink to={item.to} />}
                    >
                      <span className="shrink-0 [&>svg]:size-4">
                        {item.icon}
                      </span>
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="ghost" className="justify-start">
          Sign out
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen>
      <Background />

      <AppSidebar />

      <SidebarInset>
        <header className="flex items-center gap-2 px-10 py-6">
          <SidebarTrigger />
          <div className="flex-1" />
          <Button variant="ghost">Sign out</Button>
        </header>

        <main className="px-10 pb-10">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
