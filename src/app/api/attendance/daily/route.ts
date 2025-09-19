import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('user-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Get start and end of the specified day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get attendance logs for the specified day
    const dailyLogs = await db.attendanceLog.findMany({
      where: {
        userId: session.userId,
        timeIn: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        checkpoint: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        }
      },
      orderBy: {
        timeIn: 'asc'
      }
    })

    // Check for active session (clocked in but not clocked out)
    const activeSession = await db.attendanceLog.findFirst({
      where: {
        userId: session.userId,
        timeIn: { not: null },
        timeOut: null
      },
      include: {
        checkpoint: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Categorize logs into morning and afternoon
    const morningSessions = dailyLogs.filter(log => {
      const hour = new Date(log.timeIn!).getHours()
      return hour >= 6 && hour < 12
    })

    const afternoonSessions = dailyLogs.filter(log => {
      const hour = new Date(log.timeIn!).getHours()
      return hour >= 12 && hour < 18
    })

    const eveningSessions = dailyLogs.filter(log => {
      const hour = new Date(log.timeIn!).getHours()
      return hour >= 18 || hour < 6
    })

    // Calculate total hours for the day
    const totalMinutes = dailyLogs.reduce((total, log) => {
      if (log.timeIn && log.timeOut) {
        const timeIn = new Date(log.timeIn).getTime()
        const timeOut = new Date(log.timeOut).getTime()
        return total + (timeOut - timeIn) / (1000 * 60)
      }
      return total
    }, 0)

    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = Math.round(totalMinutes % 60)

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await db.attendanceLog.findMany({
      where: {
        userId: session.userId,
        timeIn: {
          gte: sevenDaysAgo
        }
      },
      include: {
        checkpoint: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        timeIn: 'desc'
      },
      take: 10
    })

    return NextResponse.json({
      date,
      activeSession,
      dailyLogs,
      morningSessions,
      afternoonSessions,
      eveningSessions,
      totalHours: `${totalHours}h ${remainingMinutes}m`,
      totalMinutes,
      recentActivity,
      summary: {
        totalSessions: dailyLogs.length,
        completedSessions: dailyLogs.filter(log => log.timeOut).length,
        activeSessions: dailyLogs.filter(log => !log.timeOut).length,
        morningClockIn: morningSessions.length > 0,
        afternoonClockIn: afternoonSessions.length > 0,
        isCurrentlyLoggedIn: !!activeSession
      }
    })

  } catch (error) {
    console.error('Daily attendance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}