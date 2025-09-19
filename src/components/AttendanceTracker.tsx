"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Calendar, Activity, Timer, User, CheckCircle, XCircle, Pause } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AttendanceLog {
  id: string
  timeIn: string | null
  timeOut: string | null
  checkpoint: {
    id: string
    name: string
  }
  status: string
}

interface DailyAttendanceData {
  date: string
  activeSession: AttendanceLog | null
  dailyLogs: AttendanceLog[]
  morningSessions: AttendanceLog[]
  afternoonSessions: AttendanceLog[]
  eveningSessions: AttendanceLog[]
  totalHours: string
  totalMinutes: number
  recentActivity: AttendanceLog[]
  summary: {
    totalSessions: number
    completedSessions: number
    activeSessions: number
    morningClockIn: boolean
    afternoonClockIn: boolean
    isCurrentlyLoggedIn: boolean
  }
}

interface AttendanceTrackerProps {
  selectedDate?: string
  onClockAction?: (action: 'clock-in' | 'clock-out', checkpointId: string) => void
  availableCheckpoints?: Array<{
    id: string
    name: string
    isActive: boolean
    isInRange: boolean
  }>
}

export default function AttendanceTracker({ 
  selectedDate,
  onClockAction,
  availableCheckpoints = []
}: AttendanceTrackerProps) {
  const [attendanceData, setAttendanceData] = useState<DailyAttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDailyAttendance()
  }, [selectedDate])

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true)
      const date = selectedDate || new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/attendance/daily?date=${date}`)
      
      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch attendance data",
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

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (timeIn: string, timeOut: string | null) => {
    const start = new Date(timeIn).getTime()
    const end = timeOut ? new Date(timeOut).getTime() : Date.now()
    const duration = Math.floor((end - start) / 60000) // minutes
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}h ${minutes}m`
  }

  const getSessionStatus = (session: AttendanceLog) => {
    if (session.timeOut) {
      return { status: 'completed', color: 'bg-green-500', icon: CheckCircle }
    } else {
      return { status: 'active', color: 'bg-blue-500', icon: Timer }
    }
  }

  const handleClockAction = async (action: 'clock-in' | 'clock-out', checkpointId: string) => {
    if (onClockAction) {
      await onClockAction(action, checkpointId)
      // Refresh data after action
      setTimeout(() => fetchDailyAttendance(), 500)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!attendanceData) return null

  const { activeSession, morningSessions, afternoonSessions, eveningSessions, summary, totalHours } = attendanceData

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Current Status</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                })}
              </div>
              <div className="text-sm text-blue-500">Live Time</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activeSession ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-700">Currently Logged In</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <MapPin className="w-3 h-3 mr-1" />
                    {activeSession.checkpoint.name}
                  </Badge>
                  <Badge variant="outline">
                    <Timer className="w-3 h-3 mr-1" />
                    {formatDuration(activeSession.timeIn!, null)}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-medium text-gray-600">Currently Logged Out</span>
                  </div>
                  <Badge variant="secondary">
                    <Pause className="w-3 h-3 mr-1" />
                    Not Active
                  </Badge>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Today</div>
              <div className="font-bold text-lg">{totalHours}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Sessions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Morning Session */}
        <Card className={morningSessions.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-sm font-bold">🌅</span>
              </div>
              Morning (6AM - 12PM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {morningSessions.length > 0 ? (
              <div className="space-y-2">
                {morningSessions.map((session, index) => {
                  const { status, color, icon: Icon } = getSessionStatus(session)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                        <div className="text-sm">
                          <div className="font-medium">{session.checkpoint.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(session.timeIn)} - {formatTime(session.timeOut)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {session.timeOut ? formatDuration(session.timeIn!, session.timeOut) : formatDuration(session.timeIn!, null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No morning session</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Afternoon Session */}
        <Card className={afternoonSessions.length > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">☀️</span>
              </div>
              Afternoon (12PM - 6PM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {afternoonSessions.length > 0 ? (
              <div className="space-y-2">
                {afternoonSessions.map((session, index) => {
                  const { status, color, icon: Icon } = getSessionStatus(session)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                        <div className="text-sm">
                          <div className="font-medium">{session.checkpoint.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(session.timeIn)} - {formatTime(session.timeOut)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {session.timeOut ? formatDuration(session.timeIn!, session.timeOut) : formatDuration(session.timeIn!, null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No afternoon session</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evening Session */}
        <Card className={eveningSessions.length > 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">🌙</span>
              </div>
              Evening (6PM - 6AM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eveningSessions.length > 0 ? (
              <div className="space-y-2">
                {eveningSessions.map((session, index) => {
                  const { status, color, icon: Icon } = getSessionStatus(session)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                        <div className="text-sm">
                          <div className="font-medium">{session.checkpoint.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(session.timeIn)} - {formatTime(session.timeOut)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {session.timeOut ? formatDuration(session.timeIn!, session.timeOut) : formatDuration(session.timeIn!, null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No evening session</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {availableCheckpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Clock in or out from available checkpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableCheckpoints
                .filter(cp => cp.isActive)
                .map((checkpoint) => (
                <div key={checkpoint.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        checkpoint.isInRange ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-sm">{checkpoint.name}</span>
                    </div>
                    <Badge variant={checkpoint.isInRange ? 'default' : 'secondary'} className="text-xs">
                      {checkpoint.isInRange ? 'In Range' : 'Out of Range'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleClockAction('clock-in', checkpoint.id)}
                      disabled={!checkpoint.isInRange || !!activeSession}
                      className="flex-1 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Clock In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClockAction('clock-out', checkpoint.id)}
                      disabled={!checkpoint.isInRange || !activeSession}
                      className="flex-1 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Clock Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalSessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completedSessions}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.activeSessions}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalHours}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}