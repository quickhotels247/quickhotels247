// The QuickHotels24/7 email frame: brand header, a white card, footer. Plain
// tables and inline styles so it renders in Gmail, Outlook and phone apps.

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const BLUE = "#1a56db";
const INK = "#0f172a";
const MUTED = "#64748b";
const FONT = "'Plus Jakarta Sans','Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface EmailLayout {
  // Shown by inboxes next to the subject; not visible in the email.
  preheader: string;
  heading: string;
  // Already-escaped HTML paragraphs.
  paragraphs: string[];
  button?: { label: string; url: string };
  // Small print under the card, already escaped.
  note?: string;
}

export function renderEmail({ preheader, heading, paragraphs, button, note }: EmailLayout): string {
  const site = process.env.FRONTEND_URL?.split(",")[0]?.trim() || "https://quickhotels247.com";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:${FONT};color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="padding:0 4px 20px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${BLUE}">QuickHotels<span style="color:#f5a524">24/7</span></td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px 28px">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:800;letter-spacing:-0.02em;color:${INK}">${escapeHtml(heading)}</h1>
          ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:24px;color:#334155">${p}</p>`).join("\n          ")}
          ${
            button
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="border-radius:10px;background:${BLUE}">
            <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(button.label)}</a>
          </td></tr></table>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:20px 4px 0;font-size:12px;line-height:19px;color:${MUTED}">
          ${note ? `${note}<br><br>` : ""}QuickHotels24/7 · Find. Book. Stay. · <a href="${escapeHtml(site)}" style="color:${MUTED}">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a><br>
          Questions? Reply to this email or write to quickhotels247@gmail.com.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
