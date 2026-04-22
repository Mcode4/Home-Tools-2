const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the project root's .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = function(app) {
  const backendPort = process.env.BACKEND || '8000';
  
  console.log(`Proxying requests to http://localhost:${backendPort}`);

  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://localhost:${backendPort}`,
      changeOrigin: true,
    })
  );
};
