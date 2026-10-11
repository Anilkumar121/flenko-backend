const http = require('http');

let startupError = null;

try {
  // Attempt to load the real application
  require('./server/app.js');
} catch (err) {
  startupError = err;
  console.error('STARTUP ERROR CAUGHT:', err);
}

// Fallback error-reporting server if the app crashed during boot
if (startupError) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <div style="font-family: monospace; padding: 30px; background: #fff1f2; border: 2px solid #e11d48; border-radius: 8px; margin: 20px;">
        <h2 style="color: #be123c;">⚠️ Node.js Backend Startup Error</h2>
        <p><b>Node.js Version:</b> ${process.version}</p>
        <p><b>Current Working Directory:</b> ${process.cwd()}</p>
        <hr style="border: 0; border-top: 1px solid #fecdd3; margin: 20px 0;" />
        <h3>Error Details:</h3>
        <pre style="background: #18181b; color: #f43f5e; padding: 20px; border-radius: 6px; overflow: auto; font-size: 14px;">${startupError.stack || startupError}</pre>
      </div>
    `);
  });
  server.listen(process.env.PORT || 3000);
}
