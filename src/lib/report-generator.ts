import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

export interface AttendanceData {
  id: string
  date: string
  timeIn: string
  timeOut: string
  checkpoint: string
  status: string
  totalHours: string
}

export interface CSCForm48Data {
  employeeName: string
  employeeId: string
  department: string
  period: string
  attendanceData: AttendanceData[]
}

/**
 * Generate CSC Form 48 PDF Report
 */
export function generateCSCForm48PDF(data: CSCForm48Data): Uint8Array {
  const doc = new jsPDF()
  
  // Set font
  doc.setFont('helvetica')
  
  // Title
  doc.setFontSize(16)
  doc.text('CSC Form 48 - DAILY TIME RECORD', 20, 20)
  
  // Employee Information
  doc.setFontSize(12)
  doc.text(`Employee Name: ${data.employeeName}`, 20, 40)
  doc.text(`Employee ID: ${data.employeeId}`, 20, 50)
  doc.text(`Department: ${data.department}`, 20, 60)
  doc.text(`Period: ${data.period}`, 20, 70)
  
  // Table Headers
  doc.setFontSize(10)
  const headers = ['Date', 'Time In', 'Time Out', 'Checkpoint', 'Status', 'Total Hours']
  let yPosition = 90
  const xPositions = [20, 40, 60, 80, 110, 140]
  
  // Draw headers
  headers.forEach((header, index) => {
    doc.text(header, xPositions[index], yPosition)
  })
  
  // Draw line under headers
  doc.line(20, yPosition + 2, 180, yPosition + 2)
  yPosition += 10
  
  // Draw attendance data
  data.attendanceData.forEach((record) => {
    if (yPosition > 270) { // Add new page if needed
      doc.addPage()
      yPosition = 20
    }
    
    const row = [
      record.date,
      record.timeIn,
      record.timeOut,
      record.checkpoint,
      record.status,
      record.totalHours
    ]
    
    row.forEach((cell, index) => {
      doc.text(cell || '', xPositions[index], yPosition)
    })
    
    yPosition += 8
  })
  
  // Summary
  yPosition += 10
  doc.setFontSize(12)
  doc.text(`Total Days: ${data.attendanceData.length}`, 20, yPosition)
  
  // Signature lines
  yPosition += 20
  doc.setFontSize(10)
  doc.text('Employee Signature:', 20, yPosition)
  doc.text('_____________________', 20, yPosition + 10)
  
  doc.text('Supervisor Signature:', 120, yPosition)
  doc.text('_____________________', 120, yPosition + 10)
  
  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate CSC Form 48 Excel Report
 */
export function generateCSCForm48Excel(data: CSCForm48Data): Uint8Array {
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Create summary sheet
  const summaryData = [
    ['CSC Form 48 - DAILY TIME RECORD'],
    [''],
    ['Employee Name:', data.employeeName],
    ['Employee ID:', data.employeeId],
    ['Department:', data.department],
    ['Period:', data.period],
    [''],
    ['Total Days:', data.attendanceData.length.toString()]
  ]
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
  
  // Create attendance data sheet
  const attendanceHeaders = ['Date', 'Time In', 'Time Out', 'Checkpoint', 'Status', 'Total Hours']
  const attendanceRows = data.attendanceData.map(record => [
    record.date,
    record.timeIn,
    record.timeOut,
    record.checkpoint,
    record.status,
    record.totalHours
  ])
  
  const attendanceData = [attendanceHeaders, ...attendanceRows]
  const attendanceWs = XLSX.utils.aoa_to_sheet(attendanceData)
  
  // Set column widths
  attendanceWs['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Time In
    { wch: 10 }, // Time Out
    { wch: 15 }, // Checkpoint
    { wch: 10 }, // Status
    { wch: 12 }  // Total Hours
  ]
  
  XLSX.utils.book_append_sheet(wb, attendanceWs, 'Attendance Data')
  
  // Generate Excel file
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

/**
 * Calculate total hours between time in and time out
 */
export function calculateTotalHours(timeIn: Date, timeOut: Date): string {
  if (!timeIn || !timeOut) return '0:00'
  
  const diffMs = timeOut.getTime() - timeIn.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}