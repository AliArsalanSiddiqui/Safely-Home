"use client"

import { useEffect, useState } from "react"

interface Ride {
  _id: string
  riderId: string
  driverId: string
  pickupLocation: string
  dropoffLocation: string
  fare: number
  status: string
  createdAt: string
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await fetch("/api/admin/rides")
        const data = await res.json()
        setRides(data)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to fetch rides:", error)
        setLoading(false)
      }
    }

    fetchRides()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading rides...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-100 mb-6">Ride History</h1>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-6 py-3 text-left text-amber-100">From</th>
                <th className="px-6 py-3 text-left text-amber-100">To</th>
                <th className="px-6 py-3 text-left text-amber-100">Fare (PKR)</th>
                <th className="px-6 py-3 text-left text-amber-100">Status</th>
                <th className="px-6 py-3 text-left text-amber-100">Date</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((ride) => (
                <tr key={ride._id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-slate-200 truncate">{ride.pickupLocation}</td>
                  <td className="px-6 py-4 text-slate-200 truncate">{ride.dropoffLocation}</td>
                  <td className="px-6 py-4 text-amber-100">PKR {ride.fare}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        ride.status === "completed"
                          ? "bg-green-600"
                          : ride.status === "active"
                            ? "bg-blue-600"
                            : "bg-slate-600"
                      } text-white`}
                    >
                      {ride.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(ride.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
