// Auth Email Templates: Password Reset, OTP, Organization Invitation

import { PasswordResetData, OTPData, getBaseUrl } from '../email-types'

/** Generates the HTML for a password reset email */
export function getPasswordResetHTML(data: PasswordResetData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu - SmartBuild</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">

              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 40px 30px 40px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                    <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 1px;">🏗️ SMARTBUILD</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔐 Đặt Lại Mật Khẩu</h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Xin chào <strong style="color: #2563eb;">${data.name}</strong>,
                  </p>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới:
                  </p>

                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 10px 0 30px 0;">
                        <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                          🔑 Đặt Lại Mật Khẩu Ngay
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 12px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>⏱️ Lưu ý quan trọng:</strong><br>
                          • Link có hiệu lực trong <strong>1 giờ</strong><br>
                          • Chỉ sử dụng được 1 lần<br>
                          • Nếu bạn không yêu cầu, vui lòng bỏ qua email này
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternative Link -->
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; word-break: break-all;">
                    Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
                    <a href="${data.resetLink}" style="color: #2563eb; text-decoration: underline;">${data.resetLink}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                          Cần hỗ trợ? Liên hệ với chúng tôi
                        </p>
                        <p style="color: #2563eb; font-size: 14px; font-weight: 600; margin: 0 0 15px 0;">
                          📞 Hotline: 1900-xxxx | ✉️ support@smartbuild.com
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © 2024 SmartBuild - Vật Liệu Xây Dựng Thông Minh<br>
                          123 Nguyễn Văn Linh, Biên Hòa, Đồng Nai
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/** Generates the HTML for an OTP verification email */
 
export function getOTPHTML(data: OTPData): string {
    const titleMap: Record<string, string> = {
        VERIFICATION: 'Xác Minh Tài Khoản',
        '2FA': 'Xác Nhận Đăng Nhập',
        CHANGE_PROFILE: 'Xác Nhận Thay Đổi'
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🛡️ ${titleMap[data.type] || 'Xác Thực'}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px; text-align: center;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Xin chào <strong>${data.name}</strong>,</p>
                  <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0;">Sử dụng mã dưới đây để hoàn tất quá trình xác thực:</p>
                  <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
                    <span style="font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 12px; margin-left: 12px; display: block;">${data.otpCode}</span>
                  </div>
                  <p style="color: #9ca3af; font-size: 14px; margin: 0;">Mã có hiệu lực trong <strong>${data.expiresInMinutes || 10} phút</strong>.</p>
                  <p style="color: #ef4444; font-size: 12px; margin-top: 20px;">* Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 SmartBuild - Vật Liệu Xây Dựng Thông Minh</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/** Generates the HTML for an organization invitation email */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOrganizationInvitationHTML(data: any): string {
    const roleLabel = data.role === 'ADMIN' ? 'Quản trị viên' : data.role === 'OWNER' ? 'Chủ sở hữu' : 'Người mua hàng (Buyer)'

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
      <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🏢 Lời Mời Tham Gia Tổ Chức</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">Xin chào,</p>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
              Bạn đã được mời tham gia tổ chức <strong>${data.organizationName}</strong> trên hệ thống <strong>SmartBuild</strong> bởi thành viên <strong>${data.inviterName}</strong>.
            </p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #64748b; font-size: 14px; padding-bottom: 5px;">Vai trò của bạn:</td>
                  <td style="color: #1d4ed8; font-weight: 700; text-align: right;">${roleLabel}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 14px;">Tổ chức:</td>
                  <td style="color: #1e293b; font-weight: 600; text-align: right;">${data.organizationName}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
              Vui lòng nhấn vào nút bên dưới để hoàn tất việc đăng ký tài khoản và gia nhập đội ngũ.
            </p>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${data.registerLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 16px 45px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                Chấp Nhận Lời Mời &amp; Đăng Ký
              </a>
            </div>

            <p style="font-size: 13px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              * Link này có hiệu lực trong vòng 7 ngày. Nếu bạn không thực hiện đăng ký, lời mời sẽ bị hủy bỏ.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            SmartBuild - Hệ thống quản lý vật liệu xây dựng thông minh
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
