"use client"

import { useEffect, useState } from "react"

interface Driver {
  _id: string
  fullName: string
  email: string
  phoneNumber: string
  vehicleModel: string
  rating: number
  isVerified: boolean
  isOnline: boolean
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch("/api/admin/drivers")
        const data = await res.json()
        setDrivers(data)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch drivers:", error)
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [])

  const filteredDrivers = drivers.filter((driver) => {
    if (filter === "verified") return driver.isVerified
    if (filter === "online") return driver.isOnline
    return true
  })

  if (loading) {
    return <div className="p-8 text-center">Loading drivers...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-100 mb-6">Driver Management</h1>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {["all", "verified", "online"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === f ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-amber-100 hover:bg-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Drivers Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-6 py-3 text-left text-amber-100">Name</th>
                <th className="px-6 py-3 text-left text-amber-100">Email</th>
                <th className="px-6 py-3 text-left text-amber-100">Vehicle</th>
                <th className="px-6 py-3 text-left text-amber-100">Rating</th>
                <th className="px-6 py-3 text-left text-amber-100">Status</th>
                <th className="px-6 py-3 text-left text-amber-100">Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver._id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-slate-200">{driver.fullName}</td>
                  <td className="px-6 py-4 text-slate-200">{driver.email}</td>
                  <td className="px-6 py-4 text-slate-200">{driver.vehicleModel}</td>
                  <td className="px-6 py-4 text-amber-100">⭐ {driver.rating.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        driver.isOnline ? "bg-green-500 text-white" : "bg-slate-600 text-slate-200"
                      }`}
                    >
                      {driver.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        driver.isVerified ? "bg-emerald-600 text-white" : "bg-orange-600 text-white"
                      }`}
                    >
                      {driver.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <div className="text-center py-8 text-slate-400">No drivers found with the selected filter.</div>
        )}
      </div>
    </div>
  )
}
