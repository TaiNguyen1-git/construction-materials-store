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
                const isAlreadyFocused = windowClients.some(client => {
                    try {
                        const clientUrl = new URL(client.url);
                        const notificationUrl = new URL(targetUrl, self.location.origin);
                        
                        // 1. Check if the base path matches
                        const pathMatches = clientUrl.pathname === notificationUrl.pathname;
                        
                        // 2. Check if the conversation ID matches
                        const clientParams = new URLSearchParams(clientUrl.search);
                        const notificationParams = new URLSearchParams(notificationUrl.search);
                        
                        const clientConvId = clientParams.get('id');
                        const notificationConvId = notificationParams.get('id');
                        
                        const idMatches = clientConvId === notificationConvId;

                        // If it's the same path, same conversation ID, and the tab is focused, suppress
                        return pathMatches && idMatches && client.focused;
                    } catch (e) {
                        return client.url.includes(targetUrl) && client.focused;
                    }
                });

                if (isAlreadyFocused) {
                    console.log('[SW] Notification suppressed: User is already focused on this specific conversation.');
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
