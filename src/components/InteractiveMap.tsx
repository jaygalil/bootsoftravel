"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface InteractiveMapProps {
  latitude?: number
  longitude?: number
  radius?: number
  onLocationSelect?: (lat: number, lng: number) => void
  onRadiusChange?: (radius: number) => void
  interactive?: boolean
  showControls?: boolean
  height?: string
  name?: string
}

// Component to handle map clicks
function LocationPicker({ onLocationSelect, interactive }: { onLocationSelect?: (lat: number, lng: number) => void, interactive?: boolean }) {
  useMapEvents({
    click: (e) => {
      if (interactive && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

// Component to fit bounds to show marker and circle
function FitBounds({ latitude, longitude, radius }: { latitude: number, longitude: number, radius: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (latitude && longitude && radius) {
      const bounds = L.latLngBounds([
        [latitude - radius/111320, longitude - radius/(111320 * Math.cos(latitude * Math.PI/180))],
        [latitude + radius/111320, longitude + radius/(111320 * Math.cos(latitude * Math.PI/180))]
      ])
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, latitude, longitude, radius])
  
  return null
}

export default function InteractiveMap({
  latitude = 14.5995, // Default to Manila
  longitude = 120.9842,
  radius = 100,
  onLocationSelect,
  onRadiusChange,
  interactive = false,
  showControls = false,
  height = "400px",
  name = "Location"
}: InteractiveMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className="bg-slate-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-slate-600">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Location Picker for interactive mode */}
          <LocationPicker onLocationSelect={onLocationSelect} interactive={interactive} />
          
          {/* Marker for the location */}
          <Marker position={[latitude, longitude]} />
          
          {/* Circle for the radius */}
          <Circle
            center={[latitude, longitude]}
            radius={radius}
            pathOptions={{
              color: interactive ? '#3b82f6' : '#059669',
              fillColor: interactive ? '#3b82f6' : '#059669',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
          
          {/* Auto-fit bounds */}
          <FitBounds latitude={latitude} longitude={longitude} radius={radius} />
        </MapContainer>
      </div>
      
      {/* Controls overlay */}
      {showControls && onRadiusChange && (
        <div className="absolute top-2 right-2 bg-white p-3 rounded-lg shadow-lg border">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Radius: {radius}m
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10m</span>
              <span>500m</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions for interactive mode */}
      {interactive && (
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-sm border">
          <p className="text-xs text-slate-600">
            📍 Click anywhere on the map to set location
          </p>
        </div>
      )}
      
      {/* Location info */}
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-sm border">
        <div className="text-xs text-slate-600">
          <div className="font-medium">{name}</div>
          <div>📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}</div>
          <div>🎯 {radius}m radius</div>
        </div>
      </div>
    </div>
  )
}