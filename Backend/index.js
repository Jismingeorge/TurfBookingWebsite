// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import providerRoute from './routes/providerRoute.js';
import adminRoute from './routes/adminRoute.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Use the user routes
app.use('/', userRoutes);
app.use('/provider', providerRoute);
app.use('/admin', adminRoute);
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
