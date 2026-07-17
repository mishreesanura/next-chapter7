import nodemailer from "nodemailer";
import { env } from "../lib/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for port 465, false for other ports (like 587 or 25)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10s timeout
  greetingTimeout: 10000 // 10s greeting timeout
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

  // If BREVO_API_KEY is configured, use the Brevo HTTP API (recommended for Vercel)
  if (env.BREVO_API_KEY) {
    try {
      console.log(`[EmailService] Sending email to ${options.to} via Brevo HTTP API...`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { email: env.EMAIL_FROM, name: "NextChapter" },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brevo HTTP API responded with status ${response.status}: ${errorData}`);
      }

      const data = (await response.json()) as { messageId: string };
      console.log(`[EmailService] Email sent successfully via HTTP: ${data.messageId}`);
      return data;
    } catch (error) {
      console.error("[EmailService] Failed to send email via Brevo HTTP API:", error);
      throw error;
    }
  }

  // Otherwise, fall back to standard SMTP transporter
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
