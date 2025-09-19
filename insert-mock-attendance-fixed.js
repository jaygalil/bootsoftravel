const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock attendance patterns
const attendancePatterns = [
  { timeIn: '08:00', timeOut: '17:00', status: 'PRESENT' },
  { timeIn: '08:15', timeOut: '17:15', status: 'LATE' },
  { timeIn: '08:05', timeOut: '17:05', status: 'PRESENT' },
  { timeIn: '08:30', timeOut: '17:30', status: 'LATE' },
  { timeIn: '07:45', timeOut: '16:45', status: 'PRESENT' },
  { timeIn: null, timeOut: null, status: 'ABSENT' },
  { timeIn: '08:00', timeOut: '12:00', status: 'ON_LEAVE' }, // Half day
];

function getRandomPattern() {
  return attendancePatterns[Math.floor(Math.random() * attendancePatterns.length)];
}

function getRandomCheckpoint(checkpoints) {
  return checkpoints[Math.floor(Math.random() * checkpoints.length)];
}

function createTimeString(dateStr, timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':');
  const date = new Date(dateStr);
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

async function insertMockAttendance() {
  try {
    console.log('🚀 Starting mock attendance data insertion...\n');

    // Get the agent user
    const agent = await prisma.user.findUnique({
      where: { email: 'agent@example.com' }
    });

    if (!agent) {
      console.error('❌ Agent user not found! Please run the seed script first.');
      return;
    }

    console.log(`👤 Found agent: ${agent.name} (${agent.email})`);

    // Get existing checkpoints
    const checkpoints = await prisma.checkpoint.findMany({
      where: { isActive: true }
    });

    if (checkpoints.length === 0) {
      console.error('❌ No active checkpoints found! Please run the seed script first.');
      return;
    }

    console.log(`🏢 Found ${checkpoints.length} active checkpoints:`);
    checkpoints.forEach(cp => console.log(`   - ${cp.name} (${cp.id})`));
    console.log('');

    const checkpointIds = checkpoints.map(cp => cp.id);
    const mockData = [];

    // August 2025 (1-31)
    console.log('📅 Generating August 2025 attendance data...');
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 7, day); // Month is 0-indexed, so 7 = August
      
      // Skip weekends most of the time (90% chance)
      if (isWeekend(date) && Math.random() < 0.9) {
        continue;
      }

      const pattern = getRandomPattern();
      const checkpointId = getRandomCheckpoint(checkpointIds);
      
      mockData.push({
        userId: agent.id,
        checkpointId: checkpointId,
        timeIn: createTimeString(date.toDateString(), pattern.timeIn),
        timeOut: createTimeString(date.toDateString(), pattern.timeOut),
        status: pattern.status,
        notes: isWeekend(date) ? 'Weekend shift' : null,
        createdAt: date,
        updatedAt: date,
      });
    }

    // September 2025 (1-15)
    console.log('📅 Generating September 1-15, 2025 attendance data...');
    for (let day = 1; day <= 15; day++) {
      const date = new Date(2025, 8, day); // Month is 0-indexed, so 8 = September
      
      // Skip weekends most of the time (90% chance)
      if (isWeekend(date) && Math.random() < 0.9) {
        continue;
      }

      const pattern = getRandomPattern();
      const checkpointId = getRandomCheckpoint(checkpointIds);
      
      mockData.push({
        userId: agent.id,
        checkpointId: checkpointId,
        timeIn: createTimeString(date.toDateString(), pattern.timeIn),
        timeOut: createTimeString(date.toDateString(), pattern.timeOut),
        status: pattern.status,
        notes: isWeekend(date) ? 'Weekend shift' : null,
        createdAt: date,
        updatedAt: date,
      });
    }

    console.log(`📊 Generated ${mockData.length} attendance records`);
    console.log('💾 Inserting data into database...\n');

    // Delete existing attendance logs for the agent in the specified date range
    const startDate = new Date(2025, 7, 1); // August 1, 2025
    const endDate = new Date(2025, 8, 15, 23, 59, 59); // September 15, 2025

    const deletedRecords = await prisma.attendanceLog.deleteMany({
      where: {
        userId: agent.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log(`🗑️ Deleted ${deletedRecords.count} existing records in the date range`);

    // Insert new mock data
    const result = await prisma.attendanceLog.createMany({
      data: mockData,
    });

    console.log(`✅ Successfully inserted ${result.count} attendance records!\n`);

    // Generate summary
    const summary = mockData.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Summary of inserted records:');
    Object.entries(summary).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} days`);
    });

    console.log(`\n🏢 Checkpoints used:`);
    const checkpointSummary = mockData.reduce((acc, record) => {
      const checkpoint = checkpoints.find(cp => cp.id === record.checkpointId);
      const name = checkpoint ? checkpoint.name : record.checkpointId;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(checkpointSummary).forEach(([checkpoint, count]) => {
      console.log(`   ${checkpoint}: ${count} days`);
    });

  } catch (error) {
    console.error('❌ Error inserting mock attendance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
insertMockAttendance();