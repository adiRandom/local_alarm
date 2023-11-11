const express = require('express');

const app = express();
app.use(express.json());

// In-memory variable
let shouldRing = false;

// Endpoint to set the should_ring value
app.post('/alarm/set', (req, res) => {
    const { ring } = req.body;
    shouldRing = ring;
    res.sendStatus(204);
});

// Endpoint to get the should_ring value
app.get('/alarm/status', (req, res) => {
    res.status(200).json({ shouldRing });
});

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
