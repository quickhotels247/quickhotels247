import type { MailMessage } from "../mail.service.js";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Matches the site: Times serif, light surface, primary blue.
export function otpEmail(
  to: string,
  firstName: string,
  code: string,
  minutesValid: number,
): MailMessage {
  const name = escapeHtml(firstName);
  return {
    to,
    subject: `${code} is your QuickHotels24/7 verification code`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your QuickHotels24/7 verification code is ${code}.`,
      `It expires in ${minutesValid} minutes.`,
      "",
      "If you didn't try to create a QuickHotels24/7 account, you can ignore this email.",
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#faf8ff;font-family:'Times New Roman',Times,serif;color:#171b26">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 32px rgba(23,27,38,0.06)">
          <tr><td style="font-size:22px;font-weight:bold">QuickHotels24/7</td></tr>
          <tr><td style="padding-top:24px;font-size:16px;line-height:26px">Hi ${name},<br>Use this code to verify your email:</td></tr>
          <tr><td style="padding:24px 0">
            <div style="font-size:34px;letter-spacing:10px;font-weight:bold;text-align:center;background:#f2f3ff;color:#006194;border-radius:12px;padding:16px 0">${code}</div>
          </td></tr>
          <tr><td style="font-size:14px;line-height:22px;color:#3f4850">It expires in ${minutesValid} minutes. If you didn't try to create a QuickHotels24/7 account, you can ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
