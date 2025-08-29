// app/utils/sendEmail.server.ts
import nodemailer from "nodemailer";

/**
 * Sends an email using Nodemailer
 * @param to - recipient email or array of emails
 * @param subject - subject line of the email
 * @param text - plain text body
 * @param html - HTML body
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}) {
  // Create reusable transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
}
