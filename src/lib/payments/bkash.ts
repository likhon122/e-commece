import axios from "axios";

const BKASH_BASE_URL =
  process.env.BKASH_IS_SANDBOX === "true"
    ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    : "https://tokenized.pay.bka.sh/v1.2.0-beta";

let bkashToken: string | null = null;
let tokenExpiry: number = 0;

interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

const getBkashToken = async (): Promise<string | null> => {
  // Return cached token if still valid
  if (bkashToken && Date.now() < tokenExpiry) {
    return bkashToken;
  }

  try {
    const response = await axios.post<BkashTokenResponse>(
      `${BKASH_BASE_URL}/tokenized/checkout/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD,
        },
      },
    );

    if (response.data.statusCode === "0000") {
      bkashToken = response.data.id_token;
      tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 min before expiry
      return bkashToken;
    }

    console.error("bKash token error:", response.data.statusMessage);
    return null;
  } catch (error) {
    console.error("bKash token request error:", error);
    return null;
  }
};

export interface BkashCreatePaymentData {
  amount: string;
  payerReference: string;
  callbackURL: string;
  merchantInvoiceNumber: string;
  merchantAssociationInfo?: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export const createBkashPayment = async (
  data: BkashCreatePaymentData,
): Promise<BkashCreatePaymentResponse | null> => {
  const token = await getBkashToken();
  if (!token) return null;

  try {
    const response = await axios.post<BkashCreatePaymentResponse>(
      `${BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        mode: "0011",
        payerReference: data.payerReference,
        callbackURL: data.callbackURL,
        amount: data.amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: data.merchantInvoiceNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": process.env.BKASH_APP_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("bKash create payment error:", error);
    return null;
  }
};

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  payerReference: string;
  customerMsisdn: string;
  trxID: string;
  amount: string;
  transactionStatus: string;
  paymentExecuteTime: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

export const executeBkashPayment = async (
  paymentID: string,
): Promise<BkashExecutePaymentResponse | null> => {
  const token = await getBkashToken();
  if (!token) return null;

  try {
    const response = await axios.post<BkashExecutePaymentResponse>(
      `${BKASH_BASE_URL}/tokenized/checkout/execute`,
      { paymentID },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": process.env.BKASH_APP_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("bKash execute payment error:", error);
    return null;
  }
};

export interface BkashQueryPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  mode: string;
  payerReference: string;
  paymentCreateTime: string;
  amount: string;
  currency: string;
  intent: string;
  transactionStatus: string;
  trxID: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
}

export const queryBkashPayment = async (
  paymentID: string,
): Promise<BkashQueryPaymentResponse | null> => {
  const token = await getBkashToken();
  if (!token) return null;

  try {
    const response = await axios.post<BkashQueryPaymentResponse>(
      `${BKASH_BASE_URL}/tokenized/checkout/payment/status`,
      { paymentID },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": process.env.BKASH_APP_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("bKash query payment error:", error);
    return null;
  }
};

export interface BkashRefundResponse {
  statusCode: string;
  statusMessage: string;
  originalTrxID: string;
  refundTrxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  refundCharge: string;
  completedTime: string;
}

export const refundBkashPayment = async (
  paymentID: string,
  trxID: string,
  amount: string,
  reason: string,
): Promise<BkashRefundResponse | null> => {
  const token = await getBkashToken();
  if (!token) return null;

  try {
    const response = await axios.post<BkashRefundResponse>(
      `${BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
      {
        paymentID,
        trxID,
        amount,
        reason,
        sku: "refund",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": process.env.BKASH_APP_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("bKash refund error:", error);
    return null;
  }
};
