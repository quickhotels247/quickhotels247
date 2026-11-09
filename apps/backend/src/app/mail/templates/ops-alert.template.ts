import type { MailMessage } from "../mail.service.js";
import { escapeHtml, renderEmail } from "./layout.js";

// To the team: something about money or a booking needs a look.
export function opsAlertEmail(to: string, alert: { subject: string; lines: string[]; action?: string; link?: string }): MailMessage {
  return {
    to,
    subject: `[Action needed] ${alert.subject}`,
    text: [...alert.lines, "", ...(alert.action ? [alert.action] : []), ...(alert.link ? [alert.link] : [])].join("\n"),
    html: renderEmail({
      preheader: alert.lines[0] ?? alert.subject,
      heading: alert.subject,
      paragraphs: [...alert.lines.map(escapeHtml), ...(alert.action ? [`<b>${escapeHtml(alert.action)}</b>`] : [])],
      ...(alert.link ? { button: { label: "Open in admin", url: alert.link } } : {}),
    }),
  };
}
