self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || '/images/smartbuild_bot.png',
            badge: '/manifest-icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/admin/messages'
            },
            actions: [
                { action: 'open', title: 'Xem ngay' },
                { action: 'close', title: 'Đóng' }
            ]
        }

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        )
    }
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    if (event.action === 'close') return

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window open with this URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i]
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus()
                }
            }
            // If no window found, open a new one
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url)
            }
        })
    )
})
