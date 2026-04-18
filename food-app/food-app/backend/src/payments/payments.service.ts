import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // MoMo Payment
  async createMoMoPayment(orderId: string, amount: number, orderInfo: string) {
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    
    if (!accessKey || !secretKey || !partnerCode) {
      throw new InternalServerErrorException('Thiếu cấu hình MoMo Secret Key');
    }

    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/result';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:4000/payments/momo/callback';
    const requestType = 'payWithMethod';
    const requestId = orderId;
    const extraData = '';
    const orderGroupId = '';
    const autoCapture = true;
    const lang = 'vi';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: 'Food App',
      storeId: 'FoodStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    };

    try {
      const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MoMo API Error:', error);
      throw new Error('Không thể tạo thanh toán MoMo');
    }
  }

  // VNPay Payment
  async createVNPayPayment(orderId: string, amount: number, orderInfo: string, ipAddr: string) {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECRET_KEY;
    
    if (!tmnCode || !secretKey) {
      throw new InternalServerErrorException('Thiếu cấu hình VNPay Secret Key');
    }

    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/result';

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000));

    const vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    sortedParams.vnp_SecureHash = signed;
    const paymentUrl = vnpUrl + '?' + new URLSearchParams(sortedParams).toString();

    return { paymentUrl };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  async handleMoMoCallback(body: any) {
    // Verify signature
    const { orderId, resultCode, message } = body;
    
    if (resultCode === 0) {
      // Payment success
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
      return { success: true, message: 'Thanh toán thành công' };
    } else {
      return { success: false, message: message || 'Thanh toán thất bại' };
    }
  }

  async verifyVNPayCallback(query: any) {
    const vnp_SecureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = this.sortObject(query);
    const secretKey = process.env.VNPAY_SECRET_KEY;
    
    if (!secretKey) {
      throw new InternalServerErrorException('Thiếu cấu hình VNPay Secret Key');
    }

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (vnp_SecureHash === signed) {
      const orderId = query.vnp_TxnRef;
      const responseCode = query.vnp_ResponseCode;

      if (responseCode === '00') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
        });
        return { success: true, message: 'Thanh toán thành công' };
      } else {
        return { success: false, message: 'Thanh toán thất bại' };
      }
    } else {
      return { success: false, message: 'Chữ ký không hợp lệ' };
    }
  }

  // SePay Payment
  async createSepayPayment(orderId: string, amount: number) {
    const bankName = process.env.SEPAY_BANK_NAME || 'MBBank';
    const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || '';
    
    const shortCode = orderId.substring(orderId.length - 8).toUpperCase();
    const content = `HOANG${shortCode}`;
    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${content}&accountName=HOANG%20FOOD`;
    
    return {
      success: true,
      qrUrl,
      bankName,
      accountNumber,
      content,
    };
  }

  async handleSepayWebhook(body: any, authHeader?: string) {
    const apiToken = process.env.SEPAY_API_KEY;
    if (apiToken && (!authHeader || !authHeader.includes(apiToken))) {
      return { success: false, message: 'Unauthorized' };
    }

    if (body.transferType !== 'in' || body.transferAmount <= 0) {
      return { success: false, message: 'Not an incoming transfer' };
    }

    const content = (body.content || '').toUpperCase();
    
    // Find checking orders that are PENDING
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PENDING'] },
      }
    });

    let matchedOrder = null;
    for (const order of orders) {
      const shortCode = order.id.substring(order.id.length - 8).toUpperCase();
      if (content.includes(`HOANG${shortCode}`)) {
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrder) {
      return { success: false, message: 'Order not found for content' };
    }

    if (body.transferAmount < matchedOrder.total) { 
       return { success: false, message: 'Transfer amount is less than order total' };
    }

    await this.prisma.order.update({
      where: { id: matchedOrder.id },
      data: { status: 'CONFIRMED' },
    });

    return { success: true, message: 'Xác nhận thanh toán thành công' };
  }
}
