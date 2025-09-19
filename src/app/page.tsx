"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MapPin, Clock, FileText, Users, Settings, LogOut, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ReportGenerator } from '@/components/ReportGenerator'

// Client-only time component to avoid hydration issues
function ClientTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted || !currentTime) {
    return <span className="text-slate-600">Loading...</span>
  }

  return (
    <span className="text-slate-600">
      {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
    </span>
  )
}

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT'
}

export default function AttendanceDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkpointToDelete, setCheckpointToDelete] = useState<{id: string, name: string} | null>(null)
  const [deletingCheckpoint, setDeletingCheckpoint] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        // User not authenticated, will show login prompt
        console.log('User not authenticated')
      }
    } catch (error) {
      console.log('Failed to fetch current user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out",
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user state and redirect
      setCurrentUser(null)
      // Use a slight delay to allow toast to show
      if (mounted) {
        setTimeout(() => {
          window.location.href = '/auth'
        }, 1000)
      }
    }
  }

  const handleClockInOut = () => {
    const now = new Date()
    if (isClockedIn) {
      setIsClockedIn(false)
      setActiveCheckpoint(null)
      toast({
        title: "Clocked Out",
        description: "Successfully clocked out at " + now.toLocaleTimeString(),
      })
    } else {
      setIsClockedIn(true)
      setActiveCheckpoint("Main Office")
      toast({
        title: "Clocked In",
        description: "Successfully clocked in at " + now.toLocaleTimeString(),
      })
    }
  }

  const handleGenerateReport = (format: 'PDF' | 'EXCEL') => {
    toast({
      title: "Report Generated",
      description: `CSC Form 48 has been generated in ${format} format`,
    })
  }

  const deleteCheckpoint = async (checkpointId: string, name: string) => {
    setDeletingCheckpoint(true)
    
    try {
      const response = await fetch(`/api/checkpoints/${checkpointId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Checkpoint Deleted",
          description: `"${name}" has been permanently deleted`,
        })
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
      setDeletingCheckpoint(false)
      setCheckpointToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    // Redirect to auth page if not authenticated
    if (mounted) {
      window.location.href = '/auth'
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Attendance Monitoring System</h1>
            <p className="mt-2" suppressHydrationWarning>
              <ClientTime />
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-600">{currentUser.email}</p>
            </div>
            <Badge variant={currentUser.role === 'ADMIN' ? 'default' : 'secondary'}>
              {currentUser.role}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => mounted && (window.location.href = '/checkpoints')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Checkpoints
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            {currentUser.role === 'ADMIN' && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeCheckpoint ? `at ${activeCheckpoint}` : 'No active session'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5 days</div>
                  <p className="text-xs text-muted-foreground">Present</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Checkpoints</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Generated</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your attendance and generate reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleClockInOut}
                    className={isClockedIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    size="lg"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {isClockedIn ? 'Clock Out' : 'Clock In'}
                  </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/attendance'}
            >
              <Clock className="w-4 h-4 mr-2" />
              Attendance Tracking
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/checkpoints'}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View Checkpoints
            </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Generate CSC Form 48</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleGenerateReport('PDF')}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleGenerateReport('EXCEL')}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  View your attendance logs and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2024-01-15', timeIn: '08:00 AM', timeOut: '05:00 PM', checkpoint: 'Main Office', status: 'Present' },
                    { date: '2024-01-14', timeIn: '08:15 AM', timeOut: '05:30 PM', checkpoint: 'Main Office', status: 'Late' },
                    { date: '2024-01-13', timeIn: '08:00 AM', timeOut: '05:00 PM', checkpoint: 'Branch Office', status: 'Present' },
                  ].map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{record.date}</p>
                          <p className="text-sm text-muted-foreground">{record.checkpoint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{record.timeIn} - {record.timeOut}</p>
                        <Badge variant={record.status === 'Present' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Checkpoint Overview</CardTitle>
                <CardDescription>
                  View available checkpoints and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Main Office', status: 'Active', radius: '100m', distance: '0.5km' },
                    { name: 'Branch Office', status: 'Active', radius: '50m', distance: '2.1km' },
                    { name: 'Remote Site', status: 'Inactive', radius: '200m', distance: '5.3km' },
                  ].map((checkpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{checkpoint.name}</p>
                          <p className="text-sm text-muted-foreground">Radius: {checkpoint.radius} • Distance: {checkpoint.distance}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={checkpoint.status === 'Active' ? 'default' : 'secondary'}>
                          {checkpoint.status}
                        </Badge>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    className="w-full"
                    onClick={() => mounted && (window.location.href = '/checkpoints')}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View All Checkpoints
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator currentUser={currentUser} />
          </TabsContent>

          {currentUser.role === 'ADMIN' && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Checkpoint Management</CardTitle>
                    <CardDescription>
                      Manage attendance checkpoints and geofences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Add New Checkpoint
                    </Button>
                    <div className="space-y-2">
                      {[
                        { name: 'Main Office', status: 'Active', radius: '100m' },
                        { name: 'Branch Office', status: 'Active', radius: '50m' },
                        { name: 'Remote Site', status: 'Inactive', radius: '200m' },
                      ].map((checkpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{checkpoint.name}</p>
                            <p className="text-sm text-muted-foreground">Radius: {checkpoint.radius}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={checkpoint.status === 'Active' ? 'default' : 'secondary'}>
                              {checkpoint.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCheckpointToDelete({id: `checkpoint-${index}`, name: checkpoint.name})}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage agents and their permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Add New User
                    </Button>
                    <div className="space-y-2">
                      {[
                        { name: 'John Doe', email: 'john@example.com', role: 'Agent', status: 'Active' },
                        { name: 'Jane Smith', email: 'jane@example.com', role: 'Agent', status: 'Active' },
                        { name: 'Admin User', email: 'admin@example.com', role: 'Admin', status: 'Active' },
                      ].map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={checkpointToDelete !== null} onOpenChange={(open) => !open && setCheckpointToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checkpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{checkpointToDelete?.name}"? This action cannot be undone and will permanently remove the checkpoint and all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setCheckpointToDelete(null)}
              disabled={deletingCheckpoint}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => checkpointToDelete && deleteCheckpoint(checkpointToDelete.id, checkpointToDelete.name)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deletingCheckpoint}
            >
              {deletingCheckpoint ? (
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
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
