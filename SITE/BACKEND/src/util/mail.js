import nodemailer from "nodemailer";
import dns from "dns";
import _env9847 from "../config/env.js";
const { env } = _env9847;

let currentTransporter = null;
let currentConfigKey = "";

function getMailFromEmail() {
  const mailFrom = (env.MAIL_FROM || "").trim();
  const bracketAddress = mailFrom.match(/<([^<>]+)>/)?.[1]?.trim();
  if (bracketAddress) return bracketAddress;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailFrom)) return mailFrom;
  if (env.SMTP_USER && env.SMTP_USER.includes("@")) return env.SMTP_USER.trim();
  return "no-reply@thenith.com";
}

function getSenderName(messageType) {
  const names = {
    otp: "Thenith OTP",
    subscription: "Thenith Billing",
    order: "Thenith Orders",
  };
  return names[messageType] || "Thenith";
}

function getFromAddress(messageType) {
  return {
    name: getSenderName(messageType),
    address: getMailFromEmail(),
  };
}

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;

  const configKey = `${env.SMTP_HOST}:${env.SMTP_PORT}:${env.SMTP_USER}:${env.SMTP_PASSWORD}:${env.SMTP_SECURE}`;
  if (currentTransporter && currentConfigKey === configKey) {
    return currentTransporter;
  }

  const isGmail = env.SMTP_HOST.includes("gmail");
  const transportConfig = {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || (Boolean(env.SMTP_SECURE) ? 465 : 587),
    secure: Boolean(env.SMTP_SECURE) || Number(env.SMTP_PORT) === 465,
    pool: true, // Reuse TCP connections for instant sending
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
    connectionTimeout: 8000,
    greetingTimeout: 4000,
    socketTimeout: 8000,
  };

  if (isGmail) {
    transportConfig.lookup = (hostname, options, callback) => {
      dns.lookup(hostname, options, (err, address, family) => {
        if (err && hostname === "smtp.gmail.com") {
          callback(null, "172.253.143.109", 4);
        } else {
          callback(err, address, family);
        }
      });
    };
  }

  currentTransporter = nodemailer.createTransport(transportConfig);
  currentConfigKey = configKey;
  return currentTransporter;
}

async function sendMail({ to, subject, html, text, messageType }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[Mail Warning] SMTP is not configured; unable to send email to ${to}`,
    );
    return false;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(messageType),
      to,
      subject,
      text: text || "Thenith Notification",
      html,
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function sendOtpEmail({ email, code }) {
  await sendMail({
    to: email,
    subject: "Your Thenith verification code",
    text: `Your Thenith verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif"><h2>Thenith verification</h2><p>Your verification code is:</p><strong style="font-size:28px;letter-spacing:8px">${code}</strong><p>This code expires in 10 minutes.</p></div>`,
    messageType: "otp",
  });
}

