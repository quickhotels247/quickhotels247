import { randomUUID } from "node:crypto";

export interface MimeMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
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
const body = (value: string) => Buffer.from(value, "utf8").toString("base64").replace(/.{76}(?=.)/g, "$&\r\n");

// A multipart/alternative email (plain text and HTML) as raw RFC 5322 text.
export function buildMime(message: MimeMessage): string {
  const boundary = `qh-${randomUUID()}`;
  const lines = [
    `From: ${address(message.from)}`,
    `To: ${address(message.to)}`,
    ...(message.replyTo ? [`Reply-To: ${address(message.replyTo)}`] : []),
    `Subject: ${header(message.subject)}`,
    "MIME-Version: 1.0",
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
    "",
  ];
  return lines.join("\r\n");
}
