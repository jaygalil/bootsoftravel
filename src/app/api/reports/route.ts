import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ReportFormat } from '@prisma/client'
import { 
  generateCSCForm48PDF, 
  generateDualCSCForm48PDF,
  generateCSCForm48Excel, 
  calculateTotalHours,
  formatDate,
  formatTime
} from '@/lib/report-generator'

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
    const { format, startDate, endDate, userId } = await request.json()

    // Validate input
    if (!format || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Format, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    if (!['PDF', 'DUAL_PDF', 'EXCEL'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be PDF, DUAL_PDF, or EXCEL' },
        { status: 400 }
      )
    }

    // Use provided userId or current user's ID
    const targetUserId = userId || session.userId

    // Get user info
    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get attendance data for the specified period
    const attendanceLogs = await db.attendanceLog.findMany({
      where: {
        userId: targetUserId,
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

    // Prepare data for report generation
    const attendanceData = attendanceLogs.map(log => ({
      id: log.id,
      date: formatDate(log.timeIn!),
      timeIn: formatTime(log.timeIn!),
      timeOut: log.timeOut ? formatTime(log.timeOut) : '',
      checkpoint: log.checkpoint.name,
      status: log.status,
      totalHours: log.timeOut ? calculateTotalHours(log.timeIn!, log.timeOut) : ''
    }))

    // Generate report data
    const reportData = {
      employeeName: user.name || 'Unknown',
      employeeId: user.id,
      department: 'General', // You can add department field to User model if needed
      period: `${formatDate(new Date(startDate))} - ${formatDate(new Date(endDate))}`,
      attendanceData
    }

    let fileBuffer: Uint8Array
    let contentType: string
    let fileName: string

    if (format === 'PDF') {
      fileBuffer = generateCSCForm48PDF(reportData)
      contentType = 'application/pdf'
      fileName = `CSC_Form_48_${user.name}_${startDate}_to_${endDate}.pdf`
    } else if (format === 'DUAL_PDF') {
      fileBuffer = generateDualCSCForm48PDF(reportData)
      contentType = 'application/pdf'
      fileName = `CSC_Form_48_Dual_${user.name}_${startDate}_to_${endDate}.pdf`
    } else {
      fileBuffer = generateCSCForm48Excel(reportData)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `CSC_Form_48_${user.name}_${startDate}_to_${endDate}.xlsx`
    }

    // Save report record to database
    const report = await db.report.create({
      data: {
        userId: targetUserId,
        title: `CSC Form 48 ${format === 'DUAL_PDF' ? '(Dual)' : ''} - ${reportData.period}`,
        format: format as any, // Convert to enum if needed
        generatedAt: new Date()
      }
    })

    // Return file as response
    const response = new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

    return response

  } catch (error) {
    console.error('Generate report error:', error)
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

    // Get reports
    const reports = await db.report.findMany({
      where: { userId },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json({
      reports
    })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}