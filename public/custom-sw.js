self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const targetUrl = data.url || '/admin/messages'
        
        const options = {
            body: data.body,
            icon: data.icon || '/images/smartbuild_bot.png',
            badge: '/manifest-icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                url: targetUrl
            },
            actions: [
                { action: 'open', title: 'Xem ngay' },
                { action: 'close', title: 'Đóng' }
            ]
        }

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
                // Check if any window is already open and focused on the target conversation
                const isAlreadyVisible = windowClients.some(client => {
                    // Use visibilityState instead of focused (focused is false if DevTools is open)
                    if (client.visibilityState !== 'visible') return false;
                    
                    try {
                        const clientUrl = new URL(client.url);
                        // If they are anywhere in /admin/messages, suppress OS notifications
                        // because they will see the in-app unread badges anyway.
                        return clientUrl.pathname.includes('/admin/messages');
                    } catch (e) {
                        return client.url.includes('/admin/messages');
                    }
                });

                if (isAlreadyVisible) {
                    console.log('[SW] Notification suppressed: User is already viewing the messages page.');
                    return;
                }

                return self.registration.showNotification(data.title, options);
            })
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
