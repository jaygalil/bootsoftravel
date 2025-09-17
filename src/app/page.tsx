"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Clock, FileText, Users, Settings, LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

  useEffect(() => {
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
      setTimeout(() => {
        window.location.href = '/auth'
      }, 1000)
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Attendance Monitoring System</h1>
          <p className="text-slate-600 mb-8">You need to login to access the dashboard</p>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login Page
            </button>
            <div className="text-sm text-slate-500 space-y-1">
              <p><strong>Demo Credentials:</strong></p>
              <p>Admin: admin@example.com / password123</p>
              <p>Agent: agent@example.com / password123</p>
            </div>
          </div>
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
            <p className="mt-2">
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
              onClick={() => window.location.href = '/checkpoints'}
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
                  <Button variant="outline" size="lg">
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
                    onClick={() => window.location.href = '/checkpoints'}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View All Checkpoints
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>
                  Download your CSC Form 48 reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Weekly Attendance Report - Jan 15, 2024', format: 'PDF', date: '2024-01-15' },
                    { title: 'Monthly Attendance Report - December 2023', format: 'EXCEL', date: '2024-01-01' },
                    { title: 'Weekly Attendance Report - Jan 8, 2024', format: 'PDF', date: '2024-01-08' },
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-muted-foreground">Generated on {report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{report.format}</Badge>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                          <Badge variant={checkpoint.status === 'Active' ? 'default' : 'secondary'}>
                            {checkpoint.status}
                          </Badge>
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
    </div>
  )
}