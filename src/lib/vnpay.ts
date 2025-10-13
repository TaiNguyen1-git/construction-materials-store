import crypto from 'crypto'
import querystring from 'querystring'

export interface VNPayConfig {
  vnpUrl: string
  tmnCode: string
  hashSecret: string
  returnUrl: string
}

export class VNPayService {
  private config: VNPayConfig

  constructor(config?: Partial<VNPayConfig>) {
    this.config = {
      vnpUrl: config?.vnpUrl || process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      tmnCode: config?.tmnCode || process.env.VNPAY_TMN_CODE || '',
      hashSecret: config?.hashSecret || process.env.VNPAY_HASH_SECRET || '',
      returnUrl: config?.returnUrl || process.env.VNPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/vnpay/return`,
    }
  }

  createPaymentUrl(orderId: string, amount: number, orderInfo: string, ipAddr: string): string {
    const date = new Date()
    const createDate = this.formatDate(date)
    
    let vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (amount * 100).toString(), // VNPay requires amount in smallest currency unit
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    }

    // Sort params
    vnpParams = this.sortObject(vnpParams)

    // Create signature
    const signData = querystring.stringify(vnpParams, { encode: false })
    const hmac = crypto.createHmac('sha512', this.config.hashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
    vnpParams['vnp_SecureHash'] = signed

    // Create payment URL
    const paymentUrl = this.config.vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false })
    
    return paymentUrl
  }

  verifyReturnUrl(vnpParams: Record<string, string>): { isValid: boolean; message: string } {
    const secureHash = vnpParams['vnp_SecureHash']
    delete vnpParams['vnp_SecureHash']
    delete vnpParams['vnp_SecureHashType']

    const sortedParams = this.sortObject(vnpParams)
    const signData = querystring.stringify(sortedParams, { encode: false })
    const hmac = crypto.createHmac('sha512', this.config.hashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    if (secureHash === signed) {
      const responseCode = vnpParams['vnp_ResponseCode']
      if (responseCode === '00') {
        return { isValid: true, message: 'Payment successful' }
      } else {
        return { isValid: false, message: `Payment failed with code: ${responseCode}` }
      }
    } else {
      return { isValid: false, message: 'Invalid signature' }
    }
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {}
    const keys = Object.keys(obj).sort()
    keys.forEach(key => {
      sorted[key] = obj[key]
    })
    return sorted
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }
}

export const vnPayService = new VNPayService()
