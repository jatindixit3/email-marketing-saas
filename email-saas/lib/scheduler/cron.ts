// Campaign Scheduler Cron Job
// Runs every minute to check for and trigger scheduled campaigns

import cron from 'node-cron';
import { CampaignScheduler } from './campaign-scheduler';

/**
 * Start the campaign scheduler cron job
 * Runs every minute: '* * * * *'
 */
export function startSchedulerCron(): void {
  console.log('🕐 Starting campaign scheduler cron job...');

  // Run every minute
  const task = cron.schedule('* * * * *', async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running scheduled campaign check...`);

    try {
      const results = await CampaignScheduler.processDueCampaigns();

      if (results.processed === 0) {
        console.log('No campaigns due for sending');
      } else {
        console.log(`\nResults:
  - Processed: ${results.processed}
  - Succeeded: ${results.succeeded}
  - Failed: ${results.failed}`);

        if (results.errors.length > 0) {
          console.log('\nErrors:');
          results.errors.forEach((err) => {
            console.log(`  - Campaign ${err.campaignId}: ${err.error}`);
          });
        }
      }
    } catch (error) {
      console.error('Error in scheduler cron job:', error);
    }
  });

  // Start the task
  task.start();
  console.log('✓ Campaign scheduler cron job started (runs every minute)');
}

/**
 * Stop the campaign scheduler cron job
 */
export function stopSchedulerCron(): void {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log('Campaign scheduler cron job stopped');
}

// Auto-start if this file is run directly
if (require.main === module) {
  startSchedulerCron();

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\nShutting down scheduler...');
    stopSchedulerCron();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down scheduler...');
    stopSchedulerCron();
    process.exit(0);
  });
}