async function sendSubscriptionEmail({
  email,
  name,
  planName = "Pro",
  billingPeriod = "monthly",
  amount,
  invoiceDate,
  startDate,
  endDate,
  status = "active",
  paymentMethodName,
  fawryCode,
}) {
  if (!email) return;

  const now = new Date();
  const formattedInvoiceDate =
    invoiceDate ||
    now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formattedStartDate =
    startDate ||
    now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const end = new Date(now);
  if (billingPeriod === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  const formattedEndDate =
    endDate ||
    end.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const cleanPlanName =
    planName?.ar ||
    planName?.en ||
    (typeof planName === "string" ? planName : "Pro");
  const subject =
    status === "pending"
      ? `طلب اشتراك جديد - الباقة ${cleanPlanName}`
      : `تم تفعيل الباقة ${cleanPlanName}`;

  const html = `
<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 30px 15px; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
    
    <!-- Clean Header -->
    <div style="background: #0f172a; padding: 25px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: bold;">THENITH</h1>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 14px;">${status === "pending" ? "تفاصيل طلب الاشتراك" : "فاتورة تفعيل الاشتراك"}</p>
    </div>

    <!-- Body -->
    <div style="padding: 25px;">
      <p style="font-size: 16px; margin: 0 0 15px 0;">مرحباً <strong>${name || "عميلنا العزيز"}</strong>،</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        ${status === "pending" ? "تم استلام طلب الاشتراك الخاص بك وهو الآن قيد الانتظار لحين إتمام عملية الدفع. فيما يلي تفاصيل الطلب:" : "تم تفعيل اشتراكك بنجاح. فيما يلي تفاصيل الفاتورة والاشتراك:"}
      </p>

      <!-- Invoice Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #e2e8f0;">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; width: 40%; border-left: 1px solid #e2e8f0;">اسم الباقة</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a;">الباقة ${cleanPlanName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">المبلغ المدفوع</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a;">${amount} ج.م</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">تاريخ الفاتورة</td>
            <td style="padding: 10px 15px; color: #0f172a;">${formattedInvoiceDate}</td>
          </tr>
          ${
            paymentMethodName
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">طريقة الدفع</td>
            <td style="padding: 10px 15px; color: #0f172a;">${paymentMethodName}</td>
          </tr>`
              : ""
          }
          ${
            fawryCode
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">كود الدفع (فوري)</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a;">${fawryCode}</td>
          </tr>`
              : ""
          }
          <tr style="border-bottom: 1px solid #e2e8f0; ${fawryCode ? "" : "background-color: #f8fafc;"}">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">تاريخ بدء الاشتراك</td>
            <td style="padding: 10px 15px; color: #0f172a;">${formattedStartDate}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">تاريخ الانتهاء</td>
            <td style="padding: 10px 15px; color: #0f172a; font-weight: bold;">${formattedEndDate}</td>
          </tr>
        </tbody>
      </table>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">يمكنك الاطلاع على كافة التفاصيل وإدارة حسابك عبر لوحة التحكم.</p>
    </div>
  </div>
</div>
`;

  try {
    const sent = await sendMail({
      to: email,
      subject,
      html,
      messageType: "subscription",
    });
    if (sent) {
    }
  } catch (err) {
    console.error(
      `[Mail] Failed to send subscription email to ${email}:`,
      err.message,
    );
  }
}

async function sendOrderEmail({
  email,
  name,
  orderNumber,
  items = [],
  totalAmount,
  customerAddress,
  orderDate,
  status = "pending",
  paymentMethod,
  fawryCode,
}) {
  if (!email) return;

  const formattedOrderDate =
    orderDate ||
    new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const subject =
    status === "paid"
      ? `تم تأكيد دفع الطلب الخاص بك #${orderNumber} `
      : `تفاصيل الطلب الخاص بك #${orderNumber} `;

  const itemsHtml = items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? "background-color: #f8fafc;" : ""}">
      <td style="padding: 10px 15px; color: #0f172a; border-left: 1px solid #e2e8f0;">${item.name?.ar || item.name?.en || (typeof item.name === "string" ? item.name : "منتج")}</td>
      <td style="padding: 10px 15px; color: #475569; text-align: center; border-left: 1px solid #e2e8f0;">${item.quantity}</td>
      <td style="padding: 10px 15px; color: #0f172a; font-weight: bold; text-align: left;">${item.price * item.quantity} ج.م</td>
    </tr>
  `,
    )
    .join("");

  const html = `
<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 30px 15px; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
    
    <!-- Clean Header -->
    <div style="background: #0f172a; padding: 25px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: bold;">THENITH</h1>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 14px;">فاتورة تفاصيل الطلب</p>
    </div>

    <!-- Body -->
    <div style="padding: 25px;">
      <p style="font-size: 16px; margin: 0 0 15px 0;">مرحباً <strong>${name || "عميلنا العزيز"}</strong>،</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        ${status === "paid" ? "تم تأكيد دفع طلبك بنجاح وجاري العمل على تجهيزه. فيما يلي بيان فاتورة الطلب:" : "تم استلام طلبك بنجاح وهو قيد الانتظار لحين إتمام الدفع. فيما يلي تفاصيل الطلب:"}
      </p>

      <!-- Meta Info Box -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #e2e8f0;">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; width: 40%; border-left: 1px solid #e2e8f0;">رقم الطلب</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a; font-family: monospace;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">تاريخ الطلب</td>
            <td style="padding: 10px 15px; color: #0f172a;">${formattedOrderDate}</td>
          </tr>
          ${
            paymentMethod
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">طريقة الدفع</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a;">${paymentMethod}</td>
          </tr>`
              : ""
          }
          ${
            fawryCode
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #64748b; border-left: 1px solid #e2e8f0;">كود الدفع (فوري)</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #0f172a;">${fawryCode}</td>
          </tr>`
              : ""
          }
        </tbody>
      </table>

      <!-- Items Table -->
      <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">المنتجات المطلوبة:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 10px 15px; text-align: right; font-weight: bold; border-left: 1px solid #334155;">المنتج</th>
            <th style="padding: 10px 15px; text-align: center; font-weight: bold; border-left: 1px solid #334155;">الكمية</th>
            <th style="padding: 10px 15px; text-align: left; font-weight: bold;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Address & Total -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #e2e8f0;">
        <tbody>
          ${
            customerAddress
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #64748b; width: 40%; border-left: 1px solid #e2e8f0;">عنوان الشحن والتوصيل</td>
            <td style="padding: 10px 15px; color: #0f172a;">${customerAddress}</td>
          </tr>`
              : ""
          }
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 15px; font-weight: bold; color: #0f172a; border-left: 1px solid #e2e8f0;">المبلغ الإجمالي</td>
            <td style="padding: 12px 15px; font-weight: bold; color: #0f172a; font-size: 16px;">${totalAmount} ج.م</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</div>
`;

  try {
    const sent = await sendMail({
      to: email,
      subject,
      html,
      messageType: "order",
    });
    if (sent) {
    }
  } catch (err) {
    console.error(
      `[Mail] Failed to send order email to ${email}:`,
      err.message,
    );
  }
}

export default { sendOtpEmail, sendSubscriptionEmail, sendOrderEmail };
