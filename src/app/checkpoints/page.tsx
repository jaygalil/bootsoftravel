"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MapPin, Navigation, Users, Clock, Plus, Map, ChevronLeft, ChevronRight, Grid, List, Search, Filter, Power, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'

// Dynamically import the map components to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-slate-600">Loading map...</div>
    </div>
  )
})

const MultiCheckpointMap = dynamic(() => import('@/components/MultiCheckpointMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-slate-600">Loading map...</div>
    </div>
  )
})

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

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT'
}

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  // itemsPerPage is now calculated dynamically in the pagination logic
  const [togglingCheckpoints, setTogglingCheckpoints] = useState<Set<string>>(new Set())
  const [deletingCheckpoints, setDeletingCheckpoints] = useState<Set<string>>(new Set())
  const [checkpointToDelete, setCheckpointToDelete] = useState<Checkpoint | null>(null)
  const [newCheckpoint, setNewCheckpoint] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: '100'
  })
  const [mapLocation, setMapLocation] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    radius: 100
  })
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

  const openMapModal = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
    setMapLocation({
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      radius: checkpoint.radius
    })
    setIsMapModalOpen(true)
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setMapLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    
    // Update the new checkpoint form if it's being used in add mode
    setNewCheckpoint(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
    
    toast({
      title: "Location Selected",
      description: `Set to ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    })
  }

  const handleMapRadiusChange = (radius: number) => {
    setMapLocation(prev => ({
      ...prev,
      radius
    }))
    
    // Update the new checkpoint form if it's being used in add mode
    setNewCheckpoint(prev => ({
      ...prev,
      radius: radius.toString()
    }))
  }

  const openMapForNewCheckpoint = () => {
    setSelectedCheckpoint(null)
    setMapLocation({
      latitude: userLocation?.latitude || parseFloat(newCheckpoint.latitude) || 14.5995,
      longitude: userLocation?.longitude || parseFloat(newCheckpoint.longitude) || 120.9842,
      radius: parseInt(newCheckpoint.radius) || 100
    })
    setIsMapModalOpen(true)
  }

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingCheckpoint(true)

    // Validate input
    if (!newCheckpoint.name || !newCheckpoint.latitude || !newCheckpoint.longitude || !newCheckpoint.radius) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsAddingCheckpoint(false)
      return
    }

    const lat = parseFloat(newCheckpoint.latitude)
    const lng = parseFloat(newCheckpoint.longitude)
    const radius = parseFloat(newCheckpoint.radius)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast({
        title: "Validation Error",
        description: "Please enter valid numbers for coordinates and radius",
        variant: "destructive",
      })
      setIsAddingCheckpoint(false)
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Validation Error",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        variant: "destructive",
      })
      setIsAddingCheckpoint(false)
      return
    }

    if (radius <= 0) {
      toast({
        title: "Validation Error",
        description: "Radius must be greater than 0",
        variant: "destructive",
      })
      setIsAddingCheckpoint(false)
      return
    }

    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCheckpoint.name,
          description: newCheckpoint.description || undefined,
          latitude: lat,
          longitude: lng,
          radius: radius
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Checkpoint created successfully",
        })
        // Reset form
        setNewCheckpoint({
          name: '',
          description: '',
          latitude: '',
          longitude: '',
          radius: '100'
        })
        setIsAddDialogOpen(false)
        // Refresh checkpoints
        fetchCheckpoints()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to create checkpoint",
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
      setIsAddingCheckpoint(false)
    }
  }

  const useCurrentLocation = () => {
    if (userLocation) {
      setNewCheckpoint(prev => ({
        ...prev,
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString()
      }))
      toast({
        title: "Location Set",
        description: "Current location has been set for the new checkpoint",
      })
    } else {
      toast({
        title: "Error",
        description: "Please enable location access first",
        variant: "destructive",
      })
    }
  }

  const toggleCheckpointStatus = async (checkpointId: string, currentStatus: boolean) => {
    // Add to toggling set to show loading state
    setTogglingCheckpoints(prev => new Set(prev).add(checkpointId))
    
    try {
      const response = await fetch(`/api/checkpoints/${checkpointId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })
      
      if (response.ok) {
        toast({
          title: "Checkpoint Updated",
          description: `Checkpoint ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        })
        // Refresh checkpoints to get updated data
        fetchCheckpoints()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update checkpoint status",
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
      // Remove from toggling set
      setTogglingCheckpoints(prev => {
        const newSet = new Set(prev)
        newSet.delete(checkpointId)
        return newSet
      })
    }
  }

  const deleteCheckpoint = async (checkpoint: Checkpoint) => {
    // Add to deleting set to show loading state
    setDeletingCheckpoints(prev => new Set(prev).add(checkpoint.id))
    
    try {
      const response = await fetch(`/api/checkpoints/${checkpoint.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Checkpoint Deleted",
          description: `"${checkpoint.name}" has been permanently deleted`,
        })
        // Clear selected checkpoint if it was deleted
        if (selectedCheckpoint?.id === checkpoint.id) {
          setSelectedCheckpoint(null)
        }
        // Refresh checkpoints to get updated data
        fetchCheckpoints()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete checkpoint",
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
      // Remove from deleting set
      setDeletingCheckpoints(prev => {
        const newSet = new Set(prev)
        newSet.delete(checkpoint.id)
        return newSet
      })
      // Clear the checkpoint to delete
      setCheckpointToDelete(null)
    }
  }

  // Filter and paginate checkpoints
  const filteredCheckpoints = checkpoints.filter(checkpoint => {
    const matchesSearch = checkpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (checkpoint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && checkpoint.isActive) ||
                         (statusFilter === 'inactive' && !checkpoint.isActive)
    return matchesSearch && matchesStatus
  })

  const currentItemsPerPage = viewMode === 'grid' ? 8 : 6
  const totalPages = Math.ceil(filteredCheckpoints.length / currentItemsPerPage)
  const paginatedCheckpoints = filteredCheckpoints.slice(
    (currentPage - 1) * currentItemsPerPage,
    currentPage * currentItemsPerPage
  )


  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading checkpoints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-96'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-slate-800">Checkpoints</h1>
                <p className="text-sm text-slate-600">
                  {filteredCheckpoints.length} of {checkpoints.length} checkpoints
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="mt-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search checkpoints..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                
                <div className="flex border border-slate-200 rounded-md">
                  <button
                    onClick={() => {
                      setViewMode('list')
                      setCurrentPage(1)
                    }}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}
                    title="List view - detailed information"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('grid')
                      setCurrentPage(1)
                    }}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}
                    title="Grid view - compact cards"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Add Checkpoint Button - Now just triggers the dialog */}
              {currentUser?.role === 'ADMIN' && (
                <Button 
                  className="w-full"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Checkpoint
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {!sidebarCollapsed ? (
            <div className="h-full flex flex-col">
              {/* User Location Status */}
              {userLocation && (
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-medium text-slate-800">Your Location</span>
                      <div className="text-xs text-slate-600">
                        📍 {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Checkpoints List */}
              <div className="flex-1 overflow-y-auto p-4">
                {paginatedCheckpoints.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No checkpoints found</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'No checkpoints available'}
                    </p>
                  </div>
                ) : (
                  <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
                    {paginatedCheckpoints.map((checkpoint) => {
                      const isInRange = isWithinRadius(checkpoint)
                      const distance = getDistanceFromUser(checkpoint)
                      const isSelected = selectedCheckpoint?.id === checkpoint.id
                      
                      if (viewMode === 'list') {
                        // List View (existing detailed view)
                        return (
                          <div
                            key={checkpoint.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                              isSelected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedCheckpoint(checkpoint)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  checkpoint.isActive 
                                    ? (isInRange ? 'bg-green-500' : 'bg-blue-500')
                                    : 'bg-gray-400'
                                }`} />
                                <h3 className="font-medium text-slate-800 text-sm">{checkpoint.name}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                {currentUser?.role === 'ADMIN' && (
                                  <div className="flex items-center gap-1">
                                    <Switch
                                      checked={checkpoint.isActive}
                                      onCheckedChange={() => toggleCheckpointStatus(checkpoint.id, checkpoint.isActive)}
                                      className="scale-75"
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={togglingCheckpoints.has(checkpoint.id)}
                                    />
                                    {togglingCheckpoints.has(checkpoint.id) && (
                                      <div className="w-3 h-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                    )}
                                  </div>
                                )}
                                <Badge variant={checkpoint.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {checkpoint.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            
                            {checkpoint.description && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{checkpoint.description}</p>
                            )}
                            
                            <div className="space-y-1 text-xs text-slate-500">
                              <div>📍 {checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}</div>
                              <div className="flex items-center justify-between">
                                <span>🎯 {checkpoint.radius}m radius</span>
                                {userLocation && (
                                  <span className={`font-medium ${
                                    isInRange ? 'text-green-600' : 'text-slate-500'
                                  }`}>
                                    📏 {distance}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {userLocation && (
                              <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                                isInRange 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isInRange ? '✅ In range' : '❌ Out of range'}
                              </div>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openMapModal(checkpoint)
                                }}
                              >
                                <Map className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              {checkpoint.isActive ? (
                                <Button
                                  size="sm"
                                  className={`flex-1 text-xs ${
                                    isInRange ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400'
                                  }`}
                                  disabled={!isInRange}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Clock In
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  disabled
                                >
                                  <Power className="w-3 h-3 mr-1" />
                                  Inactive
                                </Button>
                              )}
                              {currentUser?.role === 'ADMIN' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCheckpointToDelete(checkpoint)
                                  }}
                                  disabled={deletingCheckpoints.has(checkpoint.id)}
                                >
                                  {deletingCheckpoints.has(checkpoint.id) ? (
                                    <div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      } else {
                        // Grid View (compact card view)
                        return (
                          <div
                            key={checkpoint.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm relative ${
                              isSelected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedCheckpoint(checkpoint)}
                          >
                            {/* Admin toggle in top right */}
                            {currentUser?.role === 'ADMIN' && (
                              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                  checked={checkpoint.isActive}
                                  onCheckedChange={() => toggleCheckpointStatus(checkpoint.id, checkpoint.isActive)}
                                  className="scale-75"
                                  disabled={togglingCheckpoints.has(checkpoint.id)}
                                />
                              </div>
                            )}
                            
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${
                                  checkpoint.isActive 
                                    ? (isInRange ? 'bg-green-500' : 'bg-blue-500')
                                    : 'bg-gray-400'
                                }`} />
                                <h3 className="font-medium text-slate-800 text-sm truncate pr-8">{checkpoint.name}</h3>
                              </div>
                              <Badge variant={checkpoint.isActive ? 'default' : 'secondary'} className="text-xs">
                                {checkpoint.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            
                            {checkpoint.description && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-1">{checkpoint.description}</p>
                            )}
                            
                            <div className="space-y-1 text-xs text-slate-500 mb-2">
                              <div className="truncate">📍 {checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}</div>
                              <div>🎯 {checkpoint.radius}m</div>
                              {userLocation && (
                                <div className={`font-medium ${
                                  isInRange ? 'text-green-600' : 'text-slate-500'
                                }`}>
                                  📏 {distance}
                                </div>
                              )}
                            </div>
                            
                            {userLocation && (
                              <div className={`mb-2 px-2 py-1 rounded text-xs font-medium text-center ${
                                isInRange 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isInRange ? '✅ In range' : '❌ Out of range'}
                              </div>
                            )}
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openMapModal(checkpoint)
                                }}
                              >
                                <Map className="w-3 h-3" />
                              </Button>
                              {checkpoint.isActive ? (
                                <Button
                                  size="sm"
                                  className={`flex-1 text-xs px-2 ${
                                    isInRange ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400'
                                  }`}
                                  disabled={!isInRange}
                                >
                                  <Clock className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs px-2"
                                  disabled
                                >
                                  <Power className="w-3 h-3" />
                                </Button>
                              )}
                              {currentUser?.role === 'ADMIN' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCheckpointToDelete(checkpoint)
                                  }}
                                  disabled={deletingCheckpoints.has(checkpoint.id)}
                                >
                                  {deletingCheckpoints.has(checkpoint.id) ? (
                                    <div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            
                            {/* Loading overlay for toggle operation */}
                            {togglingCheckpoints.has(checkpoint.id) && (
                              <div className="absolute top-2 right-8">
                                <div className="w-3 h-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        )
                      }
                    })}
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 text-center mt-2">
                    Showing {((currentPage - 1) * currentItemsPerPage) + 1} - {Math.min(currentPage * currentItemsPerPage, filteredCheckpoints.length)} of {filteredCheckpoints.length} checkpoints
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Collapsed sidebar content
            <div className="p-2 space-y-2">
              {paginatedCheckpoints.slice(0, 8).map((checkpoint) => {
                const isInRange = isWithinRadius(checkpoint)
                const isSelected = selectedCheckpoint?.id === checkpoint.id
                
                return (
                  <div key={checkpoint.id} className="relative group">
                    <div
                      className={`w-12 h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedCheckpoint(checkpoint)}
                      title={`${checkpoint.name} - ${checkpoint.isActive ? 'Active' : 'Inactive'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        checkpoint.isActive 
                          ? (isInRange ? 'bg-green-500' : 'bg-blue-500')
                          : 'bg-gray-400'
                      }`} />
                    </div>
                    {/* Admin toggle for collapsed view */}
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center ${
                          checkpoint.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCheckpointStatus(checkpoint.id, checkpoint.isActive)
                        }}
                        title={`Click to ${checkpoint.isActive ? 'deactivate' : 'activate'} checkpoint`}
                        disabled={togglingCheckpoints.has(checkpoint.id)}
                      >
                        {togglingCheckpoints.has(checkpoint.id) ? (
                          <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Power className="w-3 h-3 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
      
      {/* Main Map Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <MultiCheckpointMap
            checkpoints={checkpoints}
            userLocation={userLocation}
            selectedCheckpointId={selectedCheckpoint?.id || null}
            onCheckpointSelect={(checkpoint) => {
              // Find the full checkpoint with createdAt and updatedAt
              const fullCheckpoint = checkpoints.find(c => c.id === checkpoint.id)
              if (fullCheckpoint) {
                setSelectedCheckpoint(fullCheckpoint)
              }
            }}
            height="100%"
          />
        </div>
        
        {/* Top right controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="bg-white shadow-lg"
            onClick={() => window.location.href = '/'}
          >
            ← Back to Dashboard
          </Button>
          {!userLocation && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-lg"
              onClick={getUserLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          )}
        </div>


        {/* Map Modal */}
        <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedCheckpoint ? `${selectedCheckpoint.name} - Location & Radius` : 'Select Location & Radius'}
              </DialogTitle>
              <DialogDescription>
                {selectedCheckpoint 
                  ? `View and ${currentUser?.role === 'ADMIN' ? 'modify' : 'explore'} checkpoint location and coverage area`
                  : 'Click on the map to select a location and adjust the radius using the slider'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <InteractiveMap
                latitude={mapLocation.latitude}
                longitude={mapLocation.longitude}
                radius={mapLocation.radius}
                onLocationSelect={!selectedCheckpoint || currentUser?.role === 'ADMIN' ? handleMapLocationSelect : undefined}
                onRadiusChange={!selectedCheckpoint || currentUser?.role === 'ADMIN' ? handleMapRadiusChange : undefined}
                interactive={!selectedCheckpoint || currentUser?.role === 'ADMIN'}
                showControls={!selectedCheckpoint || currentUser?.role === 'ADMIN'}
                height="500px"
                name={selectedCheckpoint?.name || 'New Checkpoint'}
              />
              
              {(!selectedCheckpoint || currentUser?.role === 'ADMIN') && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Latitude</label>
                    <div className="text-sm text-slate-900 font-mono">{mapLocation.latitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Longitude</label>
                    <div className="text-sm text-slate-900 font-mono">{mapLocation.longitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Radius</label>
                    <div className="text-sm text-slate-900 font-mono">{mapLocation.radius}m</div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {!selectedCheckpoint ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsMapModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setNewCheckpoint(prev => ({
                        ...prev,
                        latitude: mapLocation.latitude.toString(),
                        longitude: mapLocation.longitude.toString(),
                        radius: mapLocation.radius.toString()
                      }))
                      setIsMapModalOpen(false)
                      toast({
                        title: "Location Set",
                        description: "Location and radius have been set for the new checkpoint",
                      })
                    }}
                  >
                    Use This Location
                  </Button>
                </>
              ) : (
                <>
                  {currentUser?.role === 'ADMIN' && (
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/checkpoints/${selectedCheckpoint.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              latitude: mapLocation.latitude,
                              longitude: mapLocation.longitude,
                              radius: mapLocation.radius
                            })
                          })
                          
                          if (response.ok) {
                            toast({
                              title: "Checkpoint Updated",
                              description: "Location and radius have been updated successfully",
                            })
                            fetchCheckpoints()
                            setIsMapModalOpen(false)
                          } else {
                            toast({
                              title: "Error",
                              description: "Failed to update checkpoint",
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
                      }}
                      className="mr-2"
                    >
                      Update Checkpoint
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsMapModalOpen(false)}>
                    Close
                  </Button>
                </>
              )}
            </DialogFooter>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
      
      {/* Add Checkpoint Dialog - Moved outside the main layout to fix z-index issues */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Checkpoint</DialogTitle>
            <DialogDescription>
              Create a new attendance checkpoint with location and radius.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCheckpoint}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newCheckpoint.name}
                  onChange={(e) => setNewCheckpoint(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Office"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  value={newCheckpoint.description}
                  onChange={(e) => setNewCheckpoint(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="latitude" className="text-right">
                  Latitude *
                </Label>
                <Input
                  id="latitude"
                  className="col-span-3"
                  type="number"
                  step="any"
                  value={newCheckpoint.latitude}
                  onChange={(e) => setNewCheckpoint(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="e.g., 14.5995"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="longitude" className="text-right">
                  Longitude *
                </Label>
                <Input
                  id="longitude"
                  className="col-span-3"
                  type="number"
                  step="any"
                  value={newCheckpoint.longitude}
                  onChange={(e) => setNewCheckpoint(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="e.g., 120.9842"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="radius" className="text-right">
                  Radius (m) *
                </Label>
                <Input
                  id="radius"
                  className="col-span-3"
                  type="number"
                  min="1"
                  value={newCheckpoint.radius}
                  onChange={(e) => setNewCheckpoint(prev => ({ ...prev, radius: e.target.value }))}
                  placeholder="e.g., 100"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1"></div>
                <div className="col-span-3 space-y-2">
                  {userLocation && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={useCurrentLocation}
                      className="w-full"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Use Current Location
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={openMapForNewCheckpoint}
                    className="w-full"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Pick from Map
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingCheckpoint}>
                {isAddingCheckpoint ? 'Creating...' : 'Create Checkpoint'}
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </DialogPortal>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={checkpointToDelete !== null} onOpenChange={(open) => !open && setCheckpointToDelete(null)}>
        <AlertDialogPortal>
          <AlertDialogOverlay className="z-[10001]" style={{zIndex: 10001}} />
          <div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[10002] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 sm:max-w-lg" style={{zIndex: 10002}} data-state="open">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checkpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{checkpointToDelete?.name}"? This action cannot be undone and will permanently remove the checkpoint and all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setCheckpointToDelete(null)}
              disabled={checkpointToDelete ? deletingCheckpoints.has(checkpointToDelete.id) : false}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => checkpointToDelete && deleteCheckpoint(checkpointToDelete)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={checkpointToDelete ? deletingCheckpoints.has(checkpointToDelete.id) : false}
            >
              {checkpointToDelete && deletingCheckpoints.has(checkpointToDelete.id) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Checkpoint
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
          </div>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  )
}
