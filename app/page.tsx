"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-amber-500">🏠</div>
              <h1 className="text-xl font-bold text-white">Safely Home</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-amber-500 hover:bg-amber-600">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Safe Rides, Every Journey</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Experience secure and reliable transportation with Safely Home. Connect with trusted drivers or earn as a
            driver today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register?type=rider">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                Ride Now
              </Button>
            </Link>
            <Link href="/register?type=driver">
              <Button size="lg" variant="outline">
                Become a Driver
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Safety First</h3>
            <p className="text-slate-300">
              Real-time tracking and verified driver profiles ensure your peace of mind on every trip.
            </p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-white mb-2">Affordable Rates</h3>
            <p className="text-slate-300">Transparent pricing with no hidden fees. Pay exactly what you see upfront.</p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-white mb-2">Rated & Reviewed</h3>
            <p className="text-slate-300">Community-driven ratings help you choose the best drivers and routes.</p>
          </Card>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-to-r from-amber-900 to-amber-800 border-amber-700 p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to get started?</h3>
          <p className="text-amber-100 mb-8 text-lg">
            Join thousands of satisfied riders and drivers using Safely Home.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50">
              Sign Up Today
            </Button>
          </Link>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2025 Safely Home. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
