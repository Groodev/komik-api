// Vercel serverless handler using serverless-http
const serverless = require('serverless-http');
const app = require('../index.js');

// Export the serverless handler
module.exports = serverless(app);
