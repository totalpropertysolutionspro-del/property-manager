const express = require('express');
const app = express();

// Add the dynamic model selection middleware
app.use(require('../middleware.js'));

// API endpoint for processing queries
app.post('/api/query', (req, res) => {
    const model = req.model; // Get the specified model
    // Logic to process the query should be added here
    res.send('Processed with model: ' + model);
});

app.listen(5001, () => {
    console.log('Backend server running on port 5001');
});
