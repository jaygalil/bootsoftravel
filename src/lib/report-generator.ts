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
  // Use A4 paper size with portrait orientation for better compatibility
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // Set font
  doc.setFont('helvetica')
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  
  // CSC Form 48 Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DAILY TIME RECORD', pageWidth / 2, 25, { align: 'center' })
  
  // Employee Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.employeeName.toUpperCase(), pageWidth / 2, 38, { align: 'center' })
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(pageWidth * 0.25, 40, pageWidth * 0.75, 40)
  
  // Period section
  doc.setFontSize(10)
  doc.text('For the month of:', margin, 50)
  doc.text(data.period, margin + 40, 50)
  doc.line(margin + 38, 52, margin + 120, 52)
  
  // Regular hours and working hours sections
  doc.text('Official hours for ARRIVAL and DEPARTURE', margin, 60)
  doc.text('REGULAR DAYS: 8:00-5:00pm', margin, 67)

  // Draw table frame with better proportions
  const tableTop = 75
  const tableWidth = pageWidth - (2 * margin)
  const rowHeight = 8
  const colWidths = [25, 28, 28, 28, 28, 30] // Better balanced column widths
  
  // Calculate positions starting from margin
  let startX = margin
  const colX = colWidths.map(width => {
    const x = startX
    startX += width
    return x
  })

  // Draw main table headers with better styling
  doc.setFillColor(235, 235, 235)
  doc.rect(colX[0], tableTop, tableWidth, rowHeight * 2, 'F')
  
  // Header row - first level
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DAYS', colX[0] + colWidths[0]/2, tableTop + 5, { align: 'center' })
  doc.text('AM', colX[1] + (colWidths[1] + colWidths[2])/2, tableTop + 3, { align: 'center' })
  doc.text('PM', colX[3] + (colWidths[3] + colWidths[4])/2, tableTop + 3, { align: 'center' })
  doc.text('UNDERTIME', colX[5] + colWidths[5]/2, tableTop + 5, { align: 'center' })
  
  // Subheaders for AM/PM - second level
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('IN', colX[1] + colWidths[1]/2, tableTop + rowHeight + 3, { align: 'center' })
  doc.text('OUT', colX[2] + colWidths[2]/2, tableTop + rowHeight + 3, { align: 'center' })
  doc.text('IN', colX[3] + colWidths[3]/2, tableTop + rowHeight + 3, { align: 'center' })
  doc.text('OUT', colX[4] + colWidths[4]/2, tableTop + rowHeight + 3, { align: 'center' })
  
  // Draw grid lines for table
  doc.setLineWidth(0.2)
  doc.setDrawColor(0)
  
  const dataRowStart = tableTop + (rowHeight * 2) // After header rows
  const totalDataRows = 31
  const tableBottom = dataRowStart + (totalDataRows * rowHeight)
  
  // Horizontal lines
  for (let i = 0; i <= totalDataRows; i++) {
    doc.line(colX[0], dataRowStart + i * rowHeight, colX[0] + tableWidth, dataRowStart + i * rowHeight)
  }
  
  // Header horizontal lines
  doc.line(colX[0], tableTop, colX[0] + tableWidth, tableTop) // Top border
  doc.line(colX[0], tableTop + rowHeight, colX[0] + tableWidth, tableTop + rowHeight) // Middle of header
  doc.line(colX[0], dataRowStart, colX[0] + tableWidth, dataRowStart) // Bottom of header
  
  // Vertical lines
  for (let i = 0; i <= colWidths.length; i++) {
    const x = colX[i] || (colX[0] + tableWidth)
    doc.line(x, tableTop, x, tableBottom)
  }
  
  // Fill in attendance data
  let yPos = dataRowStart
  
  // Create a mapping of dates to attendance records
  const dateMap = new Map()
  data.attendanceData.forEach(record => {
    const date = new Date(record.date)
    const day = date.getDate()
    dateMap.set(day, record)
  })
  
  // Fill in data for days 1-31
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  for (let day = 1; day <= 31; day++) {
    const record = dateMap.get(day)
    
    // Write day number
    doc.text(day.toString(), colX[0] + colWidths[0]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
    
    if (record) {
      // Parse time strings
      const timeIn = record.timeIn
      const timeOut = record.timeOut
      
      // Determine if morning or afternoon based on hour
      const timeInHour = parseInt(timeIn.split(':')[0])
      const timeOutHour = timeOut ? parseInt(timeOut.split(':')[0]) : 0
      
      // Morning In/Out or Afternoon In/Out with correct column positioning
      if (timeInHour < 12) {
        doc.text(timeIn, colX[1] + colWidths[1]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        if (timeOutHour < 13) {
          doc.text(timeOut, colX[2] + colWidths[2]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        }
      } else {
        doc.text(timeIn, colX[3] + colWidths[3]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        if (timeOut) {
          doc.text(timeOut, colX[4] + colWidths[4]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        }
      }
      
      // Add undertime if available
      if (record.totalHours) {
        const [hours, minutes] = record.totalHours.split(':').map(Number)
        const standardHours = 8
        if (hours < standardHours) {
          const undertime = `${standardHours - hours}:${minutes > 0 ? (60 - minutes).toString().padStart(2, '0') : '00'}`
          doc.text(undertime, colX[5] + colWidths[5]/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        }
      }
    } else {
      // Mark weekends or special days
      const currentDate = new Date(data.period.split(' - ')[0])
      currentDate.setDate(day)
      const dayOfWeek = currentDate.getDay()
      
      if (dayOfWeek === 0) { // Sunday
        doc.setFontSize(7)
        doc.text('SUNDAY', colX[1] + (colWidths[1] + colWidths[2])/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        doc.setFontSize(8)
      } else if (dayOfWeek === 6) { // Saturday
        doc.setFontSize(7)
        doc.text('SATURDAY', colX[1] + (colWidths[1] + colWidths[2])/2, yPos + (rowHeight/2) + 1, { align: 'center' })
        doc.setFontSize(8)
      }
    }
    
    yPos += rowHeight
  }
  
  // Certification section at bottom of table
  const certificationY = tableBottom + 15
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  doc.text('I certify on my honor that the above is a true and', margin, certificationY)
  doc.text('correct report of the hours of work performed. Record', margin, certificationY + 5)
  doc.text('of which was made daily at the time of arrival and', margin, certificationY + 10)
  doc.text('departure from office.', margin, certificationY + 15)
  
  // Employee signature section
  const empSignY = certificationY + 30
  doc.setFontSize(10)
  doc.text(data.employeeName.toUpperCase(), pageWidth / 2, empSignY, { align: 'center' })
  doc.setLineWidth(0.3)
  doc.line(pageWidth * 0.3, empSignY + 3, pageWidth * 0.7, empSignY + 3)
  doc.setFontSize(8)
  doc.text('(Signature of official or employee)', pageWidth / 2, empSignY + 8, { align: 'center' })
  
  // Supervisor signature section
  const supSignY = empSignY + 25
  doc.setFontSize(10)
  doc.text('ENGR. RONALD S. BARITIAN', pageWidth / 2, supSignY, { align: 'center' })
  doc.setLineWidth(0.3)
  doc.line(pageWidth * 0.3, supSignY + 3, pageWidth * 0.7, supSignY + 3)
  doc.setFontSize(8)
  doc.text('(Immediate supervisor)', pageWidth / 2, supSignY + 8, { align: 'center' })
  
  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate CSC Form 48 PDF with dual forms per A4 page (exactly like the image)
 */
export function generateDualCSCForm48PDF(data: CSCForm48Data): Uint8Array {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // A4 dimensions: 210mm x 297mm
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const formHeight = (pageHeight - margin * 3) / 2 // Two forms per page with margins
  const formWidth = pageWidth - (margin * 2)
  
  // Generate first form (top half)
  generateCompactForm(doc, data, margin, margin, formWidth, formHeight)
  
  // Generate second form (bottom half) - duplicate for monthly reporting
  generateCompactForm(doc, data, margin, margin + formHeight + margin, formWidth, formHeight)
  
  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate a compact DTR form exactly matching the provided image layout
 */
function generateCompactForm(doc: any, data: CSCForm48Data, startX: number, startY: number, formWidth: number, formHeight: number) {
  // Set font
  doc.setFont('helvetica')
  
  // Draw outer border
  doc.setLineWidth(0.5)
  doc.rect(startX, startY, formWidth, formHeight)
  
  // CS FORM 48 label (top right)
  doc.setFontSize(8)
  doc.text('CS FORM 48', startX + formWidth - 25, startY + 8)
  
  // Main title
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DAILY TIME RECORD', startX + formWidth / 2, startY + 15, { align: 'center' })
  
  // Employee name with underline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const nameY = startY + 28
  doc.text(data.employeeName.toUpperCase(), startX + formWidth / 2, nameY, { align: 'center' })
  doc.setLineWidth(0.3)
  doc.line(startX + 20, nameY + 2, startX + formWidth - 20, nameY + 2)
  
  // Period and working hours info
  doc.setFontSize(8)
  const infoY = nameY + 12
  doc.text('For the month of:', startX + 5, infoY)
  doc.text(data.period.split(' - ')[0], startX + 45, infoY) // Just show start of period
  doc.line(startX + 43, infoY + 2, startX + 100, infoY + 2)
  
  doc.text('Official hours for ARRIVAL and DEPARTURE', startX + 5, infoY + 6)
  doc.text('REGULAR DAYS : Mon.-Fri.(Except Tues.),8am-5pm;Time:', startX + 5, infoY + 10)
  
  // Table setup - matching the exact layout from image
  const tableStartY = infoY + 16
  const tableHeight = formHeight - (tableStartY - startY) - 45 // Leave space for signatures
  const rowHeight = Math.min(5.5, tableHeight / 33) // 31 days + 2 header rows
  
  // Column widths exactly matching the image
  const colWidths = [12, 15, 15, 15, 15, 15, 15] // DAYS, AM IN/OUT, PM IN/OUT, UNDERTIME HRS/MIN
  const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0)
  
  // Center the table
  const tableStartX = startX + (formWidth - totalTableWidth) / 2
  
  const colX: number[] = []
  let currentX = tableStartX
  for (let i = 0; i < colWidths.length; i++) {
    colX.push(currentX)
    currentX += colWidths[i]
  }
  
  // Draw table grid
  doc.setLineWidth(0.2)
  
  // Horizontal lines
  for (let i = 0; i <= 33; i++) { // 2 header + 31 data rows
    const y = tableStartY + i * rowHeight
    doc.line(colX[0], y, colX[6] + colWidths[6], y)
  }
  
  // Vertical lines
  for (let i = 0; i <= colWidths.length; i++) {
    const x = i < colWidths.length ? colX[i] : colX[6] + colWidths[6]
    doc.line(x, tableStartY, x, tableStartY + 33 * rowHeight)
  }
  
  // Table headers exactly as shown in image
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  
  // First header row
  let headerY = tableStartY + rowHeight * 0.7
  doc.text('DAYS', colX[0] + colWidths[0] / 2, headerY, { align: 'center' })
  doc.text('AM', colX[1] + colWidths[1], headerY, { align: 'center' })
  doc.text('PM', colX[3] + colWidths[3], headerY, { align: 'center' })
  doc.text('UNDERTIME', colX[5] + (colWidths[5] + colWidths[6]) / 2, headerY, { align: 'center' })
  
  // Second header row
  headerY = tableStartY + rowHeight * 1.7
  doc.text('IN', colX[1] + colWidths[1] / 2, headerY, { align: 'center' })
  doc.text('OUT', colX[2] + colWidths[2] / 2, headerY, { align: 'center' })
  doc.text('IN', colX[3] + colWidths[3] / 2, headerY, { align: 'center' })
  doc.text('OUT', colX[4] + colWidths[4] / 2, headerY, { align: 'center' })
  doc.text('HRS', colX[5] + colWidths[5] / 2, headerY, { align: 'center' })
  doc.text('MIN', colX[6] + colWidths[6] / 2, headerY, { align: 'center' })
  
  // Additional subdivision lines in header
  doc.line(colX[1] + colWidths[1], tableStartY + rowHeight, colX[1] + colWidths[1], tableStartY + 2 * rowHeight)
  doc.line(colX[3] + colWidths[3], tableStartY + rowHeight, colX[3] + colWidths[3], tableStartY + 2 * rowHeight)
  doc.line(colX[5] + colWidths[5], tableStartY + rowHeight, colX[5] + colWidths[5], tableStartY + 2 * rowHeight)
  
  // Fill in data
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  
  // Create date mapping
  const dateMap = new Map()
  data.attendanceData.forEach(record => {
    const date = new Date(record.date)
    const day = date.getDate()
    dateMap.set(day, record)
  })
  
  // Get base date for month calculation
  const [startDateStr] = data.period.split(' - ')
  const baseDate = new Date(startDateStr)
  
  // Fill in days 1-31
  for (let day = 1; day <= 31; day++) {
    const rowY = tableStartY + (day + 1) * rowHeight + rowHeight * 0.6
    const record = dateMap.get(day)
    
    // Day number
    doc.text(day.toString(), colX[0] + colWidths[0] / 2, rowY, { align: 'center' })
    
    // Check if this day exists in the month
    const currentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), day)
    if (currentDate.getMonth() !== baseDate.getMonth()) {
      continue // Skip invalid days for this month
    }
    
    const dayOfWeek = currentDate.getDay()
    
    if (record && record.timeIn) {
      // Has attendance record
      const timeIn = record.timeIn
      const timeOut = record.timeOut || ''
      
      // Convert to 12-hour format and determine AM/PM placement
      const timeInHour = parseInt(timeIn.split(':')[0])
      const timeInMin = timeIn.split(':')[1]
      const timeOutHour = timeOut ? parseInt(timeOut.split(':')[0]) : 0
      const timeOutMin = timeOut ? timeOut.split(':')[1] : ''
      
      // Format times for display (remove seconds if present)
      const displayTimeIn = `${timeInHour}:${timeInMin}`
      const displayTimeOut = timeOut ? `${timeOutHour}:${timeOutMin}` : ''
      
      // Morning attendance (before 12:00)
      if (timeInHour < 12) {
        doc.text(displayTimeIn, colX[1] + colWidths[1] / 2, rowY, { align: 'center' })
        if (displayTimeOut && timeOutHour < 13) {
          doc.text(displayTimeOut, colX[2] + colWidths[2] / 2, rowY, { align: 'center' })
        }
      }
      
      // Afternoon attendance (12:00 and after)
      if (timeInHour >= 12 || (timeInHour < 12 && timeOutHour >= 13)) {
        if (timeInHour >= 12) {
          doc.text(displayTimeIn, colX[3] + colWidths[3] / 2, rowY, { align: 'center' })
        }
        if (displayTimeOut && timeOutHour >= 13) {
          doc.text(displayTimeOut, colX[4] + colWidths[4] / 2, rowY, { align: 'center' })
        }
      }
      
      // Calculate and display undertime
      if (record.totalHours) {
        const [hours, minutes] = record.totalHours.split(':').map(Number)
        if (hours < 8) {
          const undertimeHours = 8 - hours
          const undertimeMinutes = minutes > 0 ? 60 - minutes : 0
          if (undertimeHours > 0) {
            doc.text(undertimeHours.toString(), colX[5] + colWidths[5] / 2, rowY, { align: 'center' })
          }
          if (undertimeMinutes > 0) {
            doc.text(undertimeMinutes.toString(), colX[6] + colWidths[6] / 2, rowY, { align: 'center' })
          }
        }
      }
    } else {
      // No record - mark weekends exactly as shown in image
      if (dayOfWeek === 0) { // Sunday
        doc.setFontSize(5)
        doc.text('SUNDAY', colX[2] + colWidths[2] / 2, rowY, { align: 'center' })
        doc.setFontSize(5.5)
      } else if (dayOfWeek === 6) { // Saturday
        doc.setFontSize(5)
        doc.text('SATURDAY', colX[2] + colWidths[2] / 2, rowY, { align: 'center' })
        doc.setFontSize(5.5)
      }
    }
  }
  
  // Bottom section exactly as shown in image
  const bottomY = tableStartY + 33 * rowHeight + 3
  
  // Add totals row at bottom of table
  doc.setFontSize(6)
  doc.text('Total', colX[5] + colWidths[5] / 2, bottomY, { align: 'center' })
  doc.text('Total', colX[6] + colWidths[6] / 2, bottomY, { align: 'center' })
  
  // Certification text
  doc.setFontSize(6)
  const certY = bottomY + 8
  doc.text('I certify on my honor that the above is a true and', startX + 5, certY)
  doc.text('correct report of the hours of work performed. Record', startX + 5, certY + 3)
  doc.text('of which was made daily at the time of arrival and', startX + 5, certY + 6)
  doc.text('departure from office.', startX + 5, certY + 9)
  
  // Employee signature
  const sigY = certY + 15
  doc.setFontSize(7)
  doc.text(data.employeeName.toUpperCase(), startX + formWidth / 2, sigY, { align: 'center' })
  doc.setLineWidth(0.2)
  doc.line(startX + 30, sigY + 2, startX + formWidth - 30, sigY + 2)
  doc.setFontSize(5)
  doc.text('(Signature of official or employee)', startX + formWidth / 2, sigY + 5, { align: 'center' })
  
  // Verified section
  doc.setFontSize(6)
  doc.text('Verified as to Correctness:', startX + 5, sigY + 10)
  
  // Supervisor signature
  doc.setFontSize(7)
  doc.text('ENGR. RONALD S. BARITIAN', startX + formWidth / 2, sigY + 15, { align: 'center' })
  doc.line(startX + 30, sigY + 17, startX + formWidth - 30, sigY + 17)
  doc.setFontSize(5)
  doc.text('Immediate Supervisor', startX + formWidth / 2, sigY + 20, { align: 'center' })
}

/**
 * Generate CSC Form 48 Excel Report
 */
export function generateCSCForm48Excel(data: CSCForm48Data): Uint8Array {
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Create CSC Form 48 sheet with proper format
  const formData = [
    ['CSC FORM 48'],
    [''],
    ['DAILY TIME RECORD'],
    [''],
    [data.employeeName.toUpperCase()],
    [''],
    [`For the month of: ${data.period}`],
    ['Official hours for ARRIVAL and DEPARTURE'],
    ['REGULAR DAYS: 8:00-5:00pm'],
    [''],
    ['DAYS', 'AM', '', 'PM', '', 'UNDERTIME'],
    ['', 'IN', 'OUT', 'IN', 'OUT', ''],
  ]
  
  // Create a mapping of dates to attendance records
  const dateMap = new Map()
  data.attendanceData.forEach(record => {
    const date = new Date(record.date)
    const day = date.getDate()
    dateMap.set(day, record)
  })
  
  // Add data for days 1-31
  for (let day = 1; day <= 31; day++) {
    const record = dateMap.get(day)
    let row = [day.toString(), '', '', '', '', '']
    
    if (record) {
      const timeIn = record.timeIn
      const timeOut = record.timeOut
      const timeInHour = parseInt(timeIn.split(':')[0])
      const timeOutHour = timeOut ? parseInt(timeOut.split(':')[0]) : 0
      
      // Morning In/Out or Afternoon In/Out
      if (timeInHour < 12) {
        row[1] = timeIn // AM IN
        if (timeOutHour < 13) {
          row[2] = timeOut // AM OUT
        }
      } else {
        row[3] = timeIn // PM IN
        if (timeOut) {
          row[4] = timeOut // PM OUT
        }
      }
      
      // Calculate undertime
      if (record.totalHours) {
        const [hours, minutes] = record.totalHours.split(':').map(Number)
        const standardHours = 8
        if (hours < standardHours) {
          const undertime = `${standardHours - hours}:${minutes > 0 ? (60 - minutes).toString().padStart(2, '0') : '00'}`
          row[5] = undertime
        }
      }
    } else {
      // Mark weekends or special days
      const currentDate = new Date(data.period.split(' - ')[0])
      currentDate.setDate(day)
      const dayOfWeek = currentDate.getDay()
      
      if (dayOfWeek === 0) { // Sunday
        row[2] = 'SUNDAY'
      } else if (dayOfWeek === 6) { // Saturday
        row[2] = 'SATURDAY'
      }
    }
    
    formData.push(row)
  }
  
  // Add certification text
  formData.push([])
  formData.push(['I certify on my honor that the above is a true and'])
  formData.push(['correct report of the hours of work performed. Record'])
  formData.push(['of which was made daily at the time of arrival and'])
  formData.push(['departure from office.'])
  formData.push([])
  formData.push([data.employeeName.toUpperCase()])
  formData.push(['(Signature of official or employee)'])
  formData.push([])
  formData.push(['ENGR. RONALD S. BARITIAN'])
  formData.push(['(Immediate supervisor)'])
  
  const formWs = XLSX.utils.aoa_to_sheet(formData)
  
  // Set column widths
  formWs['!cols'] = [
    { wch: 8 },  // Days
    { wch: 12 }, // AM IN
    { wch: 12 }, // AM OUT
    { wch: 12 }, // PM IN
    { wch: 12 }, // PM OUT
    { wch: 12 }  // Undertime
  ]
  
  // Merge cells for title and headers
  if (!formWs['!merges']) formWs['!merges'] = []
  formWs['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }) // CSC FORM 48
  formWs['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }) // DAILY TIME RECORD
  formWs['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }) // Employee name
  formWs['!merges'].push({ s: { r: 10, c: 1 }, e: { r: 10, c: 2 } }) // AM header
  formWs['!merges'].push({ s: { r: 10, c: 3 }, e: { r: 10, c: 4 } }) // PM header
  
  XLSX.utils.book_append_sheet(wb, formWs, 'CSC Form 48')
  
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
