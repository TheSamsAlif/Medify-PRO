"use client"

import { useState } from "react"

export default function GlassTestPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Glassmorphism Test</h1>
          <p className="text-gray-300">
            This card should have a glass effect with blur and transparency.
            If you can see this clearly and it looks like glass, the CSS is working!
          </p>
        </div>
        
        <div className="mt-8 glass rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Another Glass Element</h2>
          <p className="text-gray-300">
            This should also have the glass effect. The background should show the mountain gradient.
          </p>
        </div>
      </div>
    </div>
  )
}