import { randomUUID } from "node:crypto";

export interface MimeMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

// Headers must be ASCII: anything else goes as an RFC 2047 encoded word.
const header = (value: string) =>
  /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

// "Name <a@b.c>" with a non-ASCII name: encode only the name.
const address = (value: string) => {
  const match = /^(.*)<([^>]+)>\s*$/.exec(value.trim());
  if (!match) return value.trim();
  const name = match[1]!.trim().replace(/^"|"$/g, "");
  return name ? `${header(name)} <${match[2]!.trim()}>` : `<${match[2]!.trim()}>`;
};

// Base64 body lines wrapped at 76 characters, as RFC 2045 asks.
const wrap = (base64: string) => base64.replace(/.{76}(?=.)/g, "$&\r\n");
const body = (value: string) => wrap(Buffer.from(value, "utf8").toString("base64"));
const safeName = (name: string) => name.replace(/[^\w.\-]/g, "_");

// A multipart/alternative email (plain text and HTML) as raw RFC 5322 text;
// with attachments (PDF vouchers, e-tickets), wrapped in multipart/mixed.
export function buildMime(message: MimeMessage): string {
  const boundary = `qh-${randomUUID()}`;
  const mixed = `qh-mixed-${randomUUID()}`;
  const attachments = message.attachments ?? [];
  const lines = [
    `From: ${address(message.from)}`,
    `To: ${address(message.to)}`,
    ...(message.replyTo ? [`Reply-To: ${address(message.replyTo)}`] : []),
    `Subject: ${header(message.subject)}`,
    "MIME-Version: 1.0",
    ...(attachments.length ? [`Content-Type: multipart/mixed; boundary="${mixed}"`, "", `--${mixed}`] : []),
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body(message.text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body(message.html),
    `--${boundary}--`,
    ...attachments.flatMap((file) => [
      `--${mixed}`,
      `Content-Type: ${file.contentType}; name="${safeName(file.filename)}"`,
      `Content-Disposition: attachment; filename="${safeName(file.filename)}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap(file.content.toString("base64")),
    ]),
    ...(attachments.length ? [`--${mixed}--`] : []),
    "",
  ];
  return lines.join("\r\n");
}
