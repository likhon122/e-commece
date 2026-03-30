import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function resolveAppUrl(appUrl?: string): string {
  const baseUrl =
    appUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  return baseUrl.replace(/\/$/, "");
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Mythium <noreply@mythium.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  appUrl?: string,
): Promise<boolean> {
  const baseUrl = resolveAppUrl(appUrl);
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #091413; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDFBF7;">
      <div style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Mythium!</h1>
        <p style="color: #B0E4CC; margin: 10px 0 0; font-size: 14px;">Premium Fashion, Elevated Style</p>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #B0E4CC; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 10px 40px rgba(9, 20, 19, 0.1);">
        <h2 style="color: #091413; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
        <p style="color: #3d3320; font-size: 16px;">Thank you for creating an account with Mythium. To complete your registration and verify your email address, please click the button below:</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 90, 72, 0.3);">Verify Email Address</a>
        </div>
        <p style="color: #5c4d30; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #408A71; font-size: 14px; background: #f0fdf6; padding: 12px; border-radius: 8px;">${verifyUrl}</p>
        <p style="color: #5c4d30; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #B0E4CC; margin: 30px 0;">
        <p style="color: #9c8550; font-size: 12px; text-align: center;">
          If you didn't create an account with Mythium, please ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #9c8550; font-size: 12px; margin: 0;">© 2024 Mythium. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email - Mythium",
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #091413; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDFBF7;">
      <div style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Password Reset</h1>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #B0E4CC; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 10px 40px rgba(9, 20, 19, 0.1);">
        <h2 style="color: #091413; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
        <p style="color: #3d3320; font-size: 16px;">We received a request to reset your password for your Mythium account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 90, 72, 0.3);">Reset Password</a>
        </div>
        <p style="color: #5c4d30; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #408A71; font-size: 14px; background: #f0fdf6; padding: 12px; border-radius: 8px;">${resetUrl}</p>
        <p style="color: #5c4d30; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #B0E4CC; margin: 30px 0;">
        <p style="color: #9c8550; font-size: 12px; text-align: center;">
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #9c8550; font-size: 12px; margin: 0;">© 2024 Mythium. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Mythium",
    html,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  orderDetails: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    total: number;
  },
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderNumber}`;

  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 15px 10px; border-bottom: 1px solid #B0E4CC;">${item.name}</td>
        <td style="padding: 15px 10px; border-bottom: 1px solid #B0E4CC; text-align: center;">${item.quantity}</td>
        <td style="padding: 15px 10px; border-bottom: 1px solid #B0E4CC; text-align: right; font-weight: 600;">৳${item.price.toLocaleString()}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #091413; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDFBF7;">
      <div style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Order Confirmed!</h1>
        <p style="color: #B0E4CC; margin: 10px 0 0; font-size: 14px;">Thank you for shopping with us</p>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #B0E4CC; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 10px 40px rgba(9, 20, 19, 0.1);">
        <h2 style="color: #091413; margin-top: 0; font-size: 24px;">Thank you, ${name}!</h2>
        <p style="color: #3d3320; font-size: 16px;">Your order has been confirmed. Here are your order details:</p>

        <div style="background: linear-gradient(135deg, #f0fdf6 0%, #B0E4CC30 100%); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #5c4d30;"><strong>Order Number:</strong></p>
          <p style="margin: 5px 0 0; font-size: 20px; font-weight: 700; color: #285A48;">${orderNumber}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <thead>
            <tr style="background: #285A48;">
              <th style="padding: 15px 10px; text-align: left; color: white; border-radius: 8px 0 0 0;">Item</th>
              <th style="padding: 15px 10px; text-align: center; color: white;">Qty</th>
              <th style="padding: 15px 10px; text-align: right; color: white; border-radius: 0 8px 0 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 10px; text-align: right; color: #5c4d30;"><strong>Subtotal:</strong></td>
              <td style="padding: 12px 10px; text-align: right; color: #091413;">৳${orderDetails.subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 12px 10px; text-align: right; color: #5c4d30;"><strong>Shipping:</strong></td>
              <td style="padding: 12px 10px; text-align: right; color: #091413;">৳${orderDetails.shipping.toLocaleString()}</td>
            </tr>
            <tr style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); border-radius: 8px;">
              <td colspan="2" style="padding: 15px 10px; text-align: right; color: white; border-radius: 8px 0 0 8px;"><strong>Total:</strong></td>
              <td style="padding: 15px 10px; text-align: right; font-size: 20px; color: white; border-radius: 0 8px 8px 0;"><strong>৳${orderDetails.total.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${orderUrl}" style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 90, 72, 0.3);">View Order</a>
        </div>

        <hr style="border: none; border-top: 1px solid #B0E4CC; margin: 30px 0;">
        <p style="color: #9c8550; font-size: 12px; text-align: center;">
          If you have any questions about your order, please contact our support team.
        </p>
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #9c8550; font-size: 12px; margin: 0;">© 2024 Mythium. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderNumber} - Mythium`,
    html,
  });
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  name: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string,
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderNumber}`;

  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is being processed and will be shipped soon.",
    shipped: `Your order has been shipped${trackingNumber ? `. Tracking Number: ${trackingNumber}` : ""}.`,
    delivered: "Your order has been delivered. Enjoy your purchase!",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded.",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #091413; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDFBF7;">
      <div style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Order Update</h1>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #B0E4CC; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 10px 40px rgba(9, 20, 19, 0.1);">
        <h2 style="color: #091413; margin-top: 0; font-size: 24px;">Hi ${name},</h2>
        <p style="color: #3d3320; font-size: 16px;">Your order <strong>#${orderNumber}</strong> status has been updated:</p>

        <div style="background: linear-gradient(135deg, #f0fdf6 0%, #B0E4CC30 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #5c4d30; text-transform: uppercase; letter-spacing: 1px;">Status</p>
          <p style="margin: 8px 0 0; font-size: 24px; color: #285A48; text-transform: uppercase; font-weight: 700;">${status}</p>
          <p style="margin: 15px 0 0; color: #3d3320; font-size: 14px;">${statusMessages[status] || "Status updated."}</p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${orderUrl}" style="background: linear-gradient(135deg, #285A48 0%, #408A71 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 90, 72, 0.3);">View Order Details</a>
        </div>

        <hr style="border: none; border-top: 1px solid #B0E4CC; margin: 30px 0;">
        <p style="color: #9c8550; font-size: 12px; text-align: center;">
          Thank you for shopping with Mythium!
        </p>
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #9c8550; font-size: 12px; margin: 0;">© 2024 Mythium. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order ${status.charAt(0).toUpperCase() + status.slice(1)} - ${orderNumber} - Mythium`,
    html,
  });
}
