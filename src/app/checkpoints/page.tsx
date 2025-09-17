"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Users, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Checkpoint {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCheckpoints()
    getUserLocation()
  }, [])

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
          console.log('Location access denied or unavailable')
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

  const getDistanceFromUser = (checkpoint: Checkpoint): string => {
    if (!userLocation) return 'Unknown'
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      checkpoint.latitude,
      checkpoint.longitude
    )
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`
  }

  const openInMaps = (latitude: number, longitude: number, name: string) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}(${encodeURIComponent(name)})`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading checkpoints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Attendance Checkpoints</h1>
              <p className="text-slate-600 mt-2">
                View and manage attendance checkpoint locations
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              ← Back to Dashboard
            </Button>
          </div>
        </header>

        {/* User Location Status */}
        {userLocation && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Your Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Latitude: {userLocation.latitude.toFixed(6)}, Longitude: {userLocation.longitude.toFixed(6)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Checkpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checkpoints.map((checkpoint) => {
            const isInRange = isWithinRadius(checkpoint)
            const distance = getDistanceFromUser(checkpoint)
            
            return (
              <Card key={checkpoint.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-5 h-5 ${isInRange ? 'text-green-600' : 'text-slate-400'}`} />
                      <CardTitle className="text-lg">{checkpoint.name}</CardTitle>
                    </div>
                    <Badge variant={checkpoint.isActive ? 'default' : 'secondary'}>
                      {checkpoint.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {checkpoint.description && (
                    <CardDescription>{checkpoint.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Coordinates:</span>
                      <span className="text-slate-600">
                        {checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Radius:</span>
                      <span className="text-slate-600">{checkpoint.radius}m</span>
                    </div>
                    {userLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Distance:</span>
                        <span className={`font-medium ${isInRange ? 'text-green-600' : 'text-slate-600'}`}>
                          {distance}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {userLocation && (
                    <div className={`p-3 rounded-lg border ${
                      isInRange 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isInRange ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                        <span className="text-sm font-medium">
                          {isInRange ? 'You are within checkpoint radius' : 'You are outside checkpoint radius'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openInMaps(checkpoint.latitude, checkpoint.longitude, checkpoint.name)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Map
                    </Button>
                    {checkpoint.isActive && (
                      <Button 
                        size="sm" 
                        className={`flex-1 ${isInRange ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400'}`}
                        disabled={!isInRange}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Clock In
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {checkpoints.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Checkpoints Available</h3>
              <p className="text-slate-600">
                There are no active checkpoints configured. Please contact your administrator to set up attendance checkpoints.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Location Access Denied */}
        {!userLocation && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Location Access Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                To see your distance from checkpoints and check if you're within range, please enable location access.
              </p>
              <Button onClick={getUserLocation} variant="outline">
                Enable Location Access
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}