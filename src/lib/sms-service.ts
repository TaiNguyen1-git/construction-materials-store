/**
 * Notification Sender Service
 * Uses Telegram Bot API as a 100% FREE alternative for SMS/Zalo.
 * 
 * HƯỚNG DẪN CÀI ĐẶT TELEGRAM BOT (Miễn phí 100%):
 * 1. Mở Telegram, tìm kiếm "@BotFather" và gõ /newbot để tạo 1 con bot mới.
 * 2. Copy mã HTTP API Token (TELEGRAM_BOT_TOKEN) mà BotFather cấp.
 * 3. Tìm kiếm "@userinfobot" trên Telegram và nhấn Start để lấy Personal Chat ID của bạn (TELEGRAM_CHAT_ID).
 * 4. Nhắn tin bất kỳ cho con bot bạn vừa tạo (để kích hoạt cửa sổ chat).
 * 5. Thêm 2 dòng này vào file .env của dự án:
 *    TELEGRAM_BOT_TOKEN=mã_token_của_bạn
 *    TELEGRAM_CHAT_ID=id_của_bạn
 */

export interface SendMessageOptions {
    message: string
    phone?: string // Vẫn nhận để tương thích interface cũ
}

class NotificationSender {
    private readonly TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    private readonly TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    /**
     * Gửi thông báo qua Telegram (Miễn phí 100%)
     * Hoàn toàn thay thế cho SMS/Zalo nếu không có kinh phí.
     */
    async sendTelegramMessage({ message, phone }: SendMessageOptions): Promise<boolean> {
        if (!this.TELEGRAM_BOT_TOKEN || !this.TELEGRAM_CHAT_ID) {
            console.warn(`[NotificationSender] Chưa cấu hình Telegram! Đáng lẽ sẽ gửi text: "${message}" cho SĐT: ${phone || 'admin'}`)
            return false
        }

        try {
            const formattedMessage = `🔔 *Hệ thống SmartBuild*\n\n${message}`

            const url = `https://api.telegram.org/bot${this.TELEGRAM_BOT_TOKEN}/sendMessage`
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: this.TELEGRAM_CHAT_ID,
                    text: formattedMessage,
                    parse_mode: 'Markdown'
                })
            })

            const data = await response.json()
            if (!data.ok) {
                throw new Error(`Telegram API Error: ${data.description}`)
            }

            console.log(`[NotificationSender] Đã bắn tin nhắn Telegram thành công`)
            return true
        } catch (error) {
            console.error('[NotificationSender] Lỗi gửi Telegram:', error)
            return false
        }
    }

    // --- STUBS CHO CÁC DỊCH VỤ TRẢ PHÍ (Dành cho tương lai nếu bạn nâng cấp) ---

    async sendSMS({ phone, message }: SendMessageOptions): Promise<boolean> {
        // Chuyển hướng SMS sang Telegram vì đang dùng free
        console.log(`[SMS] Chuyển hướng SMS của ${phone} sang Telegram...`)
        return this.sendTelegramMessage({ message, phone })
    }

    async sendZaloZNS({ phone, templateId, templateData }: any): Promise<boolean> {
        // Chuyển hướng Zalo ZNS sang Telegram vì đang dùng free
        console.log(`[Zalo ZNS] Chuyển hướng thông báo của ${phone} sang Telegram...`)
        let msg = `[Zalo Data]\n`
        for (const [key, val] of Object.entries(templateData)) {
            msg += `- ${key}: ${val}\n`
        }
        return this.sendTelegramMessage({ message: msg, phone })
    }
}

export const notificationSender = new NotificationSender()
