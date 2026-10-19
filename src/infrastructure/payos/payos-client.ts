import { PayOS } from '@payos/node';

// Read PayOS credentials from environment variables
const clientId = process.env.PAYOS_CLIENT_ID || 'demo-client-id';
const apiKey = process.env.PAYOS_API_KEY || 'demo-api-key';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'demo-checksum-key';

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
}

export async function createPayOSPaymentLink(
  request: CreatePaymentLinkRequest
): Promise<PaymentLinkResult> {
  if (!isPayOSConfigured) {
    // Return mock payment link for sandbox / prototyping if keys aren't set yet
    const mockOrderCode = request.orderCode;
    const mockQr = `https://img.vietqr.io/image/970422-000123456789-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(
      request.description
    )}`;
    return {
      checkoutUrl: `/settings/billing?mock_pay_order=${mockOrderCode}&amount=${request.amount}`,
      qrCode: mockQr,
      orderCode: mockOrderCode,
      amount: request.amount,
      status: 'PENDING',
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
    });

    return {
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode,
      orderCode: paymentLinkRes.orderCode,
      amount: paymentLinkRes.amount,
      status: paymentLinkRes.status,
    };
  } catch (error: any) {
    console.error('PayOS paymentRequests.create error:', error);
    throw new Error(`Lỗi tạo cổng thanh toán PayOS: ${error.message || 'Không xác định'}`);
  }
}

export async function verifyPayOSWebhookData(webhookBody: any) {
  if (!isPayOSConfigured) {
    return webhookBody?.data;
  }
  return payOS.webhooks.verify(webhookBody);
}
