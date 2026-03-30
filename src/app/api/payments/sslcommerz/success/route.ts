import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order, User } from "@/lib/db/models";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { tran_id, val_id, status } = data as Record<string, string>;

    if (status !== "VALID") {
      return NextResponse.redirect(
        new URL(
          `/checkout/failed?order=${tran_id}`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Validate payment with SSLCommerz
    const validation = await validateSSLCommerzPayment(val_id);

    if (!validation || validation.status !== "VALID") {
      return NextResponse.redirect(
        new URL(
          `/checkout/failed?order=${tran_id}`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Update order
    const order = await Order.findOne({ orderNumber: tran_id });

    if (!order) {
      return NextResponse.redirect(
        new URL(
          `/checkout/failed?error=order-not-found`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paymentDetails = {
      transactionId: validation.tran_id,
      bankTransactionId: validation.bank_tran_id,
      cardType: validation.card_type,
      cardBrand: validation.card_brand,
      validationId: val_id,
    };
    order.statusHistory.push({
      status: "confirmed",
      note: "Payment received via SSLCommerz",
      updatedAt: new Date(),
    });

    await order.save();

    // Send email notification
    const user = await User.findById(order.user);
    if (user) {
      await sendOrderStatusUpdateEmail(
        user.email,
        user.name,
        order.orderNumber,
        "confirmed",
      );
    }

    return NextResponse.redirect(
      new URL(
        `/checkout/success?order=${order.orderNumber}`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
  } catch (error) {
    console.error("SSLCommerz success error:", error);
    return NextResponse.redirect(
      new URL(
        `/checkout/failed?error=processing-error`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
  }
}
