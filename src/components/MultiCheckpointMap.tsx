"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons for different checkpoint states
const createCustomIcon = (isActive: boolean, isInRange?: boolean) => {
  const color = isActive ? (isInRange ? '#059669' : '#3b82f6') : '#6b7280'
  
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5C0 19.404 12.5 41 12.5 41S25 19.404 25 12.5C25 5.596 19.404 0 12.5 0Z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      <circle cx="12.5" cy="12.5" r="3" fill="${color}"/>
    </svg>
  `
  
  return L.divIcon({
    html: svgIcon,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41],
    className: 'custom-checkpoint-icon'
  })
}

interface Checkpoint {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
}

interface MultiCheckpointMapProps {
  checkpoints: Checkpoint[]
  userLocation?: { latitude: number; longitude: number } | null
  selectedCheckpointId?: string | null
  onCheckpointSelect?: (checkpoint: Checkpoint) => void
  height?: string
}

// Component to fit bounds to show all checkpoints
function FitBounds({ checkpoints, userLocation }: { checkpoints: Checkpoint[], userLocation?: { latitude: number; longitude: number } | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (checkpoints.length > 0) {
      const bounds = L.latLngBounds([])
      
      // Add checkpoint locations to bounds
      checkpoints.forEach(checkpoint => {
        bounds.extend([checkpoint.latitude, checkpoint.longitude])
        
        // Also extend bounds to include the radius
        const radiusInDegrees = checkpoint.radius / 111320
        bounds.extend([
          checkpoint.latitude + radiusInDegrees,
          checkpoint.longitude + radiusInDegrees / Math.cos(checkpoint.latitude * Math.PI / 180)
        ])
        bounds.extend([
          checkpoint.latitude - radiusInDegrees,
          checkpoint.longitude - radiusInDegrees / Math.cos(checkpoint.latitude * Math.PI / 180)
        ])
      })
      
      // Add user location if available
      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude])
      }
      
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, checkpoints, userLocation])
  
  return null
}

export default function MultiCheckpointMap({
  checkpoints,
  userLocation,
  selectedCheckpointId,
  onCheckpointSelect,
  height = "100vh"
}: MultiCheckpointMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const isWithinRadius = (checkpoint: Checkpoint): boolean => {
    if (!userLocation) return false
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      checkpoint.latitude,
      checkpoint.longitude
    )
    return distance <= checkpoint.radius
  }

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
    <div className="relative" style={{ height, width: '100%' }}>
      <MapContainer
        center={checkpoints.length > 0 ? [checkpoints[0].latitude, checkpoints[0].longitude] : [14.5995, 120.9842]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <>
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                html: `
                  <div style="
                    width: 12px; 
                    height: 12px; 
                    background: #ef4444; 
                    border: 2px solid white; 
                    border-radius: 50%; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                `,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                className: 'user-location-icon'
              })}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-red-600">Your Location</div>
                  <div className="text-xs text-gray-600 mt-1">
                    📍 {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {/* Checkpoint markers and circles */}
        {checkpoints.map((checkpoint) => {
          const inRange = isWithinRadius(checkpoint)
          const isSelected = selectedCheckpointId === checkpoint.id
          
          return (
            <div key={checkpoint.id}>
              {/* Radius circle */}
              <Circle
                center={[checkpoint.latitude, checkpoint.longitude]}
                radius={checkpoint.radius}
                pathOptions={{
                  color: isSelected ? '#f59e0b' : checkpoint.isActive ? (inRange ? '#059669' : '#3b82f6') : '#6b7280',
                  fillColor: isSelected ? '#f59e0b' : checkpoint.isActive ? (inRange ? '#059669' : '#3b82f6') : '#6b7280',
                  fillOpacity: isSelected ? 0.3 : 0.15,
                  weight: isSelected ? 3 : 2,
                  dashArray: checkpoint.isActive ? undefined : '5, 5'
                }}
              />
              
              {/* Checkpoint marker */}
              <Marker 
                position={[checkpoint.latitude, checkpoint.longitude]}
                icon={createCustomIcon(checkpoint.isActive, inRange)}
                eventHandlers={{
                  click: () => {
                    if (onCheckpointSelect) {
                      onCheckpointSelect(checkpoint)
                    }
                  }
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-slate-800">{checkpoint.name}</div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        checkpoint.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {checkpoint.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {checkpoint.description && (
                      <div className="text-xs text-gray-600 mb-2">{checkpoint.description}</div>
                    )}
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>📍 {checkpoint.latitude.toFixed(6)}, {checkpoint.longitude.toFixed(6)}</div>
                      <div>🎯 {checkpoint.radius}m radius</div>
                      {userLocation && (
                        <div className={`font-medium ${inRange ? 'text-green-600' : 'text-red-600'}`}>
                          {inRange ? '✅ You are within range' : '❌ You are outside range'}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          )
        })}
        
        {/* Auto-fit bounds */}
        <FitBounds checkpoints={checkpoints} userLocation={userLocation} />
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
        <div className="text-sm font-semibold text-slate-800 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 border border-white rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span>Active Checkpoint (In Range)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>Active Checkpoint (Out of Range)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Inactive Checkpoint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-500 rounded-full bg-amber-100"></div>
            <span>Selected Checkpoint</span>
          </div>
        </div>
      </div>
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-sm">
          <div className="font-semibold text-slate-800">Checkpoints Overview</div>
          <div className="text-xs text-slate-600 mt-1">
            📍 {checkpoints.length} total checkpoints
            • {checkpoints.filter(c => c.isActive).length} active
            • {checkpoints.filter(c => !c.isActive).length} inactive
          </div>
        </div>
      </div>
    </div>
  )
}