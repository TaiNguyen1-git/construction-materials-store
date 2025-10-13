#!/usr/bin/env tsx
/**
 * Script to start the WebSocket notification server
 */

import { notificationWebSocketServer } from '../src/lib/websocket-server'

const PORT = parseInt(process.env.WEBSOCKET_PORT || '8080', 10)

console.log('Starting WebSocket notification server...')

try {
  notificationWebSocketServer.start(PORT)
  console.log(`WebSocket server started on port ${PORT}`)
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down WebSocket server...')
    notificationWebSocketServer.stop()
    process.exit(0)
  })
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down WebSocket server...')
    notificationWebSocketServer.stop()
    process.exit(0)
  })
} catch (error) {
  console.error('Failed to start WebSocket server:', error)
  process.exit(1)
}