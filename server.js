
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(express.json());

async function setupDatabase() {
    const db = await open({
        filename: process.env.LOCAL_ALARM_DB || 'alarms.db',
        driver: sqlite3.Database
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cron_expression TEXT,
        should_ring BOOLEAN
    )`);

    return db;
}

const dbPromise = setupDatabase();

// [Rest of your endpoint implementations]

// Get the ID of the first alarm that should ring
app.get('/alarm/status', async (req, res) => {
    const db = await dbPromise;
    try {
        const alarm = await db.get('SELECT id FROM alarms WHERE should_ring = true LIMIT 1');
        if (alarm) {
            res.status(200).json({ id: alarm.id });
        } else {
            res.status(404).send('No alarm needs to ring at the moment');
        }
    } catch (error) {
        res.status(500).send('Error retrieving alarm');
    }
});

// Create an alarm
app.post('/alarm/create', async (req, res) => {
    const db = await dbPromise;
    try {
        const { cron_expression } = req.body;
        const result = await db.run('INSERT INTO alarms (cron_expression, should_ring) VALUES (?, ?)', [cron_expression, false]);
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        res.status(500).send('Error creating alarm');
    }
});

// Update an alarm's ring status
app.put('/alarm/update/:id', async (req, res) => {
    const db = await dbPromise;
    try {
        const { id } = req.params;
        const { should_ring } = req.body;
        const result = await db.run('UPDATE alarms SET should_ring = ? WHERE id = ?', [should_ring, id]);
        if (result.changes) {
            res.status(200).send('Alarm updated successfully');
        } else {
            res.status(404).send('Alarm not found');
        }
    } catch (error) {
        res.status(500).send('Error updating alarm');
    }
});

// Delete an alarm
app.delete('/alarm/delete/:id', async (req, res) => {
    const db = await dbPromise;
    try {
        const { id } = req.params;
        const result = await db.run('DELETE FROM alarms WHERE id = ?', [id]);
        if (result.changes) {
            res.status(200).send('Alarm deleted successfully');
        } else {
            res.status(404).send('Alarm not found');
        }
    } catch (error) {
        res.status(500).send('Error deleting alarm');
    }
});

// Reset all alarms to should_ring = false
app.put('/alarm/reset', async (req, res) => {
    const db = await dbPromise;
    try {
        await db.run('UPDATE alarms SET should_ring = false');
        res.status(200).send('All alarms reset successfully');
    } catch (error) {
        res.status(500).send('Error resetting alarms');
    }
});


const PORT = 3010;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

