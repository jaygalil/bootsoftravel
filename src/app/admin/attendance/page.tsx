"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  Calendar,
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Timer,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface TimeEntry {
  id: string
  employeeName: string
  employeeEmail: string
  clockIn: string
  clockOut?: string
  duration?: number
  status: 'active' | 'completed' | 'correction_requested'
  department: string
  date: string
}

export default function AttendanceTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Mock data for demonstration
    const mockEntries: TimeEntry[] = [
      {
        id: '1',
        employeeName: 'Admin User',
        employeeEmail: 'admin@example.com',
        clockIn: new Date(Date.now() - 3600000).toISOString(),
        clockOut: new Date().toISOString(),
        duration: 3600, // 1 hour in seconds
        status: 'completed',
        department: 'Administration',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: '2',
        employeeName: 'Agent User',
        employeeEmail: 'agent@example.com',
        clockIn: new Date(Date.now() - 7200000).toISOString(),
        status: 'active',
        department: 'Operations',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: '3',
        employeeName: 'Jaymar Recolizado',
        employeeEmail: 'jaymar.recolizado@dict.gov.ph',
        clockIn: new Date(Date.now() - 28800000).toISOString(),
        clockOut: new Date(Date.now() - 14400000).toISOString(),
        duration: 14400, // 4 hours
        status: 'correction_requested',
        department: 'IT Department',
        date: new Date().toISOString().split('T')[0]
      }
    ]
    setTimeEntries(mockEntries)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'correction_requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'correction_requested':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = 
      entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    const matchesDate = !dateFilter || entry.date === dateFilter
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const activeEmployees = timeEntries.filter(entry => entry.status === 'active').length
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600
  const correctionRequests = timeEntries.filter(entry => entry.status === 'correction_requested').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Time Tracking</h1>
          <p className="text-slate-600 mt-1">Monitor employee attendance and working hours</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadMockData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Currently Active</p>
                <p className="text-3xl font-bold text-green-600">{activeEmployees}</p>
                <p className="text-xs text-slate-500 mt-1">Employees online</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Hours Today</p>
                <p className="text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">Across all employees</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Correction Requests</p>
                <p className="text-3xl font-bold text-orange-600">{correctionRequests}</p>
                <p className="text-xs text-slate-500 mt-1">Pending review</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Hours/Day</p>
                <p className="text-3xl font-bold text-purple-600">7.8</p>
                <p className="text-xs text-slate-500 mt-1">This week</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-slate-600" />
                <span>Time Entries</span>
              </CardTitle>
              <CardDescription>
                View and manage employee time tracking records
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="correction_requested">Corrections</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {entry.employeeName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-800">{entry.employeeName}</h3>
                      <Badge className={`${getStatusColor(entry.status)} border`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(entry.status)}
                          <span className="capitalize">{entry.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm">{entry.employeeEmail}</p>
                    <p className="text-slate-500 text-xs">{entry.department}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-green-600">
                      <PlayCircle className="w-4 h-4" />
                      <span>In: {formatTime(entry.clockIn)}</span>
                    </div>
                    {entry.clockOut && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <StopCircle className="w-4 h-4" />
                        <span>Out: {formatTime(entry.clockOut)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">
                    Duration: {formatDuration(entry.duration)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No time entries found</h3>
                <p className="text-slate-500">
                  {searchTerm || dateFilter || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Time entries will appear here as employees clock in and out'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span>Quick Reports</span>
            </CardTitle>
            <CardDescription>
              Generate common attendance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Daily Attendance Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Weekly Hours Summary
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Pending Corrections
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Alerts & Issues</span>
            </CardTitle>
            <CardDescription>
              Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">1 correction request pending</p>
                    <p className="text-yellow-700">Jaymar Recolizado - Time adjustment</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">{activeEmployees} employees currently active</p>
                    <p className="text-blue-700">Monitor for extended work hours</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}