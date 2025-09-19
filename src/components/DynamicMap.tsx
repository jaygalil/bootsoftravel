"use client"

import dynamic from 'next/dynamic'

// Dynamically import map components to prevent SSR
export const DynamicInteractiveMap = dynamic(
  () => import('./InteractiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-slate-100 rounded-lg flex items-center justify-center" style={{ height: "400px" }}>
        <div className="text-slate-600">Loading map...</div>
      </div>
    )
  }
)

export const DynamicMultiCheckpointMap = dynamic(
  () => import('./MultiCheckpointMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-slate-100 rounded-lg flex items-center justify-center" style={{ height: "100vh" }}>
        <div className="text-slate-600">Loading map...</div>
      </div>
    )
  }
)