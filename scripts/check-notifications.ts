/**
 * Check Notifications Script
 * 
 * Chạy script này để check tất cả notifications
 * Nên chạy mỗi ngày qua cron job
 * 
 * Run: npm run check:notifications
 */

import { PrismaClient } from '@prisma/client'
import {
  getAllNotifications,
  sendNotification,
  type Notification
} from '../src/lib/notification-service'

const prisma = new PrismaClient()

async function checkNotifications() {
  console.log('🔔 Checking Notifications...\n')
  console.log('='.repeat(70))

  try {
    // Get all notifications
    const notifications = await getAllNotifications()

    if (notifications.length === 0) {
      console.log('✅ Không có thông báo mới!\n')
      return
    }

    console.log(`📬 Tìm thấy ${notifications.length} thông báo:\n`)

    // Group by priority
    const high = notifications.filter(n => n.priority === 'HIGH')
    const medium = notifications.filter(n => n.priority === 'MEDIUM')
    const low = notifications.filter(n => n.priority === 'LOW')

    // Display HIGH priority first
    if (high.length > 0) {
      console.log('🔴 HIGH PRIORITY:')
      high.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`)
        console.log(`   ${n.message}\n`)
      })
    }

    // Display MEDIUM priority
    if (medium.length > 0) {
      console.log('🟡 MEDIUM PRIORITY:')
      medium.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`)
        console.log(`   ${n.message}\n`)
      })
    }

    // Display LOW priority
    if (low.length > 0) {
      console.log('🟢 LOW PRIORITY:')
      low.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`)
        console.log(`   ${n.message}\n`)
      })
    }

    console.log('='.repeat(70))
    console.log('📊 SUMMARY:')
    console.log(`   HIGH: ${high.length}`)
    console.log(`   MEDIUM: ${medium.length}`)
    console.log(`   LOW: ${low.length}`)
    console.log(`   TOTAL: ${notifications.length}\n`)

    // Send notifications
    console.log('📤 Sending notifications...')
    for (const notification of notifications) {
      await sendNotification(notification)
    }
    console.log('✅ All notifications sent!\n')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run
checkNotifications()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
