import { db } from '../src/lib/db'
import { UserRole, AttendanceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding database...')

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const adminUser = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  const agentUser = await db.user.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      email: 'agent@example.com',
      name: 'Agent User',
      password: hashedPassword,
      role: UserRole.AGENT,
    },
  })

  // Create Jaymar Recolizado user
  const jaymarUser = await db.user.upsert({
    where: { email: 'jaymar.recolizado@dict.gov.ph' },
    update: {},
    create: {
      email: 'jaymar.recolizado@dict.gov.ph',
      name: 'Jaymar Recolizado',
      password: hashedPassword,
      role: UserRole.AGENT,
    },
  })

  // Create demo checkpoints
  const mainOffice = await db.checkpoint.upsert({
    where: { id: 'main-office' },
    update: {},
    create: {
      id: 'main-office',
      name: 'Main Office',
      description: 'Main office building',
      latitude: 14.5995, // Manila coordinates
      longitude: 120.9842,
      radius: 100, // 100 meters
      isActive: true,
    },
  })

  const branchOffice = await db.checkpoint.upsert({
    where: { id: 'branch-office' },
    update: {},
    create: {
      id: 'branch-office',
      name: 'Branch Office',
      description: 'Branch office location',
      latitude: 14.6091,
      longitude: 120.9925,
      radius: 50, // 50 meters
      isActive: true,
    },
  })

  const remoteSite = await db.checkpoint.upsert({
    where: { id: 'remote-site' },
    update: {},
    create: {
      id: 'remote-site',
      name: 'Remote Site',
      description: 'Remote work site',
      latitude: 14.5847,
      longitude: 121.0685,
      radius: 200, // 200 meters
      isActive: false,
    },
  })

  // Create comprehensive mock attendance logs for Jaymar Recolizado
  const jaymarAttendanceLogs = []
  
  // August 2025 attendance logs (August 1-30, 2025)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2025, 7, day) // Month is 0-indexed, so 7 = August
    
    // Skip if date doesn't exist (e.g., August 31st)
    if (date.getMonth() !== 7) continue
    
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue
    
    // Simulate realistic work patterns
    let timeInHour = 8
    let timeInMinute = 0
    let timeOutHour = 17
    let timeOutMinute = 0
    let status = AttendanceStatus.PRESENT
    let checkpointId = mainOffice.id
    let notes = null
    
    // Add some variety to the data
    const randomFactor = Math.random()
    
    if (randomFactor < 0.05) {
      // 5% chance of being absent
      status = AttendanceStatus.ABSENT
      notes = 'Sick leave'
      jaymarAttendanceLogs.push({
        userId: jaymarUser.id,
        checkpointId: mainOffice.id,
        timeIn: null,
        timeOut: null,
        status,
        notes,
        createdAt: new Date(2025, 7, day, 8, 0, 0),
        updatedAt: new Date(2025, 7, day, 8, 0, 0),
      })
      continue
    } else if (randomFactor < 0.08) {
      // 3% chance of being on leave
      status = AttendanceStatus.ON_LEAVE
      notes = 'Vacation leave'
      jaymarAttendanceLogs.push({
        userId: jaymarUser.id,
        checkpointId: mainOffice.id,
        timeIn: null,
        timeOut: null,
        status,
        notes,
        createdAt: new Date(2025, 7, day, 8, 0, 0),
        updatedAt: new Date(2025, 7, day, 8, 0, 0),
      })
      continue
    } else if (randomFactor < 0.2) {
      // 12% chance of being late
      timeInHour = 8
      timeInMinute = Math.floor(Math.random() * 45) + 15 // 15-60 minutes late
      status = AttendanceStatus.LATE
      notes = 'Traffic'
    } else if (randomFactor < 0.3) {
      // 10% chance of working at branch office
      checkpointId = branchOffice.id
      notes = 'Field work at branch office'
    } else if (randomFactor < 0.35) {
      // 5% chance of overtime
      timeOutHour = Math.floor(Math.random() * 3) + 18 // 6 PM to 9 PM
      timeOutMinute = Math.floor(Math.random() * 60)
      notes = 'Overtime work'
    }
    
    // Add some minor variations to regular attendance
    if (status === AttendanceStatus.PRESENT) {
      timeInMinute = Math.floor(Math.random() * 15) // 0-14 minutes variation
      timeOutMinute = Math.floor(Math.random() * 30) // 0-29 minutes variation
    }
    
    const timeIn = new Date(2025, 7, day, timeInHour, timeInMinute, 0)
    const timeOut = new Date(2025, 7, day, timeOutHour, timeOutMinute, 0)
    
    jaymarAttendanceLogs.push({
      userId: jaymarUser.id,
      checkpointId,
      timeIn,
      timeOut,
      status,
      notes,
      createdAt: timeIn,
      updatedAt: timeOut,
    })
  }
  
  // September 2025 attendance logs (September 1-15, 2025)
  for (let day = 1; day <= 15; day++) {
    const date = new Date(2025, 8, day) // Month is 0-indexed, so 8 = September
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue
    
    // Simulate realistic work patterns
    let timeInHour = 8
    let timeInMinute = 0
    let timeOutHour = 17
    let timeOutMinute = 0
    let status = AttendanceStatus.PRESENT
    let checkpointId = mainOffice.id
    let notes = null
    
    // Add some variety to the data
    const randomFactor = Math.random()
    
    if (randomFactor < 0.03) {
      // 3% chance of being absent
      status = AttendanceStatus.ABSENT
      notes = 'Medical appointment'
      jaymarAttendanceLogs.push({
        userId: jaymarUser.id,
        checkpointId: mainOffice.id,
        timeIn: null,
        timeOut: null,
        status,
        notes,
        createdAt: new Date(2025, 8, day, 8, 0, 0),
        updatedAt: new Date(2025, 8, day, 8, 0, 0),
      })
      continue
    } else if (randomFactor < 0.15) {
      // 12% chance of being late
      timeInHour = 8
      timeInMinute = Math.floor(Math.random() * 30) + 10 // 10-40 minutes late
      status = AttendanceStatus.LATE
      notes = 'Transportation delay'
    } else if (randomFactor < 0.25) {
      // 10% chance of working at branch office
      checkpointId = branchOffice.id
      notes = 'Branch office assignment'
    } else if (randomFactor < 0.3) {
      // 5% chance of overtime
      timeOutHour = Math.floor(Math.random() * 2) + 18 // 6 PM to 8 PM
      timeOutMinute = Math.floor(Math.random() * 60)
      notes = 'Project deadline work'
    }
    
    // Add some minor variations to regular attendance
    if (status === AttendanceStatus.PRESENT) {
      timeInMinute = Math.floor(Math.random() * 10) // 0-9 minutes variation
      timeOutMinute = Math.floor(Math.random() * 20) // 0-19 minutes variation
    }
    
    const timeIn = new Date(2025, 8, day, timeInHour, timeInMinute, 0)
    const timeOut = new Date(2025, 8, day, timeOutHour, timeOutMinute, 0)
    
    jaymarAttendanceLogs.push({
      userId: jaymarUser.id,
      checkpointId,
      timeIn,
      timeOut,
      status,
      notes,
      createdAt: timeIn,
      updatedAt: timeOut,
    })
  }
  
  // Create some demo attendance logs for other users
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  await db.attendanceLog.createMany({
    data: [
      // Regular agent user logs
      {
        userId: agentUser.id,
        checkpointId: mainOffice.id,
        timeIn: new Date(today.setHours(8, 0, 0, 0)),
        timeOut: new Date(today.setHours(17, 0, 0, 0)),
        status: AttendanceStatus.PRESENT,
      },
      {
        userId: agentUser.id,
        checkpointId: mainOffice.id,
        timeIn: new Date(yesterday.setHours(8, 15, 0, 0)),
        timeOut: new Date(yesterday.setHours(17, 30, 0, 0)),
        status: AttendanceStatus.LATE,
      },
      {
        userId: agentUser.id,
        checkpointId: branchOffice.id,
        timeIn: new Date(twoDaysAgo.setHours(8, 0, 0, 0)),
        timeOut: new Date(twoDaysAgo.setHours(17, 0, 0, 0)),
        status: AttendanceStatus.PRESENT,
      },
      // Jaymar's comprehensive attendance logs
      ...jaymarAttendanceLogs
    ],
  })

  // Create some demo reports
  await db.report.createMany({
    data: [
      {
        userId: agentUser.id,
        title: 'Weekly Attendance Report - Current Week',
        format: 'PDF',
        generatedAt: new Date(),
      },
      {
        userId: agentUser.id,
        title: 'Monthly Attendance Report - Previous Month',
        format: 'EXCEL',
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Demo users created:')
  console.log('Admin: admin@example.com / password123')
  console.log('Agent: agent@example.com / password123')
  console.log('Jaymar Recolizado: jaymar.recolizado@dict.gov.ph / password123')
  console.log('')
  console.log('Mock attendance data generated:')
  console.log('- Jaymar Recolizado: August 1-30, 2025 & September 1-15, 2025')
  console.log('- Includes varied attendance patterns: Present, Late, Absent, On Leave')
  console.log('- Multiple checkpoint locations: Main Office, Branch Office')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })