import { Routes, Route } from "react-router-dom"

// Public pages
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"

// App layout + pages
import DashboardLayout from "@/layout/DashboardLayout"
import DashboardHome from "@/pages/DashboardHome"
import StreamsPage from "@/pages/StreamsPage"
import InsightsPage from "@/pages/InsightsPage"
import ReportsPage from "@/pages/ReportsPage"
import LiveChatPage from "@/pages/LiveChatPage"

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated app */}
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="livechat" element={<LiveChatPage />} />
      </Route>

      {/* Optional: hard redirect for legacy URLs */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}