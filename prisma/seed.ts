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

  // Create some demo attendance logs
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  await db.attendanceLog.createMany({
    data: [
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })