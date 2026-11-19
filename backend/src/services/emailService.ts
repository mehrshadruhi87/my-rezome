import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ delivered: boolean }> {
  const mailer = getTransporter();
  if (!mailer) {
    if (!env.isProduction) {
      console.info(
        `[DEV_EMAIL] To: ${input.to} | Subject: ${input.subject} | Text: ${input.text || ""}`
      );
    }
    return { delivered: false };
  }

  try {
    await mailer.sendMail({
      from: env.smtpFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { delivered: true };
  } catch (err) {
    console.warn(
      "[EMAIL_DELIVERY_WARNING]",
      err instanceof Error ? err.message : err
    );
    if (!env.isProduction) {
      console.info(
        `[DEV_EMAIL_FALLBACK] To: ${input.to} | Subject: ${input.subject} | Text: ${input.text || ""}`
      );
    }
    return { delivered: false };
  }
}
