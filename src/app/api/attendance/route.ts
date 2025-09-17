import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttendanceStatus } from '@prisma/client'
import { isWithinCheckpointRadius } from '@/lib/geolocation'

export async function POST(request: NextRequest) {
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
    const { action, checkpointId, latitude, longitude } = await request.json()

    // Validate input
    if (!action || !checkpointId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Action, checkpointId, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    if (!['clock-in', 'clock-out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "clock-in" or "clock-out"' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get checkpoint
    const checkpoint = await db.checkpoint.findUnique({
      where: { id: checkpointId }
    })

    if (!checkpoint) {
      return NextResponse.json(
        { error: 'Checkpoint not found' },
        { status: 404 }
      )
    }

    // Check if user is within checkpoint radius
    const isWithinRadius = isWithinCheckpointRadius(
      { latitude, longitude },
      checkpoint
    )

    if (!isWithinRadius) {
      return NextResponse.json(
        { error: 'You are not within the checkpoint radius' },
        { status: 400 }
      )
    }

    if (action === 'clock-in') {
      // Check if user already has an active clock-in
      const activeAttendance = await db.attendanceLog.findFirst({
        where: {
          userId: user.id,
          timeIn: { not: null },
          timeOut: null
        }
      })

      if (activeAttendance) {
        return NextResponse.json(
          { error: 'You are already clocked in' },
          { status: 400 }
        )
      }

      // Create new attendance log
      const attendanceLog = await db.attendanceLog.create({
        data: {
          userId: user.id,
          checkpointId: checkpoint.id,
          timeIn: new Date(),
          status: AttendanceStatus.PRESENT
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          checkpoint: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Clocked in successfully',
        attendance: attendanceLog
      })

    } else if (action === 'clock-out') {
      // Find active attendance log
      const activeAttendance = await db.attendanceLog.findFirst({
        where: {
          userId: user.id,
          timeIn: { not: null },
          timeOut: null
        }
      })

      if (!activeAttendance) {
        return NextResponse.json(
          { error: 'No active clock-in found' },
          { status: 400 }
        )
      }

      // Update attendance log with clock-out time
      const updatedAttendance = await db.attendanceLog.update({
        where: { id: activeAttendance.id },
        data: {
          timeOut: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          checkpoint: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Clocked out successfully',
        attendance: updatedAttendance
      })
    }

  } catch (error) {
    console.error('Attendance action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const userId = searchParams.get('userId') || session.userId
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = { userId }
    
    if (startDate) {
      where.timeIn = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      where.timeIn = { 
        ...where.timeIn,
        lte: new Date(endDate) 
      }
    }

    // Get attendance logs
    const attendanceLogs = await db.attendanceLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        timeIn: 'desc'
      }
    })

    return NextResponse.json({
      attendanceLogs
    })

  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}