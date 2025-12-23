import { Routes, Route } from "react-router-dom"

import LoginPage from "@/pages/LoginPage"
import DashboardLayout from "@/layout/DashboardLayout"
import DashboardHome from "@/pages/DashboardHome"
import StreamsPage from "@/pages/StreamsPage"
import InsightsPage from "@/pages/InsightsPage"
import ReportsPage from "@/pages/ReportsPage"
import VibeCheckPage from "@/pages/VibeCheckPage"

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="vibe-check" element={<VibeCheckPage />} />
      </Route>
    </Routes>
  )
}
