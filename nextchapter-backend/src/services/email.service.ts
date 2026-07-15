import nodemailer from "nodemailer";
import { env } from "../lib/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for port 465, false for other ports (like 587 or 25)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sentEmailsForTesting: SendEmailOptions[] = [];

/**
 * Sends a HTML email using the configured Brevo SMTP transporter.
 */
export async function sendEmail(options: SendEmailOptions) {
  if (process.env.NODE_ENV === "test") {
    sentEmailsForTesting.push(options);
    console.log(`[EmailService] (TEST MODE) Email simulated to: ${options.to}`);
    return { messageId: "test-message-id" };
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    console.log(`[EmailService] Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    throw error;
  }
}
