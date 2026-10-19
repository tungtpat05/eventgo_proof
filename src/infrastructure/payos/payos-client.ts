import { PayOS } from '@payos/node';
import QRCode from 'qrcode';

// Thông tin tài khoản thụ hưởng MB Bank chính thức
export const BENEFICIARY_BANK = {
  bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
  bankBin: '970422',
  accountNumber: '011120057777',
  accountName: 'NGUYEN THANH TUNG',
};

// Read PayOS credentials from environment variables
const clientId = process.env.PAYOS_CLIENT_ID || '';
const apiKey = process.env.PAYOS_API_KEY || '';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

export const isPayOSConfigured = Boolean(
  process.env.PAYOS_CLIENT_ID &&
  process.env.PAYOS_API_KEY &&
  process.env.PAYOS_CHECKSUM_KEY
);

// Initialize PayOS client
export const payOS = new PayOS({ clientId, apiKey, checksumKey });

export interface CreatePaymentLinkRequest {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentLinkResult {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  amount: number;
  status: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  description: string;
}

export async function createPayOSPaymentLink(
  request: CreatePaymentLinkRequest
): Promise<PaymentLinkResult> {
  if (!isPayOSConfigured) {
    const fallbackQr = `https://img.vietqr.io/image/${BENEFICIARY_BANK.bankBin}-${BENEFICIARY_BANK.accountNumber}-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(
      request.description
    )}&accountName=${encodeURIComponent(BENEFICIARY_BANK.accountName)}`;

    return {
      checkoutUrl: `/settings/billing?orderCode=${request.orderCode}&amount=${request.amount}`,
      qrCode: fallbackQr,
      orderCode: request.orderCode,
      amount: request.amount,
      status: 'PENDING',
      accountNumber: BENEFICIARY_BANK.accountNumber,
      accountName: BENEFICIARY_BANK.accountName,
      bin: BENEFICIARY_BANK.bankBin,
      bankName: BENEFICIARY_BANK.bankName,
      description: request.description,
    };
  }

  try {
    const paymentLinkRes = await payOS.paymentRequests.create({
      orderCode: request.orderCode,
      amount: request.amount,
      description: request.description.slice(0, 25), // PayOS allows max 25 chars for description
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
      items: request.items,
      buyerName: request.buyerName,
      buyerEmail: request.buyerEmail,
    });

    // PayOS returns the VietQR string (e.g. 0002010102123857...). Convert to data URL image
    let qrImage = paymentLinkRes.qrCode;
    if (paymentLinkRes.qrCode && !paymentLinkRes.qrCode.startsWith('http') && !paymentLinkRes.qrCode.startsWith('data:')) {
      qrImage = await QRCode.toDataURL(paymentLinkRes.qrCode, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: 'M',
      });
    }

    return {
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: qrImage,
      orderCode: paymentLinkRes.orderCode,
      amount: paymentLinkRes.amount,
      status: paymentLinkRes.status,
      accountNumber: paymentLinkRes.accountNumber || BENEFICIARY_BANK.accountNumber,
      accountName: paymentLinkRes.accountName || BENEFICIARY_BANK.accountName,
      bin: paymentLinkRes.bin || BENEFICIARY_BANK.bankBin,
      bankName: BENEFICIARY_BANK.bankName,
      description: paymentLinkRes.description || request.description,
    };
  } catch (error: any) {
    console.error('PayOS paymentRequests.create error:', error);
    throw new Error(`Lỗi tạo cổng thanh toán PayOS: ${error.message || 'Không xác định'}`);
  }
}

export async function getPayOSPaymentLinkInformation(orderCode: number | string) {
  if (!isPayOSConfigured) {
    return null;
  }
  try {
    const paymentLink = await payOS.paymentRequests.get(Number(orderCode));
    return paymentLink;
  } catch (error: any) {
    console.error('getPayOSPaymentLinkInformation error:', error?.message || error);
    return null;
  }
}

export async function verifyPayOSWebhookData(webhookBody: any) {
  if (!isPayOSConfigured) {
    return webhookBody?.data;
  }
  return payOS.webhooks.verify(webhookBody);
}
