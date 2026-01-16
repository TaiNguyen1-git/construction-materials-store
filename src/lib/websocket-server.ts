// WebSocket server for real-time notifications
// This would typically be run as a separate service in production

import { WebSocketServer, WebSocket } from 'ws'
import { prisma } from './prisma'

// Type definitions
interface WebSocketWithUserId extends WebSocket {
  userId?: string
}

interface NotificationMessage {
  type: string
  payload: any
}

class NotificationWebSocketServer {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocketWithUserId> = new Set()

  // Start the WebSocket server
  start(port: number = 8080) {
    this.wss = new WebSocketServer({ port })
    
    this.wss.on('connection', (ws: WebSocketWithUserId) => {
      this.clients.add(ws)
      
      ws.on('message', async (message: string) => {
        try {
          const data: any = JSON.parse(message.toString())
          
          // Handle authentication
          if (data.type === 'authenticate') {
            ws.userId = data.userId
            ws.send(JSON.stringify({ type: 'authenticated', success: true }))
          }
          
          // Handle other message types
          await this.handleMessage(ws, data)
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
        }
      })
      
      ws.on('close', () => {
        this.clients.delete(ws)
      })
      
      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })
    })
    
  }
  
  // Stop the WebSocket server
  stop() {
    if (this.wss) {
      this.wss.close()
      this.wss = null
      this.clients.clear()
    }
  }
  
  // Handle incoming messages
  private async handleMessage(ws: WebSocketWithUserId, data: any) {
    switch (data.type) {
      case 'subscribe':
        // Handle subscription requests
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }))
        break
        
      case 'unsubscribe':
        // Handle unsubscribe requests
        ws.send(JSON.stringify({ type: 'unsubscribed', channel: data.channel }))
        break
        
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
    }
  }
  
  // Send notification to a specific user
  async sendToUser(userId: string, notification: any) {
    // In a real implementation, we would store user connections in a map
    // For now, we'll broadcast to all connected clients
    this.broadcast({
      type: 'notification',
      payload: notification
    })
  }
  
  // Broadcast message to all connected clients
  broadcast(message: NotificationMessage) {
    const messageString = JSON.stringify(message)
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString)
      }
    })
  }
  
  // Send stock update notification
  async sendStockUpdate(productId: string, currentStock: number, previousStock: number) {
    try {
      // Get product information
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          sku: true
        }
      })
      
      if (!product) {
        console.error('Product not found for stock update notification')
        return
      }
      
      const message: NotificationMessage = {
        type: 'stock_update',
        payload: {
          productId,
          productName: product.name,
          sku: product.sku,
          currentStock,
          previousStock,
          timestamp: new Date().toISOString()
        }
      }
      
      this.broadcast(message)
    } catch (error) {
      console.error('Error sending stock update notification:', error)
    }
  }
  
  // Send low stock alert
  async sendLowStockAlert(productId: string, currentStock: number, minStockLevel: number) {
    try {
      // Get product information
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          sku: true
        }
      })
      
      if (!product) {
        console.error('Product not found for low stock alert')
        return
      }
      
      const message: NotificationMessage = {
        type: 'low_stock_alert',
        payload: {
          productId,
          productName: product.name,
          sku: product.sku,
          currentStock,
          minStockLevel,
          alertType: currentStock <= 0 ? 'out_of_stock' : 'low_stock',
          timestamp: new Date().toISOString()
        }
      }
      
      this.broadcast(message)
    } catch (error) {
      console.error('Error sending low stock alert:', error)
    }
  }
}

// Export singleton instance
export const notificationWebSocketServer = new NotificationWebSocketServer()

// For development, you might want to start the server automatically
if (process.env.NODE_ENV === 'development') {
  // Uncomment the following line to start the WebSocket server in development
  // notificationWebSocketServer.start(8080)
}