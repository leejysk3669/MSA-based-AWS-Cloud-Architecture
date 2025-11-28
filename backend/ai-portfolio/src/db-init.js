require('dotenv').config();

// In-memory storage initialization
console.log('Initializing in-memory storage for AI Portfolio service...');

// Initialize empty arrays for in-memory storage
global.portfolioMetadata = [];
global.feedbackHistory = [];

console.log('In-memory storage initialized successfully.');
console.log('Note: Data will be lost when the server restarts.');
