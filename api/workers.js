const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Proxy the request to the actual API
    const apiUrl = 'http://128.24.65.53:3000/workers';
    
    // Choose the right protocol
    const requester = apiUrl.startsWith('https') ? https : http;
    
    return new Promise((resolve, reject) => {
      const proxyReq = requester.get(apiUrl, (proxyRes) => {
        // Set status code
        res.status(proxyRes.statusCode);
        
        // Forward response headers
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        
        // Stream response
        let data = '';
        proxyRes.on('data', (chunk) => {
          data += chunk;
        });
        
        proxyRes.on('end', () => {
          res.send(data);
          resolve();
        });
      });
      
      proxyReq.on('error', (error) => {
        console.error('Proxy request error:', error);
        res.status(500).json({ error: 'Failed to fetch data from API' });
        resolve();
      });
      
      proxyReq.end();
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 