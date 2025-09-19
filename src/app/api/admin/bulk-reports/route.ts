import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ReportFormat, UserRole } from '@prisma/client'
import { 
  generateCSCForm48PDF, 
  generateCSCForm48Excel, 
  calculateTotalHours,
  formatDate,
  formatTime
} from '@/lib/report-generator'

interface BulkReportRequest {
  userIds?: string[]  // Specific user IDs, if empty = all users
  startDate: string
  endDate: string
  format: ReportFormat
  reportType: 'individual' | 'consolidated'  // Individual files or one consolidated report
}

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
    
    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userIds, startDate, endDate, format, reportType = 'individual' }: BulkReportRequest = await request.json()

    // Validate input
    if (!startDate || !endDate || !format) {
      return NextResponse.json(
        { error: 'startDate, endDate, and format are required' },
        { status: 400 }
      )
    }

    if (!Object.values(ReportFormat).includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be PDF or EXCEL' },
        { status: 400 }
      )
    }

    // Get users based on selection
    const whereClause = userIds && userIds.length > 0 
      ? { id: { in: userIds } }
      : { role: { in: [UserRole.ADMIN, UserRole.AGENT] } }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

    // Get attendance data for all selected users
    const userAttendanceData = await Promise.all(
      users.map(async (user) => {
        const attendanceLogs = await db.attendanceLog.findMany({
          where: {
            userId: user.id,
            timeIn: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          include: {
            checkpoint: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            timeIn: 'asc'
          }
        })

        const attendanceData = attendanceLogs.map(log => ({
          id: log.id,
          date: formatDate(log.timeIn!),
          timeIn: formatTime(log.timeIn!),
          timeOut: log.timeOut ? formatTime(log.timeOut) : '',
          checkpoint: log.checkpoint.name,
          status: log.status,
          totalHours: log.timeOut ? calculateTotalHours(log.timeIn!, log.timeOut) : ''
        }))

        return {
          employeeName: user.name || 'Unknown',
          employeeId: user.id,
          employeeEmail: user.email,
          department: 'General', // You can add department field to User model if needed
          period: `${formatDate(new Date(startDate))} - ${formatDate(new Date(endDate))}`,
          attendanceData
        }
      })
    )

    let fileBuffer: Uint8Array
    let contentType: string
    let fileName: string

    if (reportType === 'consolidated') {
      // Generate one consolidated report with all users
      if (format === ReportFormat.PDF) {
        // TODO: Implement bulk PDF generation
        throw new Error('Bulk PDF generation temporarily disabled')
        // fileBuffer = generateBulkCSCForm48PDF(userAttendanceData)
        // contentType = 'application/pdf'
        // fileName = `CSC_Form_48_Consolidated_${formatDate(new Date(startDate))}_to_${formatDate(new Date(endDate))}.pdf`
      } else {
        // TODO: Implement bulk Excel generation
        throw new Error('Bulk Excel generation temporarily disabled')
        // fileBuffer = generateBulkCSCForm48Excel(userAttendanceData)
        // contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        // fileName = `CSC_Form_48_Consolidated_${formatDate(new Date(startDate))}_to_${formatDate(new Date(endDate))}.xlsx`
      }
    } else {
      // Generate individual reports and package as ZIP
      throw new Error('Individual ZIP generation temporarily disabled')
      // fileBuffer = await generateBulkCSCForm48ZIP(userAttendanceData, format)
      contentType = 'application/zip'
      fileName = `CSC_Form_48_Bulk_${formatDate(new Date(startDate))}_to_${formatDate(new Date(endDate))}.zip`
    }

    // Save bulk report record to database
    await db.report.create({
      data: {
        userId: session.userId,
        title: `Bulk CSC Form 48 - ${userAttendanceData.length} users - ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`,
        format,
        generatedAt: new Date()
      }
    })

    // Return error since bulk reports are temporarily disabled
    return NextResponse.json(
      { error: 'Bulk reports are temporarily disabled' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Generate bulk report error:', error)
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
    
    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all users for selection dropdown
    const users = await db.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.AGENT] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      users
    })

  } catch (error) {
    console.error('Get users for bulk report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}