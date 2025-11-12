"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/drivers", label: "Drivers" },
    { href: "/admin/rides", label: "Rides" },
    { href: "/admin/users", label: "Users" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-amber-100">Safely Home</h2>
          <p className="text-sm text-slate-400">Admin Panel</p>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-lg mb-2 transition-colors ${
                pathname === item.href
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
