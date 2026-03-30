import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Order, User } from "@/lib/db/models";
import { executeBkashPayment } from "@/lib/payments/bkash";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get("paymentID");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");

    if (status !== "success" || !paymentID) {
      return NextResponse.redirect(
        new URL(
          `/checkout/failed?reason=bkash-${status || "error"}`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Execute the payment
    const execution = await executeBkashPayment(paymentID);

    if (
      !execution ||
      execution.statusCode !== "0000" ||
      execution.transactionStatus !== "Completed"
    ) {
      return NextResponse.redirect(
        new URL(
          `/checkout/failed?reason=bkash-execution-failed`,
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // Update order
    const order = await Order.findById(orderId);

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
      transactionId: execution.paymentID,
      bankTransactionId: execution.trxID,
    };
    order.statusHistory.push({
      status: "confirmed",
      note: "Payment received via bKash",
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
    console.error("bKash callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/checkout/failed?error=processing-error`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
  }
}
