import axios from "axios";

const SSLCOMMERZ_BASE_URL =
  process.env.SSLCOMMERZ_IS_SANDBOX === "true"
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";

interface SSLCommerzInitData {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  cus_city: string;
  cus_postcode: string;
  cus_country: string;
  shipping_method: string;
  num_of_item: number;
  product_name: string;
  product_category: string;
  product_profile: string;
}

interface SSLCommerzInitResponse {
  status: string;
  faession?: string;
  GatewayPageURL?: string;
  sessionkey?: string;
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  desc?: string[];
}

export const initSSLCommerz = async (
  data: SSLCommerzInitData,
): Promise<SSLCommerzInitResponse | null> => {
  try {
    const formData = new URLSearchParams();
    formData.append("store_id", process.env.SSLCOMMERZ_STORE_ID || "");
    formData.append(
      "store_passwd",
      process.env.SSLCOMMERZ_STORE_PASSWORD || "",
    );

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await axios.post(
      `${SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("SSLCommerz init error:", error);
    return null;
  }
};

export interface SSLCommerzValidationResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  verify_sign: string;
  verify_key: string;
  risk_level: string;
  risk_title: string;
}

export const validateSSLCommerzPayment = async (
  validationId: string,
): Promise<SSLCommerzValidationResponse | null> => {
  try {
    const response = await axios.get(
      `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php`,
      {
        params: {
          val_id: validationId,
          store_id: process.env.SSLCOMMERZ_STORE_ID,
          store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
          format: "json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("SSLCommerz validation error:", error);
    return null;
  }
};

export const refundSSLCommerzPayment = async (
  bankTranId: string,
  refundAmount: number,
  refundRemarks: string,
): Promise<{ status: string; message: string } | null> => {
  try {
    const response = await axios.get(
      `${SSLCOMMERZ_BASE_URL}/validator/api/merchantTransIDvalidationAPI.php`,
      {
        params: {
          bank_tran_id: bankTranId,
          store_id: process.env.SSLCOMMERZ_STORE_ID,
          store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
          refund_amount: refundAmount,
          refund_remarks: refundRemarks,
          format: "json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("SSLCommerz refund error:", error);
    return null;
  }
};
