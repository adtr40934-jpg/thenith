import nodemailer from "nodemailer";
import dns from "dns";
import net from "net";
import dotenv from "dotenv";

dotenv.config();

let cachedHostIp = null;
let lastLookupTime = 0;

async function resolveHostIp(hostname) {
  if (!hostname || net.isIP(hostname)) return hostname;
  const now = Date.now();
  if (cachedHostIp && now - lastLookupTime < 300000) {
    return cachedHostIp;
  }
  try {
    const res = await dns.promises.lookup(hostname);
    if (res?.address) {
      cachedHostIp = res.address;
      lastLookupTime = now;
      return res.address;
    }
  } catch (err) {
    console.warn(`[Mail] DNS lookup failed for ${hostname}:`, err.message);
  }
  return hostname;
}

async function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const targetHost = await resolveHostIp(host);

  return nodemailer.createTransport({
    host: targetHost,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      servername: host,
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
  });
}


export const sendOrderStatusEmail = async ({
  email,
  name,
  orderNumber,
  status,
}) => {
  if (!email) return;

  const statusTranslations = {
    received: "تم استلام الطلب وهو جاري المراجعة",
    processing: "جاري تجهيز طلبك",
    shipped: "تم شحن طلبك وهو في الطريق إليك",
    delivered: "تم تسليم الطلب بنجاح",
    returned: "تم تسجيل مرتجع لطلبك",
    cancelled: "تم إلغاء الطلب",
  };

  const arabicStatus = statusTranslations[status] || status;

  const subject = `تحديث حالة طلبك #${orderNumber}`;
  
  const html = `
<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 30px 15px; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
    
    <!-- Header -->
    <div style="background: #0f172a; padding: 25px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: bold;">THENITH</h1>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 14px;">تحديث حالة الطلب</p>
    </div>

    <!-- Body -->
    <div style="padding: 25px;">
      <p style="font-size: 16px; margin: 0 0 15px 0;">مرحباً <strong>${name || "عميلنا العزيز"}</strong>،</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        نود إعلامك بأنه تم تحديث حالة طلبك رقم <strong>#${orderNumber}</strong>.
      </p>

      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; border-right: 4px solid #4f46e5; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1e293b;">
          الحالة الحالية: <span style="color: #4f46e5;">${arabicStatus}</span>
        </p>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
        يمكنك دائماً متابعة تفاصيل طلباتك من خلال لوحة التحكم في حسابك.
        <br><br>
        مع تحيات فريق عمل THENITH.
      </p>
    </div>

  </div>
</div>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM || "Thenith Team"}" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Mail Error] Failed to send order status email to ${email}:`, error.message);
  }
};
