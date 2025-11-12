"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    activeRiders: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats")
        const data = await res.json()
        setStats(data)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch stats:", error)
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const chartData = [
    { name: "Mon", rides: 45, revenue: 2250 },
    { name: "Tue", rides: 52, revenue: 2600 },
    { name: "Wed", rides: 48, revenue: 2400 },
    { name: "Thu", rides: 61, revenue: 3050 },
    { name: "Fri", rides: 75, revenue: 3750 },
    { name: "Sat", rides: 89, revenue: 4450 },
    { name: "Sun", rides: 78, revenue: 3900 },
  ]

  const userDistribution = [
    { name: "Active Drivers", value: stats.activeDrivers, color: "#d4a97b" },
    { name: "Active Riders", value: stats.activeRiders, color: "#3d2f5f" },
    { name: "Inactive", value: 150, color: "#6b5b95" },
  ]

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-amber-100 mb-8">Admin Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard label="Total Rides" value={stats.totalRides} color="bg-blue-500" />
          <StatCard label="Revenue" value={`PKR ${stats.totalRevenue.toLocaleString()}`} color="bg-green-500" />
          <StatCard label="Active Drivers" value={stats.activeDrivers} color="bg-amber-500" />
          <StatCard label="Active Riders" value={stats.activeRiders} color="bg-purple-500" />
          <StatCard label="Avg Rating" value={stats.averageRating.toFixed(1)} color="bg-yellow-500" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-amber-100 mb-4">Weekly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis stroke="#8891a1" />
                <YAxis stroke="#8891a1" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#d4a97b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Distribution */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-amber-100 mb-4">User Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rides Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-amber-100 mb-4">Daily Rides</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis stroke="#8891a1" />
              <YAxis stroke="#8891a1" />
              <Tooltip />
              <Legend />
              <Bar dataKey="rides" fill="#d4a97b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`${color} rounded-lg p-6 text-white shadow-lg`}>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}
