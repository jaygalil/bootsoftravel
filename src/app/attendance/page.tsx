"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MapPin, ArrowLeft } from 'lucide-react'
import AttendanceTracker from '@/components/AttendanceTracker'

interface Checkpoint {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT'
}

export default function AttendancePage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCurrentUser()
    fetchCheckpoints()
    getUserLocation()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.log('Failed to fetch current user')
    }
  }

  const fetchCheckpoints = async () => {
    try {
      const response = await fetch('/api/checkpoints')
      if (response.ok) {
        const data = await response.json()
        setCheckpoints(data.checkpoints)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch checkpoints",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          toast({
            title: "Location Access",
            description: "Please enable location access for accurate attendance tracking",
            variant: "destructive",
          })
        }
      )
    }
  }

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

  const handleClockAction = async (action: 'clock-in' | 'clock-out', checkpointId: string) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location access to clock in/out",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          checkpointId,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        })
        
        // Show additional info about the action
        const actionType = action === 'clock-in' ? 'Clocked In' : 'Clocked Out'
        const checkpoint = checkpoints.find(cp => cp.id === checkpointId)
        
        toast({
          title: actionType,
          description: `${actionType} at ${checkpoint?.name} at ${new Date().toLocaleTimeString()}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action.replace('-', ' ')}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    }
  }

  // Convert checkpoints to the format expected by AttendanceTracker
  const availableCheckpoints = checkpoints.map(checkpoint => ({
    id: checkpoint.id,
    name: checkpoint.name,
    isActive: checkpoint.isActive,
    isInRange: isWithinRadius(checkpoint)
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Attendance Tracking</h1>
          <p className="text-slate-600 mb-8">You need to login to access attendance tracking</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Attendance Tracking</h1>
              <p className="text-slate-600 mt-1">
                Track your daily attendance with morning and afternoon sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-600">{currentUser.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/checkpoints'}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View All Checkpoints
            </Button>
          </div>
        </header>

        {/* Location Status */}
        {!userLocation && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <MapPin className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Location Access Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please enable location access to use attendance tracking features
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={getUserLocation}
                className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
              >
                Enable Location
              </Button>
            </div>
          </div>
        )}

        {/* Attendance Tracker Component */}
        <AttendanceTracker
          onClockAction={handleClockAction}
          availableCheckpoints={availableCheckpoints}
        />
      </div>
    </div>
  )
}