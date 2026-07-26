require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Define Schemas
const machineDataSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    target_basis_weight: Number,
    basis_weight: Number,
    stock_flow: Number,
    steam_pressure: Number,
    machine_speed: Number,
    ambient_humidity: Number,
    filler_flow: Number,       
    moisture: Number,          
    ash: Number,               
    caliper: Number,          
    recipe_limits: String,     
    status: String,
    grade_change_active: Boolean
});
const MachineData = mongoose.model('MachineData', machineDataSchema);

const feedbackSchema = new mongoose.Schema({
    action: String,
    timestamp: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// 3. API Endpoints

// [NEW] Ingestion Endpoint for Live IoT Data
app.post('/api/ingest', async (req, res) => {
    try {
        const newData = new MachineData(req.body);
        await newData.save();
        res.status(201).json({ success: true, message: "Telemetry saved." });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save telemetry data' });
    }
});

// Stream system status (Fetches the last 120 chronological readings for the React chart)
app.get('/api/system-status', async (req, res) => {
    try {
        const data = await MachineData.find().sort({ timestamp: -1 }).limit(120);
        res.json(data.reverse()); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// The Intelligence / Prediction Payload (Still communicates with Python ML service)
app.get('/api/predictions', async (req, res) => {
    try {
        const response = await fetch('http://localhost:8000/analyze');
        
        if (!response.ok) {
            throw new Error(`Python ML Service responded with status: ${response.status}`);
        }
        
        const mlData = await response.json();
        res.json(mlData);
    } catch (error) {
        console.error("[ERROR] Failed to communicate with ML service:", error.message);
        res.status(500).json({ error: "Failed to fetch predictions from Intelligence Layer." });
    }
});



// --- NEW: Command Bridge for Simulator ---
let simulatorCommand = 'HOLD';

// Update your existing feedback endpoint to set the command
app.post('/api/feedback', async (req, res) => {
    try {
        const { action } = req.body;
        const newFeedback = new Feedback({ action });
        await newFeedback.save();
        
        // Forward the UI decision to the Python Simulator
        if (action === 'accept') {
            simulatorCommand = 'ACCEPT';
        } else if (action === 'reject') {
            simulatorCommand = 'REJECT';
        }
        
        console.log(`[DB LOG] Operator ${action.toUpperCase()}ED the recommendation.`);
        res.json({ success: true, message: "Feedback recorded in MongoDB." });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

// Endpoint for the Python Simulator to poll
app.get('/api/command', (req, res) => {
    res.json({ command: simulatorCommand });
    // Reset to HOLD after the simulator reads it
    if (simulatorCommand !== 'HOLD') {
        simulatorCommand = 'HOLD';
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend API running on http://localhost:${PORT}`));