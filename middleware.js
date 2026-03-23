const express = require('express');
const app = express();

app.use(express.json()); // Ensure you are parsing JSON requests

app.use((req, res, next) => {
    const query = req.body.query; // Extract query from request
    // Logic to determine which model to use
    const modelToUse = query.isSimple ? '5.4-mini' : 'gpt-4o-mini'; 
    req.model = modelToUse; // Assign the chosen model to request
    next();
});

// Example endpoint
app.post('/api/query', (req, res) => {
    const model = req.model; // Get model
    // Process the query using the specified model
    res.send('Processed with model: ' + model); 
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
