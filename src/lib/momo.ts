import crypto from 'crypto'
import axios from 'axios'

export interface MoMoConfig {
  partnerCode: string
  accessKey: string
  secretKey: string
  endpoint: string
  returnUrl: string
  notifyUrl: string
}

export class MoMoService {
  private config: MoMoConfig

  constructor(config?: Partial<MoMoConfig>) {
    this.config = {
      partnerCode: config?.partnerCode || process.env.MOMO_PARTNER_CODE || '',
      accessKey: config?.accessKey || process.env.MOMO_ACCESS_KEY || '',
      secretKey: config?.secretKey || process.env.MOMO_SECRET_KEY || '',
      endpoint: config?.endpoint || process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl: config?.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/momo/return`,
      notifyUrl: config?.notifyUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/momo/notify`,
    }
  }

  async createPayment(orderId: string, amount: number, orderInfo: string): Promise<{ payUrl: string; deeplink: string }> {
    const requestId = `${orderId}-${Date.now()}`
    const requestType = 'captureWallet'
    const extraData = '' // Optional

    // Create raw signature
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.config.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.returnUrl}&requestId=${requestId}&requestType=${requestType}`

    // Generate signature
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex')

    // Request body
    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: 'SmartBuild',
      storeId: 'SmartBuild',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.config.returnUrl,
      ipnUrl: this.config.notifyUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    }

    try {
      const response = await axios.post(this.config.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { payUrl, deeplink } = response.data

      if (!payUrl) {
        throw new Error('Failed to create MoMo payment')
      }

      return { payUrl, deeplink }
    } catch (error) {
      console.error('MoMo payment creation error:', error)
      throw error
    }
  }

  verifySignature(params: Record<string, any>): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = params

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

    const calculatedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex')

    return signature === calculatedSignature
  }
}

export const momoService = new MoMoService()
