import "server-only";

// Minimal email sender. Uses Resend's HTTP API when RESEND_API_KEY is set
// (no SDK dependency — a single fetch). With no key it is a no-op that reports
// `sent: false`, so callers can fall back gracefully (e.g. surface the reset
// link in development) without crashing.

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  // Override with EMAIL_FROM once a verified domain is set up in Resend.
  return process.env.EMAIL_FROM || "Cornerstone People <onboarding@resend.dev>";
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: "No email provider configured." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [args.to],
        subject: args.subject,
        text: args.text,
        ...(args.html ? { html: args.html } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Email send failed (${res.status}): ${body}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: (err as Error).message };
  }
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
