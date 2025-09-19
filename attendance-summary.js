const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showAttendanceSummary() {
  try {
    console.log('📊 Attendance Summary Report\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get agent user with attendance logs
    const agent = await prisma.user.findUnique({
      where: { email: 'agent@example.com' },
      include: {
        attendanceLogs: {
          include: {
            checkpoint: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!agent || agent.attendanceLogs.length === 0) {
      console.log('No attendance data found for agent.');
      return;
    }

    console.log(`👤 Agent: ${agent.name} (${agent.email})\n`);

    // Group by month
    const monthlyData = {};
    
    agent.attendanceLogs.forEach(log => {
      const date = new Date(log.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthName,
          logs: [],
          summary: { PRESENT: 0, LATE: 0, ABSENT: 0, ON_LEAVE: 0 }
        };
      }
      
      monthlyData[monthKey].logs.push(log);
      monthlyData[monthKey].summary[log.status]++;
    });

    // Display monthly summaries
    Object.keys(monthlyData).sort().forEach(monthKey => {
      const month = monthlyData[monthKey];
      console.log(`📅 ${month.name}`);
      console.log('─'.repeat(50));
      console.log(`Total Working Days: ${month.logs.length}`);
      console.log(`Present: ${month.summary.PRESENT} days`);
      console.log(`Late: ${month.summary.LATE} days`);
      console.log(`Absent: ${month.summary.ABSENT} days`);
      console.log(`On Leave: ${month.summary.ON_LEAVE} days`);
      
      // Calculate attendance percentage
      const workingDays = month.summary.PRESENT + month.summary.LATE;
      const attendanceRate = month.logs.length > 0 ? ((workingDays / month.logs.length) * 100).toFixed(1) : 0;
      console.log(`Attendance Rate: ${attendanceRate}%`);
      
      // Show checkpoint distribution
      const checkpointCount = {};
      month.logs.forEach(log => {
        const name = log.checkpoint.name;
        checkpointCount[name] = (checkpointCount[name] || 0) + 1;
      });
      
      console.log('\n🏢 Checkpoint Distribution:');
      Object.entries(checkpointCount).forEach(([checkpoint, count]) => {
        console.log(`   ${checkpoint}: ${count} days`);
      });
      
      console.log('\n');
    });

    // Overall summary
    const totalLogs = agent.attendanceLogs.length;
    const overallSummary = agent.attendanceLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 OVERALL SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Records: ${totalLogs} days`);
    Object.entries(overallSummary).forEach(([status, count]) => {
      const percentage = ((count / totalLogs) * 100).toFixed(1);
      console.log(`${status}: ${count} days (${percentage}%)`);
    });

    const totalWorking = (overallSummary.PRESENT || 0) + (overallSummary.LATE || 0);
    const overallAttendanceRate = totalLogs > 0 ? ((totalWorking / totalLogs) * 100).toFixed(1) : 0;
    console.log(`Overall Attendance Rate: ${overallAttendanceRate}%`);

  } catch (error) {
    console.error('Error generating attendance summary:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
showAttendanceSummary();