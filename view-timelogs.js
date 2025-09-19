const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewTimelogs() {
  try {
    console.log('📋 Fetching Account Timelogs...\n');

    // Get all users with their attendance logs
    const users = await prisma.user.findMany({
      include: {
        attendanceLogs: {
          include: {
            checkpoint: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('No accounts found in the database.');
      return;
    }

    // Display timelogs for each account
    users.forEach((user) => {
      console.log(`\n═══════════════════════════════════════════`);
      console.log(`👤 Account: ${user.name || user.email}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👑 Role: ${user.role}`);
      console.log(`📅 Account Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`═══════════════════════════════════════════`);

      if (user.attendanceLogs.length === 0) {
        console.log('   📝 No time logs found for this account');
      } else {
        console.log(`   📊 Total Log Entries: ${user.attendanceLogs.length}\n`);
        
        user.attendanceLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. 📍 ${log.checkpoint.name}`);
          console.log(`      📅 Date: ${log.createdAt.toLocaleDateString()}`);
          console.log(`      🕐 Time In: ${log.timeIn ? log.timeIn.toLocaleTimeString() : 'Not recorded'}`);
          console.log(`      🕐 Time Out: ${log.timeOut ? log.timeOut.toLocaleTimeString() : 'Not recorded'}`);
          console.log(`      📊 Status: ${log.status}`);
          if (log.notes) {
            console.log(`      📝 Notes: ${log.notes}`);
          }
          console.log(`      ─────────────────────────────────────`);
        });
      }
    });

    console.log(`\n\n📊 Summary:`);
    console.log(`Total Accounts: ${users.length}`);
    console.log(`Total Time Log Entries: ${users.reduce((sum, user) => sum + user.attendanceLogs.length, 0)}`);

  } catch (error) {
    console.error('Error fetching timelogs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
viewTimelogs();