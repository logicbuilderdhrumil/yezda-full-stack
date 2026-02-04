/**
 * Backend Entry Point
 * Initializes HTTP server with Express app and Socket.IO
 */

import { createServer } from 'http';
import app from './app.js';
import { socketService } from './services/socket.service.js';
import { shutdownAccessErrorLimiter } from './middleware/error.middleware.js';

const PORT = process.env.PORT || 3000;

// Create HTTP server to share with Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO
socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  shutdownAccessErrorLimiter();
  await socketService.shutdown();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  shutdownAccessErrorLimiter();
  await socketService.shutdown();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
