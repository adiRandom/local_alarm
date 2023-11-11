const cron = require('node-cron');
const cronParser = require('cron-parser');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDatabase() {
    return open({
        filename: process.env.LOCAL_ALARM_DB || 'alarms.db',
        driver: sqlite3.Database
    });
}

async function checkAlarms(db) {
    try {
        const now = new Date();
        const alarms = await db.all('SELECT id, cron_expression FROM alarms');

        for (const alarm of alarms) {
            try {
                const interval = cronParser.parseExpression(alarm.cron_expression, { currentDate: now });
                const nextDate = interval.next().toDate();
                if (nextDate <= now) {
                    await db.run('UPDATE alarms SET should_ring = true WHERE id = ?', [alarm.id]);
                }
            } catch (error) {
                console.error(`Error parsing cron expression for alarm ID ${alarm.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error checking alarms:', error);
    }
}

async function startCronJob() {
    const db = await setupDatabase();

    cron.schedule('* * * * *', async () => {
        console.log('Running cron job every minute');
        await checkAlarms(db);
    });
}

startCronJob();

