import { Resend } from "resend";

/**
 * Resend transport.
 *
 * The API key is checked INSIDE sendEmail, not at module load.
 *
 * It used to throw at import time:
 *
 *     const resendApiKey = process.env.RESEND_API_KEY;
 *     if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
 *
 * Because server/index.ts imports this file, that single missing variable took
 * down the ENTIRE API at startup -- every product, category and login request,
 * not just the enquiry form. Deferring the check means a missing key breaks
 * only the thing that actually needs it, and the rest of the site keeps
 * working. The client is also created lazily and reused.
 */
let client: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured, so email cannot be sent. Set it in your environment (see .env.example).",
    );
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.MAIL_FROM || "onboarding@resend.dev";

  const { data, error } = await getResend().emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message || "Failed to send email.");
  }

  return data;
}
