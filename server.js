const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Remove query strings
    filePath = filePath.split('?')[0];
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found, try index.html for SPA
                fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content);
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║          🎮 POKIWAR PWA SERVER                 ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Server is running at:                         ║
║  http://localhost:${PORT}                          ║
║                                                ║
║  Open this URL in your browser to:             ║
║  • Play the game                               ║
║  • Install as PWA (Add to Home Screen)         ║
║                                                ║
║  Press Ctrl+C to stop the server               ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
});
