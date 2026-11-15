import nodemailer from "nodemailer";

// Password-reset email through a Gmail account with an app password
// (SMTP_USER / SMTP_PASS). If those aren't set, nothing is sent and the
// caller tells the user to ask an organizer instead.

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendResetEmail(to: string, name: string, link: string): Promise<void> {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: `Trojan JobMatch <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your Trojan JobMatch password",
    text:
      `Hi ${name},\n\nSomeone asked to reset your Trojan JobMatch password. ` +
      `Open this link within 30 minutes to choose a new one:\n\n${link}\n\n` +
      `If it wasn't you, ignore this email and your password stays the same.\n\nFight on,\nTrojan JobMatch`,
  });
}
